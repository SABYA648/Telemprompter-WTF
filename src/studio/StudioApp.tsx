import { useEffect, useRef, useState } from 'preact/hooks';
import type { SCRIPT_SIZE_BUCKETS } from '../domain/analytics';
import { analytics, deviceClass, displayMode, studioEntry } from '../domain/analytics';
import { parseMarkup } from '../domain/studio/markup';
import { presetById } from '../content/studio/presets';
import { starterById } from '../content/studio/starterScripts';
import {
  applySessionPreset,
  applySessionTarget,
  endSessionTarget,
} from '../domain/studio/settings';
import type { StudioPreset } from '../content/studio/types';
import {
  migrateQuickScript,
  listScripts,
  ensureFirstScript,
  createScript,
  getScript,
  saveScript,
  softDelete,
  restoreScript,
  duplicateScript,
  purgeDeletedScripts,
} from '../domain/studio/scriptsRepo';
import type { ScriptStatus, StudioScript } from '../domain/studio/types';
import { durationAtWpm, fitForTarget, sectionDurations } from '../domain/studio/timing';
import { readabilityWarning } from '../domain/studio/words';
import { isMemoryStorage } from '../domain/studio/db';
import { moveInQueue, upNext, setUpNext } from '../domain/studio/queue';
import BatchScreen from './BatchScreen';
import { limits, verifiedOn } from '../content/studio/platformFacts';
import { TemplatePicker, HookPicker, IdeasInbox, createFromTemplate } from './CreatorTools';
import { SendToPhone, ReceiveScreen } from './SendReceive';
import { isStandaloneDisplay } from '../domain/studio/install';
import { persistOnFirstStandaloneLaunch } from '../domain/studio/storage';
import { routeFromHash, bootHash, type Route } from './router';
import { showsTabs, tabItems, type TabId } from './tabs';
import { Overflow } from './Overflow';
import OperatorWindow from './OperatorWindow';
import { PrintableScript, useEditorBroadcast, useScriptImport } from './ScriptTools';
import { openOperatorWindow } from '../domain/studio/operator';
import { Icon, type IconName } from './Icons';
import RecordScreen from './RecordScreen';
import PracticeScreen from './PracticeScreen';
import SettingsScreen from './SettingsScreen';
import { TakesScreen, TakeScreen } from './TakesScreen';
import { recoverTakes } from '../domain/studio/takesRepo';
import { readHabits } from '../domain/studio/habits';
import { readStreak } from '../domain/studio/streak';
import InstallSheet from './InstallSheet';
import {
  BadgeToast,
  ChallengeScreen,
  HabitProgress,
  HabitSummary,
  HomeAsk,
  TodayCard,
  useHabits,
  WeeklyRecap,
} from './HabitUI';
import { experimentArms } from '../domain/studio/experiments';
import { ServiceWorkerUpdate, StandaloneTransferCard, TransferControls } from './PwaControls';
import {
  browserHandoffScript,
  browserHandoffUrl,
  isInAppBrowser,
} from '../domain/studio/inAppBrowser';

function go(path: string): void {
  location.hash = path;
}
const editedThisSession = new Set<string>();
const wordBucket = (words: number): (typeof SCRIPT_SIZE_BUCKETS)[number] =>
  words <= 100
    ? '1_100'
    : words <= 300
      ? '101_300'
      : words <= 750
        ? '301_750'
        : words <= 1500
          ? '751_1500'
          : '1501_plus';
const TARGET_CHIPS = [15, 30, 60, 90, 180];
const FORMAT = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Handle `#/scripts/new`, with `?template=<id>` when a template page or picker sent the visitor. */
async function createRoutedScript(): Promise<StudioScript> {
  const templateId = new URLSearchParams(location.hash.split('?')[1] ?? '').get('template');
  const fromTemplate = templateId ? await createFromTemplate(templateId) : null;
  if (fromTemplate) return fromTemplate;
  analytics.track('created_script', { source: 'blank' });
  return createScript();
}

/** The operator window is a bare prompter for a second screen: no shell, no boot, no tabs. */
export default function StudioRoot(): preact.JSX.Element {
  return routeFromHash(location.hash).screen === 'prompter-window' ? (
    <OperatorWindow />
  ) : (
    <StudioApp />
  );
}
function StudioApp(): preact.JSX.Element {
  const [route, setRoute] = useState<Route>(routeFromHash(location.hash));
  const [scripts, setScripts] = useState<StudioScript[]>([]);
  const [ready, setReady] = useState(false);
  const [memory, setMemory] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [transferResult, setTransferResult] = useState('');
  const [presetChoice, setPresetChoice] = useState<StudioPreset | null>(null);
  // Record starts on its live camera, which has no tab bar; its permission and error screens do.
  const [cameraLive, setCameraLive] = useState(true);
  const presetDialog = useRef<HTMLElement>(null);
  const refreshRequest = useRef(0);
  const refresh = async () => {
    const request = ++refreshRequest.current;
    const result = await listScripts(true);
    if (request === refreshRequest.current) setScripts(result);
  };
  useEffect(() => {
    let identifiedBuckets = '';
    let identityReady = false;
    const bucketPair = () => {
      try {
        return `${localStorage.getItem('tw.takes_bucket')}/${localStorage.getItem('tw.streak_bucket')}`;
      } catch {
        return '';
      }
    };
    const refreshIdentity = () => {
      if (!identityReady) return;
      const next = bucketPair();
      if (next !== identifiedBuckets) {
        identifiedBuckets = next;
        analytics.identify();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible')
        void Promise.all([readHabits(), readStreak()])
          .then(refreshIdentity)
          .catch((error) => analytics.error('studio', error));
    };
    const boot = async () => {
      // Read before the handoff or preset handling below rewrites the URL.
      const entry = studioEntry();
      try {
        const presetId = new URLSearchParams(location.search).get('preset');
        const preset = presetId ? presetById.get(presetId as StudioPreset['id']) : undefined;
        let libraryWasEmpty = false;
        let presetScriptId = 'quick';
        if (preset && !location.hash)
          applySessionPreset({ aspect: preset.aspect, safeZone: preset.safeZone });
        try {
          await migrateQuickScript();
          await purgeDeletedScripts();
          libraryWasEmpty = preset ? (await listScripts()).length === 0 : false;
          if (preset && libraryWasEmpty) {
            const starter = starterById.get(preset.starterId);
            // A trashed `quick` still owns its id and takes, so never overwrite it.
            const quickTaken = Boolean(await getScript('quick'));
            if (starter)
              presetScriptId = (
                await createScript({
                  ...(quickTaken ? {} : { id: 'quick' }),
                  title: starter.title,
                  body: starter.body,
                  aspect: preset.aspect,
                  targetSeconds: preset.targetSeconds,
                })
              ).id;
          }
          await ensureFirstScript();
          await experimentArms();
          await Promise.all([readHabits(), readStreak()]);
        } finally {
          identifiedBuckets = bucketPair();
          analytics.initialize();
          identityReady = true;
        }
        try {
          if (!isMemoryStorage()) localStorage.setItem('studio.hasData', '1');
        } catch {
          /* Storage unavailable. */
        }
        const transfer = sessionStorage.getItem('studio.transfer.result');
        if (transfer) {
          setTransferResult(transfer);
          sessionStorage.removeItem('studio.transfer.result');
          // Tracked after the reload, so the event survives it and carries the imported device id.
          analytics.track('transferred_scripts', { direction: 'import' });
        }
        await persistOnFirstStandaloneLaunch(isStandaloneDisplay());
        const handoff = browserHandoffScript(location.hash);
        if (handoff) {
          const imported = await createScript(handoff);
          history.replaceState(null, '', `#/record/${imported.id}`);
          setRoute({ screen: 'record', id: imported.id });
        }
        const recoveredTakes = await recoverTakes();
        if (recoveredTakes.length) {
          setRecovered(true);
          for (let index = 0; index < recoveredTakes.length; index++)
            analytics.track('recovered_take');
        }
        if (routeFromHash(location.hash).id === 'new') {
          const script = await createRoutedScript();
          go(`/scripts/${script.id}`);
        }
        await refresh();
        if (preset && !location.hash) {
          history.replaceState(null, '', '/studio');
          if (libraryWasEmpty) go(`/record/${presetScriptId}`);
          else setPresetChoice(preset);
        }
        const boot = bootHash(location.search);
        if (boot && !location.hash) location.hash = boot;
        analytics.track('opened_studio', {
          // A same-origin page that sent a handoff keeps its entry; only a bare link counts as link.
          entry: handoff && entry === 'direct' ? 'link' : entry,
          display: displayMode(),
          device_class: deviceClass(),
        });
      } catch (error) {
        analytics.error('studio', error);
      } finally {
        setMemory(isMemoryStorage());
        setReady(true);
      }
    };
    void boot();
    const onHash = async () => {
      const next = routeFromHash(location.hash);
      setPresetChoice(null);
      if (next.screen === 'editor' && next.id === 'new') {
        const script = await createRoutedScript();
        await refresh();
        go(`/scripts/${script.id}`);
      } else {
        setRoute(next);
        // The nav Record follows the latest edit, so any screen with the tab bar wants fresh scripts.
        if (next.screen !== 'record' && next.screen !== 'practice') await refresh();
      }
    };
    addEventListener('hashchange', onHash);
    addEventListener('studio-streak-changed', refreshIdentity);
    addEventListener('studio-habits-changed', refreshIdentity);
    document.addEventListener('visibilitychange', onVisible);
    // Effects run after paint, so a hash change since the first render has no listener to catch it.
    const latest = routeFromHash(location.hash);
    setRoute((route) =>
      route.screen === latest.screen && route.id === latest.id ? route : latest,
    );
    return () => {
      removeEventListener('hashchange', onHash);
      removeEventListener('studio-streak-changed', refreshIdentity);
      removeEventListener('studio-habits-changed', refreshIdentity);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  useEffect(() => {
    if (ready)
      analytics.page(
        `#/` +
          (route.screen === 'home'
            ? ''
            : route.screen === 'editor'
              ? `scripts/${route.id}`
              : `${route.screen}${route.id ? `/${route.id}` : ''}`),
        'Studio',
      );
  }, [route, ready]);
  useEffect(() => {
    if (presetChoice) presetDialog.current?.querySelector<HTMLElement>('button')?.focus();
  }, [presetChoice]);
  if (!ready)
    return (
      <div class="studio-loading" aria-live="polite">
        Loading Studio...
      </div>
    );
  const active = scripts.filter((script) => !script.deletedAt);
  const deleted = scripts.filter((script) => script.deletedAt);
  const openPresetScript = async (preset: StudioPreset, script?: StudioScript) => {
    const starter = starterById.get(preset.starterId);
    // 14.6: an existing script keeps its saved target; the preset target applies to this session.
    if (script) applySessionTarget({ id: script.id, seconds: preset.targetSeconds });
    const chosen =
      script ??
      (await createScript({
        title: starter?.title ?? preset.name,
        body: starter?.body ?? '',
        aspect: preset.aspect,
        targetSeconds: preset.targetSeconds,
      }));
    setPresetChoice(null);
    await refresh();
    go(`/record/${chosen.id}`);
  };
  const inApp = isInAppBrowser(navigator.userAgent);
  const handoffScript = active.find((script) => script.id === route.id) ?? active[0] ?? null;
  return (
    <div class={showsTabs(route, cameraLive) ? 'studio-shell' : 'studio-shell is-full-bleed'}>
      <ServiceWorkerUpdate hidden={route.screen === 'record'} />
      <BadgeToast />
      <InstallSheet recording={route.screen === 'record' || !!presetChoice} />
      {presetChoice && (
        <div class="studio-preset-backdrop" role="presentation">
          <section
            ref={presetDialog}
            class="studio-preset-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preset-choice-title"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setPresetChoice(null);
                return;
              }
              if (event.key !== 'Tab') return;
              const buttons = [...(presetDialog.current?.querySelectorAll('button') ?? [])];
              if (event.shiftKey && document.activeElement === buttons[0]) {
                event.preventDefault();
                buttons.at(-1)?.focus();
              } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {
                event.preventDefault();
                buttons[0]?.focus();
              }
            }}
          >
            <p class="eyebrow">{presetChoice.name} preset</p>
            <h2 id="preset-choice-title">Choose a script to record</h2>
            <p>
              We set the {presetChoice.aspect} frame,{' '}
              {presetChoice.targetSeconds
                ? `${presetChoice.targetSeconds} second target`
                : 'open duration'}{' '}
              and recording safe zone for this session. Your saved scripts and settings stay as they
              are.
            </p>
            <button class="studio-button" onClick={() => void openPresetScript(presetChoice)}>
              Use starter
            </button>
            {active.length > 0 && (
              <>
                <h3>Use my script</h3>
                <ul>
                  {active.map((script) => (
                    <li>
                      <button
                        class="studio-button studio-button--quiet"
                        onClick={() => void openPresetScript(presetChoice, script)}
                      >
                        {script.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button
              class="studio-button studio-button--quiet"
              onClick={() => setPresetChoice(null)}
            >
              Not now
            </button>
          </section>
        </div>
      )}
      {inApp && route.screen !== 'record' && (
        <div class="studio-storage-warning" role="status">
          Instagram's browser can't record video. Open this page in{' '}
          {/Android/i.test(navigator.userAgent) ? 'Chrome' : 'Safari'}.
          <button
            class="studio-button studio-button--quiet"
            onClick={() =>
              void navigator.clipboard.writeText(browserHandoffUrl(location.origin, handoffScript))
            }
          >
            Copy link with script
          </button>
        </div>
      )}
      {memory && (
        <p class="studio-storage-warning" role="status">
          Private browsing: takes are lost when you close this tab.
        </p>
      )}
      {recovered && (
        <p
          class={`studio-storage-warning ${route.screen === 'record' ? 'studio-recovery-notice' : ''}`}
          role="status"
        >
          We recovered a take from your last session. <a href="#/takes">View take</a>
        </p>
      )}
      {transferResult && (
        <p class="studio-storage-warning" role="status">
          {transferResult}
        </p>
      )}
      {route.screen === 'home' && <Home scripts={active} />}
      {route.screen === 'inbox' && <IdeasInbox refreshScripts={refresh} />}
      {route.screen === 'receive' && <ReceiveScreen code={route.id ?? ''} />}
      {route.screen === 'batch' && <BatchScreen />}
      {route.screen === 'challenge' && <ChallengeScreen />}
      {route.screen === 'scripts' && (
        <Scripts scripts={active} deleted={deleted} refresh={refresh} />
      )}
      {route.screen === 'editor' && <Editor id={route.id ?? ''} refresh={refresh} />}
      {route.screen === 'record' && (
        <RecordScreen id={route.id ?? 'quick'} memory={memory} onCameraLive={setCameraLive} />
      )}
      {route.screen === 'practice' && <PracticeScreen id={route.id ?? ''} />}
      {route.screen === 'take' && <TakeScreen id={route.id ?? ''} />}
      {route.screen === 'takes' && <TakesScreen />}
      {route.screen === 'settings' && <SettingsScreen section={route.id} />}
      {route.screen === 'settings' && !route.id && (
        <div class="studio-screen">
          <TransferControls />
        </div>
      )}
      {showsTabs(route, cameraLive) && <Tabs route={route} scripts={active} />}
    </div>
  );
}

const TAB_ICONS: Record<TabId, IconName> = {
  home: 'home',
  scripts: 'script',
  record: 'camera',
  takes: 'takes',
  settings: 'settings',
};
function Tabs({ route, scripts }: { route: Route; scripts: StudioScript[] }) {
  return (
    <nav class="studio-tabs" aria-label="Studio navigation">
      {tabItems(route, scripts).map((tab) => (
        <a
          class={[tab.id === 'record' ? 'studio-record-link' : '', tab.current ? 'is-active' : '']
            .filter(Boolean)
            .join(' ')}
          href={tab.href}
          aria-current={tab.current ? 'page' : undefined}
        >
          <Icon name={TAB_ICONS[tab.id]} />
          <span class={tab.id === 'record' ? 'studio-visually-hidden' : ''}>{tab.label}</span>
        </a>
      ))}
    </nav>
  );
}
function Home({ scripts }: { scripts: StudioScript[] }) {
  const habits = useHabits();
  const firstRun =
    scripts.length === 1 &&
    scripts[0]?.id === 'quick' &&
    scripts[0]?.title === 'Introduce yourself in 30 seconds' &&
    scripts[0]?.takeCount === 0;
  const quick = scripts.find((script) => script.id === 'quick') ?? scripts[0];
  const queue = upNext(scripts);
  const shownNext = (queue.length ? queue : scripts).slice(0, 3);
  return (
    <section class="studio-screen studio-home">
      <div class="studio-home__top">
        <h1>{firstRun ? 'Record your first video in 60 seconds' : 'Welcome back'}</h1>
        <HabitSummary {...habits} firstRun={firstRun} />
      </div>
      {/* Above the fold: streak chip, Today's prompt, Up next. Everything else waits below. */}
      <TodayCard settings={habits.settings} />
      {shownNext.length > 0 && (
        <section class="studio-up-next" aria-label="Up next">
          <div class="studio-section-head">
            <h2>Up next</h2>
            {queue.length >= 2 && (
              <a class="studio-pill" href="#/batch">
                Start batch
              </a>
            )}
            {queue[0] && (
              <a class="studio-pill" href="#/record/next">
                Record next
              </a>
            )}
          </div>
          <div class="studio-list">
            {shownNext.map((script) => (
              <article class="studio-next-row" key={script.id}>
                <a href={`#/scripts/${script.id}`}>
                  <strong>{script.title || 'Untitled script'}</strong>
                  <small>{parseMarkup(script.body).spokenWordCount} spoken words</small>
                </a>
                <a
                  class="studio-round-action"
                  href={`#/record/${script.id}`}
                  aria-label={`Record ${script.title || 'Untitled script'}`}
                >
                  <Icon name="camera" />
                </a>
              </article>
            ))}
          </div>
          <a class="studio-text-link" href="#/scripts">
            All scripts
          </a>
        </section>
      )}
      <nav class="studio-icon-row" aria-label="Create tools">
        {(
          [
            ['#/scripts/new', 'plus', 'Script'],
            ['#/inbox', 'idea', 'Idea'],
            ['#/scripts?templates=1', 'grid', 'Templates'],
            [`#/practice/${quick?.id ?? 'quick'}`, 'play', 'Practice'],
          ] as [string, IconName, string][]
        ).map(([href, icon, label]) => (
          <a href={href} key={label}>
            <Icon name={icon} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
      <HomeAsk {...habits} />
      <WeeklyRecap {...habits} />
      <HabitProgress {...habits} />
      <StandaloneTransferCard empty={firstRun} />
    </section>
  );
}
function Scripts({
  scripts,
  deleted,
  refresh,
}: {
  scripts: StudioScript[];
  deleted: StudioScript[];
  refresh: () => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | ScriptStatus>('all');
  const [notice, setNotice] = useState('');
  const statusRef = useRef<HTMLParagraphElement>(null);
  const visible = scripts.filter(
    (script) =>
      `${script.title} ${script.body}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === 'all' || script.status === status),
  );
  const statusCount = (value: ScriptStatus) =>
    scripts.filter((script) => script.status === value).length;
  const add = async () => {
    const script = await createScript();
    analytics.track('created_script', { source: 'blank' });
    await refresh();
    go(`/scripts/${script.id}`);
  };
  const importer = useScriptImport(async (script) => {
    await refresh();
    go(`/scripts/${script.id}`);
  });
  const queue = upNext(scripts);
  const queueIds = queue.map((item) => item.id);
  const changeQueue = async (ids: string[]) => {
    await setUpNext(ids);
    await refresh();
  };
  return (
    <section class="studio-screen">
      <div class="studio-screen-heading">
        <div>
          <h1>Scripts</h1>
        </div>
        <div class="studio-heading-actions">
          <button
            class="studio-button studio-button--quiet studio-icon-button"
            aria-label="New script"
            onClick={() => void add()}
          >
            <Icon name="plus" />
          </button>
          <Overflow label="More library actions">
            <button onClick={importer.pick}>
              <Icon name="import" size={18} /> Import file
            </button>
          </Overflow>
        </div>
        {importer.element}
      </div>
      {importer.status && <p role="status">{importer.status}</p>}
      <TemplatePicker
        onCreated={() => void refresh()}
        open={new URLSearchParams(location.hash.split('?')[1] ?? '').has('templates')}
      />
      {queue.length > 0 && (
        <section class="studio-card">
          <h2>Up next</h2>
          <p>Choose the order for your next recording session.</p>
          <ol class="studio-row-list">
            {queue.map((script, index) => (
              <li class="studio-row" key={script.id}>
                <span class="studio-row__title">{script.title || 'Untitled script'}</span>
                <div class="studio-row__actions">
                  <button
                    class="studio-chip"
                    aria-label={`Move ${script.title} up`}
                    disabled={index === 0}
                    onClick={() => void changeQueue(moveInQueue(queueIds, index, -1))}
                  >
                    Move up
                  </button>
                  <button
                    class="studio-chip"
                    aria-label={`Move ${script.title} down`}
                    disabled={index === queue.length - 1}
                    onClick={() => void changeQueue(moveInQueue(queueIds, index, 1))}
                  >
                    Move down
                  </button>
                  <button
                    class="studio-chip"
                    aria-label={`Remove ${script.title} from Up next`}
                    onClick={() => void changeQueue(queueIds.filter((id) => id !== script.id))}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
          {queue.length >= 2 && (
            <div class="studio-actions">
              <a class="studio-button" href="#/batch">
                Start batch
              </a>
            </div>
          )}
        </section>
      )}
      <div class="studio-filter-row">
        <input
          type="search"
          aria-label="Search scripts"
          value={query}
          onInput={(event) => setQuery((event.target as HTMLInputElement).value)}
          placeholder="Search scripts"
        />
        <select
          aria-label="Status"
          value={status}
          onChange={(event) =>
            setStatus((event.target as HTMLSelectElement).value as typeof status)
          }
        >
          <option value="all">All ({scripts.length})</option>
          <option value="idea">Idea ({statusCount('idea')})</option>
          <option value="draft">Draft ({statusCount('draft')})</option>
          <option value="ready">Ready ({statusCount('ready')})</option>
          <option value="recorded">Recorded ({statusCount('recorded')})</option>
          <option value="posted">Posted ({statusCount('posted')})</option>
        </select>
      </div>
      <p
        class="studio-visually-hidden"
        aria-live="polite"
        role={notice ? 'status' : undefined}
        tabIndex={-1}
        ref={statusRef}
      >
        {notice}
      </p>
      <div class="studio-list">
        {visible.map((script) => (
          <ScriptCard
            key={script.id}
            script={script}
            queued={queueIds.includes(script.id)}
            onQueue={() => void changeQueue([...queueIds, script.id])}
            onDuplicate={async () => {
              await duplicateScript(script.id);
              await refresh();
            }}
            onDelete={async () => {
              await softDelete(script.id);
              await refresh();
              setNotice(`${script.title || 'Untitled script'} moved to Recently deleted.`);
              statusRef.current?.focus();
            }}
          />
        ))}
      </div>
      {!visible.length && <p>No scripts match.</p>}
      {deleted.length > 0 && (
        <section class="studio-deleted">
          <h2>Recently deleted</h2>
          <ul class="studio-row-list">
            {deleted.map((script) => (
              <li class="studio-row" key={script.id}>
                <span class="studio-row__title">{script.title || 'Untitled script'}</span>
                <div class="studio-row__actions">
                  <button
                    class="studio-chip"
                    onClick={async () => {
                      await restoreScript(script.id);
                      await refresh();
                    }}
                  >
                    Restore
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
const STATUS_LABELS: Record<ScriptStatus, string> = {
  idea: 'Idea',
  draft: 'Draft',
  ready: 'Ready',
  recorded: 'Recorded',
  posted: 'Posted',
};
/** Library row: title and details lead; one round record action; the rest sit in a ... menu. */
function ScriptCard({
  script,
  queued,
  onQueue,
  onDuplicate,
  onDelete,
}: {
  script: StudioScript;
  queued: boolean;
  onQueue: () => void;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const opened = useRef(false);
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (opened.current) menuRef.current?.focus();
    opened.current = confirming;
  }, [confirming]);
  const title = script.title || 'Untitled script';
  const words = parseMarkup(script.body).spokenWordCount;
  // Non-breaking spaces keep each detail whole, so lines only break between details.
  const details = [
    `${words}\u00a0words`,
    FORMAT(durationAtWpm(words, 140)),
    STATUS_LABELS[script.status],
    `Updated\u00a0${new Date(script.updatedAt).toLocaleDateString()}`,
  ].join('\u00a0· ');
  return (
    <article class="studio-script-card">
      <a class="studio-script-card__main" href={`#/scripts/${script.id}`}>
        <strong class="studio-script-card__title">{title}</strong>
        <span class="studio-script-card__meta">{details}</span>
      </a>
      <a
        class="studio-round-action studio-script-card__record"
        href={`#/record/${script.id}`}
        aria-label={`Record ${title}`}
      >
        <Icon name="camera" />
      </a>
      {confirming ? (
        <div
          class="studio-script-card__confirm"
          role="group"
          aria-label={`Delete ${title}?`}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setConfirming(false);
          }}
        >
          <span>Delete this script?</span>
          <button ref={cancelRef} class="studio-chip" onClick={() => setConfirming(false)}>
            Cancel
          </button>
          <button
            class="studio-chip studio-chip--danger-solid"
            aria-label={`Confirm delete ${title}`}
            onClick={() => void onDelete()}
          >
            Delete
          </button>
        </div>
      ) : (
        <Overflow label={`More actions for ${title}`} summaryRef={menuRef}>
          <button
            aria-label={queued ? `${title} is in Up next` : `Add to Up next: ${title}`}
            disabled={queued}
            onClick={onQueue}
          >
            <Icon name="plus" size={18} /> {queued ? 'In Up next' : 'Up next'}
          </button>
          <button aria-label={`Duplicate ${title}`} onClick={() => void onDuplicate()}>
            <Icon name="copy" size={18} /> Duplicate
          </button>
          <button aria-label={`Delete ${title}`} onClick={() => setConfirming(true)}>
            <Icon name="trash" size={18} /> Delete
          </button>
        </Overflow>
      )}
    </article>
  );
}
function Editor({ id, refresh }: { id: string; refresh: () => Promise<void> }) {
  const [script, setScript] = useState<StudioScript | null>(null);
  const [saved, setSaved] = useState('Loading...');
  const [showSend, setShowSend] = useState(false);
  const [operatorOn, setOperatorOn] = useState(false);
  const [notice, setNotice] = useState('');
  const [customTarget, setCustomTarget] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const currentRef = useRef<StudioScript | null>(null);
  const pendingRef = useRef(false);
  const sequenceRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeRef = useRef<Promise<void>>(Promise.resolve());
  const persist = (snapshot: StudioScript, sequence: number) => {
    const operation = writeRef.current.then(() => saveScript(snapshot));
    writeRef.current = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation.then(() => {
      if (sequence === sequenceRef.current) {
        pendingRef.current = false;
        setSaved('Saved');
      }
      if (!editedThisSession.has(snapshot.id)) {
        editedThisSession.add(snapshot.id);
        analytics.track('edited_script', {
          words_bucket: wordBucket(parseMarkup(snapshot.body).spokenWordCount),
        });
      }
      void refresh();
    });
  };
  const flush = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!pendingRef.current || !currentRef.current) return;
    const sequence = ++sequenceRef.current;
    await persist(currentRef.current, sequence);
  };
  const edit = (next: StudioScript) => {
    currentRef.current = next;
    pendingRef.current = true;
    sequenceRef.current++;
    setScript(next);
  };
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current && currentRef.current)
        void persist(currentRef.current, ++sequenceRef.current);
    },
    [id],
  );
  useEffect(() => {
    setScript(null);
    setSaved('Loading...');
    void getScript(id).then((item) => {
      currentRef.current = item ?? null;
      pendingRef.current = false;
      setScript(item ?? null);
    });
  }, [id]);
  useEffect(() => {
    if (!script || !pendingRef.current) return;
    const sequence = sequenceRef.current;
    setSaved('Saving...');
    timerRef.current = setTimeout(() => {
      void persist(script, sequence).catch((error) => {
        analytics.error('studio', error);
        setSaved('Save failed');
      });
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [script]);
  useEditorBroadcast(script?.body, operatorOn);
  const importer = useScriptImport(async (imported) => {
    await flush();
    await refresh();
    go(`/scripts/${imported.id}`);
  });
  const insert = (value: string) => {
    const el = bodyRef.current;
    if (!el || !script) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = script.body.slice(start, end);
    let inserted = value;
    if (value === '# ' || value === '// ') {
      const lineStart = script.body.lastIndexOf('\n', start - 1) + 1;
      const prefix = start === lineStart ? '' : '\n';
      inserted = `${prefix}${value}`;
    } else if (value === '**text**' && selected) inserted = `**${selected}**`;
    else if (value === '==text==' && selected) inserted = `==${selected}==`;
    edit({ ...script, body: script.body.slice(0, start) + inserted + script.body.slice(end) });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + inserted.length;
    });
  };
  if (!script)
    return <Placeholder title="Script not found" text="This script may have been deleted." />;
  const parsed = parseMarkup(script.body);
  const sections = sectionDurations(parsed.sections, 140);
  const setTarget = (targetSeconds: number) => {
    endSessionTarget(script.id);
    edit({ ...script, targetSeconds });
  };
  const placeholders = (script.body.match(/\{[^}]+\}/g) ?? []).length;
  return (
    <section class="studio-screen studio-editor">
      <a class="studio-back" href="#/scripts">
        Scripts
      </a>
      <div class="studio-screen-heading">
        <h1>Editor</h1>
        <span aria-live="polite">{saved}</span>
      </div>
      <label class="studio-label">
        Title
        <input
          value={script.title}
          onInput={(event) => edit({ ...script, title: (event.target as HTMLInputElement).value })}
        />
      </label>
      <div class="studio-toolbar" role="group" aria-label="Markup tools">
        <Overflow label="Format" icon="format">
          <button onClick={() => insert('# ')}>Section</button>
          <button onClick={() => insert('[pause]')}>Pause</button>
          <button onClick={() => insert('**text**')}>Emphasis</button>
          <button onClick={() => insert('==text==')}>Highlight</button>
          <button onClick={() => insert('// ')}>Note</button>
        </Overflow>
        <label class="studio-cue-label">
          Cue
          <select
            aria-label="Cue"
            value=""
            onChange={(event) => {
              const value = (event.target as HTMLSelectElement).value;
              if (value) insert(`[${value}]`);
              (event.target as HTMLSelectElement).value = '';
            }}
          >
            <option value="">Choose cue</option>
            {['breathe', 'smile', 'look up', 'slow', 'cut'].map((cue) => (
              <option value={cue}>{cue}</option>
            ))}
          </select>
        </label>
      </div>
      <label class="studio-label">
        Script
        <textarea
          id="studio-body"
          ref={bodyRef}
          value={script.body}
          onInput={(event) =>
            edit({ ...script, body: (event.target as HTMLTextAreaElement).value })
          }
          placeholder="Write your script"
        />
      </label>
      <HookPicker insert={insert} />
      <div class="studio-stats">
        <span>{parsed.spokenWordCount} spoken words</span>
        <span>{FORMAT(durationAtWpm(parsed.spokenWordCount, 140))} at 140 WPM</span>
      </div>
      <div class="studio-target-row" role="group" aria-label="Target length">
        {TARGET_CHIPS.map((target) => (
          <button
            type="button"
            class={`studio-toggle fit-${fitForTarget(parsed.spokenWordCount, target, 140)}`}
            aria-pressed={script.targetSeconds === target}
            onClick={() => {
              setCustomTarget(false);
              setTarget(target);
            }}
          >
            {target}s
          </button>
        ))}
        {/* Any other length: one custom chip that turns into a seconds field. */}
        {customTarget ||
        (script.targetSeconds > 0 && !TARGET_CHIPS.includes(script.targetSeconds)) ? (
          <label class="studio-target-custom">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              aria-label="Target seconds"
              value={script.targetSeconds || ''}
              autoFocus={customTarget}
              onInput={(event) => setTarget(Number((event.target as HTMLInputElement).value) || 0)}
            />
            <span aria-hidden="true">s</span>
          </label>
        ) : (
          <button
            type="button"
            class="studio-toggle"
            aria-label="Custom target length"
            onClick={() => setCustomTarget(true)}
          >
            <Icon name="timer" size={20} />
          </button>
        )}
      </div>
      {sections.length > 0 && (
        <div class="studio-section-durations">
          {sections.map((section) => (
            <span>
              {section.title}: {FORMAT(section.seconds)}
            </span>
          ))}
        </div>
      )}
      {readabilityWarning(parsed.spokenText) && (
        <p class="studio-warning">One or more sentences are longer than 25 words.</p>
      )}
      {placeholders > 0 && (
        <p class="studio-warning">
          {placeholders} placeholder{placeholders === 1 ? '' : 's'} left
        </p>
      )}
      <details class="studio-more">
        <summary>
          More
          <Icon name="chevron" size={18} />
        </summary>
        <div class="studio-grid-fields">
          <div class="studio-label studio-aspect-field">
            <span id="studio-aspect-label">Aspect</span>
            <span class="studio-toggle-group" role="group" aria-labelledby="studio-aspect-label">
              {(['9:16', '16:9'] as const).map((aspect) => (
                <button
                  type="button"
                  class="studio-toggle"
                  aria-pressed={script.aspect === aspect}
                  onClick={() => edit({ ...script, aspect })}
                >
                  <Icon name={aspect === '9:16' ? 'portrait' : 'landscape'} size={20} />
                  {aspect}
                </button>
              ))}
            </span>
          </div>
          <label class="studio-label">
            Status
            <select
              value={script.status}
              onChange={(event) =>
                edit({
                  ...script,
                  status: (event.target as HTMLSelectElement).value as ScriptStatus,
                })
              }
            >
              <option value="idea">Idea</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="recorded">Recorded</option>
              <option value="posted">Posted</option>
            </select>
          </label>
        </div>
        <section class="studio-card">
          <h2>Captions and title</h2>
          <CountedField
            label="Instagram caption"
            multiline
            value={script.caption}
            count={script.caption.length}
            limit={limits.instagramCaption}
            unit="characters"
            note={`About ${limits.instagramCaptionVisible} show before the more link.`}
            onInput={(caption) => edit({ ...script, caption })}
          />
          <CountedField
            label="Hashtags"
            value={script.hashtags}
            count={(script.hashtags.match(/#[\p{L}\p{N}_]+/gu) ?? []).length}
            limit={limits.instagramHashtags}
            unit="hashtags"
            onInput={(hashtags) => edit({ ...script, hashtags })}
          />
          <CountedField
            label="YouTube title"
            value={script.youtubeTitle}
            count={script.youtubeTitle.length}
            limit={limits.youtubeTitle}
            unit="characters"
            onInput={(youtubeTitle) => edit({ ...script, youtubeTitle })}
          />
          <CountedField
            label="YouTube description"
            multiline
            value={script.youtubeDescription}
            count={script.youtubeDescription.length}
            limit={limits.youtubeDescription}
            unit="characters"
            onInput={(youtubeDescription) => edit({ ...script, youtubeDescription })}
          />
          <p>Platform facts checked {verifiedOn}. Limits can change.</p>
        </section>
      </details>
      {showSend && <SendToPhone script={script} />}
      {(notice || importer.status) && <p role="status">{notice || importer.status}</p>}
      {importer.element}
      <PrintableScript script={script} />
      {/* Record is the raised nav button, which records this script while the editor is open. */}
      <div class="studio-editor__actions">
        <a class="studio-button studio-button--quiet" href={`#/practice/${script.id}`}>
          <Icon name="play" size={20} /> Practice
        </a>
        <Overflow label="More script actions" up>
          <button onClick={() => void flush().then(() => setShowSend(!showSend))}>
            <Icon name="phone" size={18} /> Send to phone
          </button>
          <button
            onClick={async () => {
              await flush();
              sessionStorage.setItem('studio.presentScript', script.body);
              location.href = '/?studio-present=1';
            }}
          >
            <Icon name="present" size={18} /> Present
          </button>
          <button
            onClick={async () => {
              await flush();
              if (openOperatorWindow()) {
                setOperatorOn(true);
                setNotice('Operator window open. Start Practice or Record here to drive it.');
              } else setNotice('Allow pop-ups for this site to open the operator window.');
            }}
          >
            <Icon name="monitor" size={18} /> Operator window
          </button>
          <button onClick={() => void flush().then(() => print())}>
            <Icon name="print" size={18} /> Print or PDF
          </button>
          <button onClick={importer.pick}>
            <Icon name="import" size={18} /> Import file
          </button>
          <button
            onClick={async () => {
              await flush();
              await softDelete(script.id);
              await refresh();
              go('/scripts');
            }}
          >
            <Icon name="trash" size={18} /> Delete
          </button>
        </Overflow>
      </div>
    </section>
  );
}
function CountedField({
  label,
  value,
  count,
  limit,
  unit,
  note,
  multiline,
  onInput,
}: {
  label: string;
  value: string;
  count: number;
  limit: number;
  unit: string;
  note?: string;
  multiline?: boolean;
  onInput: (value: string) => void;
}) {
  const hintId = `count-${label.replace(/\W+/g, '-').toLowerCase()}`;
  const over = count > limit;
  const update = (event: Event) => onInput((event.target as HTMLInputElement).value);
  return (
    <div class="studio-counted-field">
      <label class="studio-label">
        {label}
        {multiline ? (
          <textarea value={value} aria-describedby={hintId} onInput={update} />
        ) : (
          <input value={value} aria-describedby={hintId} onInput={update} />
        )}
      </label>
      <p id={hintId} class={over ? 'studio-count is-over' : 'studio-count'}>
        {count}/{limit} {unit}
        {over ? `. ${count - limit} over the limit.` : ''} {note}
      </p>
    </div>
  );
}
function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section class="studio-screen">
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}
