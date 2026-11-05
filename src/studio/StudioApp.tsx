import { useEffect, useRef, useState } from 'preact/hooks';
import type { SCRIPT_SIZE_BUCKETS } from '../domain/analytics';
import { analytics, deviceClass, displayMode, studioEntry } from '../domain/analytics';
import { parseMarkup } from '../domain/studio/markup';
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
import { isStandaloneDisplay } from '../domain/studio/install';
import { persistOnFirstStandaloneLaunch } from '../domain/studio/storage';
import { routeFromHash, bootHash, type Route } from './router';
import RecordScreen from './RecordScreen';
import SettingsScreen from './SettingsScreen';
import { TakesScreen, TakeScreen } from './TakesScreen';
import { recoverTakes } from '../domain/studio/takesRepo';
import InstallSheet from './InstallSheet';
import {
  ServiceWorkerUpdate,
  SharedInbox,
  StandaloneTransferCard,
  TransferControls,
} from './PwaControls';
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
const FORMAT = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function StudioApp(): preact.JSX.Element {
  const [route, setRoute] = useState<Route>(routeFromHash(location.hash));
  const [scripts, setScripts] = useState<StudioScript[]>([]);
  const [ready, setReady] = useState(false);
  const [memory, setMemory] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [transferResult, setTransferResult] = useState('');
  const refreshRequest = useRef(0);
  const refresh = async () => {
    const request = ++refreshRequest.current;
    const result = await listScripts(true);
    if (request === refreshRequest.current) setScripts(result);
  };
  useEffect(() => {
    const boot = async () => {
      try {
        await migrateQuickScript();
        await purgeDeletedScripts();
        await ensureFirstScript();
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
          const script = await createScript();
          go(`/scripts/${script.id}`);
        }
        await refresh();
        const boot = bootHash(location.search);
        if (boot && !location.hash) location.hash = boot;
        analytics.track('opened_studio', {
          entry: handoff ? 'link' : studioEntry(),
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
      if (next.screen === 'editor' && next.id === 'new') {
        const script = await createScript();
        analytics.track('created_script', { source: 'blank' });
        await refresh();
        go(`/scripts/${script.id}`);
      } else setRoute(next);
    };
    addEventListener('hashchange', onHash);
    analytics.initialize();
    return () => removeEventListener('hashchange', onHash);
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
  if (!ready)
    return (
      <div class="studio-loading" aria-live="polite">
        Loading Studio...
      </div>
    );
  const active = scripts.filter((script) => !script.deletedAt);
  const deleted = scripts.filter((script) => script.deletedAt);
  const inApp = isInAppBrowser(navigator.userAgent);
  const handoffScript = active.find((script) => script.id === route.id) ?? active[0] ?? null;
  return (
    <div class="studio-shell">
      <ServiceWorkerUpdate hidden={route.screen === 'record'} />
      <InstallSheet recording={route.screen === 'record'} />
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
      {route.screen === 'inbox' && <SharedInbox />}
      {route.screen === 'scripts' && (
        <Scripts scripts={active} deleted={deleted} refresh={refresh} />
      )}
      {route.screen === 'editor' && <Editor id={route.id ?? ''} refresh={refresh} />}
      {route.screen === 'record' && <RecordScreen id={route.id ?? 'quick'} memory={memory} />}
      {route.screen === 'practice' && (
        <Placeholder title="Practice" text="Practice arrives in the next milestone." />
      )}
      {route.screen === 'take' && <TakeScreen id={route.id ?? ''} />}
      {route.screen === 'takes' && <TakesScreen />}
      {route.screen === 'settings' && <SettingsScreen section={route.id} />}
      {route.screen === 'settings' && !route.id && (
        <div class="studio-screen">
          <TransferControls />
        </div>
      )}
      {route.screen !== 'record' && route.screen !== 'practice' && <Tabs route={route.screen} />}
    </div>
  );
}

function Tabs({ route }: { route: Route['screen'] }) {
  const items: Array<[Route['screen'], string, string]> = [
    ['home', 'Home', '#/'],
    ['scripts', 'Scripts', '#/scripts'],
    ['record', 'Record', '#/record/quick'],
    ['takes', 'Takes', '#/takes'],
    ['settings', 'Settings', '#/settings'],
  ];
  return (
    <nav class="studio-tabs" aria-label="Studio navigation">
      {items.map(([id, label, href], index) => (
        <a
          class={
            route === id && index !== 2 ? 'is-active' : index === 2 ? 'studio-record-link' : ''
          }
          href={href}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
function Home({ scripts }: { scripts: StudioScript[] }) {
  const firstRun =
    scripts.length === 1 &&
    scripts[0]?.id === 'quick' &&
    scripts[0]?.title === 'Introduce yourself in 30 seconds';
  const quick = scripts.find((script) => script.id === 'quick') ?? scripts[0];
  return (
    <section class="studio-screen studio-home">
      <p class="studio-kicker">teleprompter.wtf Studio</p>
      <h1>{firstRun ? 'Record your first video in 60 seconds' : 'Welcome back'}</h1>
      <StandaloneTransferCard empty={firstRun} />
      {firstRun && <p>We loaded a 30-second starter script. Edit it or paste your own.</p>}
      <div class="studio-card">
        <h2>{quick?.title ?? 'Your first script'}</h2>
        <p>
          {quick
            ? `${parseMarkup(quick.body).spokenWordCount} spoken words`
            : 'Create a script to begin.'}
        </p>
        <div class="studio-actions">
          <a class="studio-button" href={`#/record/${quick?.id ?? 'quick'}`}>
            Record now
          </a>
          <a class="studio-button studio-button--quiet" href="#/scripts/new">
            Write my own
          </a>
        </div>
      </div>
      {!firstRun && (
        <>
          <h2>Up next</h2>
          <div class="studio-list">
            {scripts.slice(0, 3).map((script) => (
              <a class="studio-card" href={`#/scripts/${script.id}`}>
                {script.title || 'Untitled script'}
              </a>
            ))}
          </div>
          <div class="studio-actions">
            <a class="studio-button" href="#/scripts/new">
              + Script
            </a>
            <a class="studio-button studio-button--quiet" href="#/scripts">
              All scripts
            </a>
          </div>
        </>
      )}
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
  const visible = scripts.filter(
    (script) =>
      `${script.title} ${script.body}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === 'all' || script.status === status),
  );
  const add = async () => {
    const script = await createScript();
    analytics.track('created_script', { source: 'blank' });
    await refresh();
    go(`/scripts/${script.id}`);
  };
  return (
    <section class="studio-screen">
      <div class="studio-screen-heading">
        <div>
          <p class="studio-kicker">Library</p>
          <h1>Scripts</h1>
        </div>
        <button class="studio-button" onClick={() => void add()}>
          + Script
        </button>
      </div>
      <label class="studio-label">
        Search scripts
        <input
          value={query}
          onInput={(event) => setQuery((event.target as HTMLInputElement).value)}
          placeholder="Search title or script"
        />
      </label>
      <label class="studio-label">
        Status
        <select
          value={status}
          onChange={(event) =>
            setStatus((event.target as HTMLSelectElement).value as typeof status)
          }
        >
          <option value="all">All statuses</option>
          <option value="idea">Idea</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="recorded">Recorded</option>
          <option value="posted">Posted</option>
        </select>
      </label>
      <div class="studio-list">
        {visible.map((script) => (
          <article class="studio-list-item">
            <a href={`#/scripts/${script.id}`}>
              <strong>{script.title || 'Untitled script'}</strong>
              <span>
                {parseMarkup(script.body).spokenWordCount} words ·{' '}
                {FORMAT(durationAtWpm(parseMarkup(script.body).spokenWordCount, 140))} ·{' '}
                {script.status}· {new Date(script.updatedAt).toLocaleDateString()}
              </span>
            </a>
            <button
              onClick={async () => {
                await duplicateScript(script.id);
                await refresh();
              }}
            >
              Duplicate
            </button>
            <button
              aria-label={`Delete ${script.title}`}
              onClick={async () => {
                await softDelete(script.id);
                await refresh();
              }}
            >
              Delete
            </button>
          </article>
        ))}
      </div>
      {deleted.length > 0 && (
        <section class="studio-deleted">
          <h2>Recently deleted</h2>
          {deleted.map((script) => (
            <div class="studio-list-item">
              <span>{script.title}</span>
              <button
                onClick={async () => {
                  await restoreScript(script.id);
                  await refresh();
                }}
              >
                Restore
              </button>
            </div>
          ))}
        </section>
      )}
    </section>
  );
}
function Editor({ id, refresh }: { id: string; refresh: () => Promise<void> }) {
  const [script, setScript] = useState<StudioScript | null>(null);
  const [saved, setSaved] = useState('Loading...');
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
      <div class="studio-toolbar" aria-label="Markup tools">
        <button onClick={() => insert('# ')}>Section</button>
        <button onClick={() => insert('[pause]')}>Pause</button>
        <button onClick={() => insert('**text**')}>Emphasis</button>
        <button onClick={() => insert('==text==')}>Highlight</button>
        <button onClick={() => insert('// ')}>Note</button>
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
      <div class="studio-stats">
        <span>{parsed.spokenWordCount} spoken words</span>
        <span>{FORMAT(durationAtWpm(parsed.spokenWordCount, 140))} at 140 WPM</span>
        {[15, 30, 60, 90, 180].map((target) => (
          <span class={`fit-${fitForTarget(parsed.spokenWordCount, target, 140)}`}>{target}s</span>
        ))}
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
      <div class="studio-grid-fields">
        <label class="studio-label">
          Target seconds
          <input
            type="number"
            min="0"
            value={script.targetSeconds}
            onInput={(event) =>
              edit({
                ...script,
                targetSeconds: Number((event.target as HTMLInputElement).value) || 0,
              })
            }
          />
        </label>
        <label class="studio-label">
          Aspect
          <select
            value={script.aspect}
            onChange={(event) =>
              edit({
                ...script,
                aspect: (event.target as HTMLSelectElement).value as StudioScript['aspect'],
              })
            }
          >
            <option value="9:16">9:16</option>
            <option value="16:9">16:9</option>
          </select>
        </label>
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
      <div class="studio-actions">
        <a class="studio-button" href={`#/record/${script.id}`}>
          Record
        </a>
        <a class="studio-button studio-button--quiet" href={`#/practice/${script.id}`}>
          Practice
        </a>
        <button
          class="studio-button studio-button--quiet"
          onClick={async () => {
            await flush();
            sessionStorage.setItem('studio.presentScript', script.body);
            location.href = '/?studio-present=1';
          }}
        >
          Present
        </button>
        <button
          class="studio-button studio-button--danger"
          onClick={async () => {
            await flush();
            await softDelete(script.id);
            await refresh();
            go('/scripts');
          }}
        >
          Delete
        </button>
      </div>
    </section>
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
