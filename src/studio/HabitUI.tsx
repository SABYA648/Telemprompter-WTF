import { useEffect, useRef, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import {
  BADGES,
  dailyPromptIndex,
  joinChallenge,
  mondayOf,
  promptScriptBody,
  readHabits,
  markBadgeSeen,
  unseenBadges,
  type BadgeId,
  type HabitSnapshot,
} from '../domain/studio/habits';
import { createScript } from '../domain/studio/scriptsRepo';
import {
  bestStreakInPreviousWeek,
  localDay,
  readStreak,
  type Streak,
} from '../domain/studio/streak';
import { loadSettings } from '../domain/studio/settings';
import { listTakes } from '../domain/studio/takesRepo';
import { getDb } from '../domain/studio/db';
import { isStandaloneDisplay } from '../domain/studio/install';
import { shareProgressCard, type CardKind, type CardLabel } from '../domain/studio/shareCard';
import { challenge30 } from '../content/studio/challenge30';
import type { DailyPrompt } from '../content/studio/types';
import type { StudioSettings } from '../domain/studio/types';
import {
  claimSessionAsk,
  inlineAsk,
  markMilestoneOffered,
  nextAsk,
  offeredMilestones,
  ratingDone,
  saveRating,
  sessionAsk,
  shareMilestone,
  type SessionAsk,
} from '../domain/studio/asks';
import { ReminderCard } from './ReminderCard';

export interface HabitData {
  streak: Streak | null;
  snap: HabitSnapshot | null;
  settings: StudioSettings | null;
}
/** Streak, habit stats and settings for Home, refreshed whenever a take or badge changes them. */
export function useHabits(): HabitData {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [snap, setSnap] = useState<HabitSnapshot | null>(null);
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  useEffect(() => {
    const refresh = () => {
      void readStreak().then(setStreak);
      void readHabits().then(setSnap);
    };
    refresh();
    void loadSettings().then(setSettings);
    // A tab left open overnight shows the new day's streak and week when it comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    addEventListener('studio-streak-changed', refresh);
    addEventListener('studio-habits-changed', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      removeEventListener('studio-streak-changed', refresh);
      removeEventListener('studio-habits-changed', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return { streak, snap, settings };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localDay(date);
};
async function scriptFromPrompt(
  prompt: { title: string; templateId: string; hook: string; note: string },
  source: 'daily_prompt' | 'challenge',
) {
  const { templates } = await import('../content/studio/templates');
  const template = templates.find((t) => t.id === prompt.templateId);
  const script = await createScript({
    title: prompt.title,
    body: promptScriptBody(template?.body ?? '', prompt.hook, prompt.note),
    templateId: prompt.templateId,
    targetSeconds: template?.targetSeconds ?? 30,
    aspect: template?.aspect ?? '9:16',
  });
  analytics.track('created_script', { source });
  return script;
}

export function CardShare({
  kind,
  number,
  label,
  text = 'Share card',
}: {
  kind: CardKind;
  number: number;
  label: CardLabel;
  text?: string;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        class="studio-button studio-button--quiet"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError('');
          void shareProgressCard(kind, number, label)
            .catch(() => setError('Could not make the share card.'))
            .finally(() => setBusy(false));
        }}
      >
        {text}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}

/** The 9.2 top row: streak badge and weekly ring in one compact card. */
export function HabitSummary({
  streak,
  snap,
  settings,
  firstRun,
}: HabitData & { firstRun: boolean }) {
  if (!settings) return null;
  const showStreak = settings.habit.streaksEnabled && streak && streak.activeDates.length > 0;
  const showGoal = settings.habit.goalsEnabled && snap && !firstRun;
  if (!showStreak && !showGoal) return null;
  const pct = snap ? Math.min(100, (snap.weeklyVideos / snap.weeklyGoal) * 100) : 0;
  return (
    <section class="studio-card studio-habit-summary">
      {showGoal && (
        <div
          class="studio-goal-ring"
          role="progressbar"
          aria-label="Weekly goal progress"
          aria-valuemin={0}
          aria-valuemax={snap.weeklyGoal}
          aria-valuenow={Math.min(snap.weeklyVideos, snap.weeklyGoal)}
          style={{ '--goal': `${pct}%` }}
        >
          <span aria-hidden="true">
            {snap.weeklyVideos}/{snap.weeklyGoal}
          </span>
        </div>
      )}
      <div class="studio-habit-summary__text">
        {showStreak && (
          <div aria-label="Recording streak" role="group">
            <strong class="studio-habit-summary__streak">
              {streak.current > 0 ? `${streak.current}-day streak` : 'Fresh start today'}
            </strong>
            <p>
              {streak.lastActiveDate === localDay(new Date())
                ? 'Recorded today. See you tomorrow.'
                : streak.freezeUsedDates.at(-1) === yesterday() && streak.current > 0
                  ? `A streak freeze kept your ${streak.current}-day streak alive.`
                  : streak.current > 0
                    ? 'Record today to keep your streak.'
                    : `Fresh start today. Your best streak is ${streak.best} days.`}
            </p>
            <p class="studio-muted">
              Best {plural(streak.best, 'day')} · {plural(streak.freezes, 'freeze')} ready
            </p>
          </div>
        )}
        {showGoal && (
          <p class="studio-habit-summary__goal">
            {snap.weeklyVideos} of {snap.weeklyGoal} videos this week
          </p>
        )}
      </div>
    </section>
  );
}

/** Badge celebration. Motion is CSS only and is removed under prefers-reduced-motion. */
export function BadgeCelebration({ settings, snap }: Pick<HabitData, 'settings' | 'snap'>) {
  const [queue, setQueue] = useState<BadgeId[]>([]);
  useEffect(() => {
    const load = () => void unseenBadges().then(setQueue);
    load();
    addEventListener('studio-badge-unlocked', load);
    return () => removeEventListener('studio-badge-unlocked', load);
  }, []);
  const id = queue[0];
  if (!id || !settings?.habit.badgesEnabled) return null;
  return (
    <section class="studio-card studio-celebration" role="status" aria-label="Badge unlocked">
      <span class="studio-celebration__burst" aria-hidden="true" />
      <p class="studio-kicker">Badge unlocked</p>
      <h2>{BADGES[id].label}</h2>
      <p>{BADGES[id].detail}</p>
      <div class="studio-actions">
        {settings.habit.shareCardsEnabled && (
          <CardShare
            kind="badge"
            number={snap?.badges.length ?? 1}
            label="Badges earned"
            text="Share badge card"
          />
        )}
        <button
          class="studio-button"
          onClick={() => {
            setQueue((q) => q.slice(1));
            void markBadgeSeen(id);
          }}
        >
          Nice
        </button>
      </div>
    </section>
  );
}

const MILESTONE_KEY = 'studio.ask.milestone';
const REMINDER_SNOOZE = 'asks.reminderSnoozedAt';
type Milestone = { key: string; kind: 'streak' | 'weekly' | 'challenge' };
function sessionMilestone(): Milestone | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(MILESTONE_KEY) ?? 'null') as Milestone | null;
    return value && typeof value.key === 'string' ? value : null;
  } catch {
    return null;
  }
}

/** The one Home ask this session may show (4.3), plus the storage guardrail, which always shows. */
export function HomeAsk({ streak, snap, settings }: HabitData) {
  const [ask, setAsk] = useState<SessionAsk | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [rated, setRated] = useState('');
  const [storage, setStorage] = useState(0);
  const decided = useRef(false);
  useEffect(() => {
    if (!streak || !snap || !settings || decided.current) return;
    decided.current = true;
    void (async () => {
      const db = await getDb();
      const [done, offered, snoozedAt] = await Promise.all([
        ratingDone(),
        offeredMilestones(),
        db.get('kv', REMINDER_SNOOZE),
      ]);
      const held = sessionAsk() === 'share_card' ? sessionMilestone() : null;
      const found =
        held ??
        shareMilestone({
          streak: settings.habit.streaksEnabled ? streak.best : 0,
          weeklyGoalReached: settings.habit.goalsEnabled && snap.weeklyVideos >= snap.weeklyGoal,
          challengeComplete: settings.habit.challengeEnabled && snap.challengeDays >= 30,
          week: mondayOf(new Date()),
          offered,
        });
      const snoozed = typeof snoozedAt === 'number' && Date.now() - snoozedAt < 7 * 86400000;
      const kind = nextAsk(
        { sessionAsk: sessionAsk(), installShown: 0, installDismissedAt: 0, ratingDone: done },
        {
          recording: false,
          exported: 0,
          sessions: 0,
          activeDays: streak.activeDates.length,
          installed: isStandaloneDisplay(),
          keptTakes: snap.takes,
          now: Date.now(),
          milestone: Boolean(found),
        },
        {
          install: false,
          reminder: settings.reminders.askEnabled && !settings.reminders.fileDownloaded && !snoozed,
          share_card: settings.habit.shareCardsEnabled && Boolean(found),
          rating: settings.habit.ratingEnabled,
        },
      );
      if (!kind || !claimSessionAsk(kind)) return;
      if (kind === 'share_card' && found) {
        await markMilestoneOffered(found.key);
        try {
          sessionStorage.setItem(MILESTONE_KEY, JSON.stringify(found));
        } catch {
          /* Private mode. */
        }
        setMilestone(found);
      }
      setAsk(kind);
    })();
  }, [streak, snap, settings]);
  useEffect(() => {
    void Promise.all([listTakes(), navigator.storage?.estimate?.() ?? Promise.resolve({})]).then(
      ([takes, estimate]: [Awaited<ReturnType<typeof listTakes>>, StorageEstimate]) => {
        const quotaUsedPct = estimate.quota ? ((estimate.usage ?? 0) / estimate.quota) * 100 : 0;
        const unexportedTakes = takes.filter((t) => t.kept && !t.exportedAt).length;
        if (!inlineAsk('storage_cleanup', { quotaUsedPct, unexportedTakes })) return;
        setStorage(Math.max(1, unexportedTakes));
        try {
          if (sessionStorage.getItem('studio.storage.warned')) return;
          sessionStorage.setItem('studio.storage.warned', '1');
        } catch {
          /* Storage unavailable: report once per page load instead. */
        }
        analytics.track('storage_warning', { level: quotaUsedPct > 95 ? 95 : 80 });
      },
    );
  }, []);
  const rate = async (score: 0 | 1 | 2 | 3 | 4 | 5) => {
    if ((await saveRating(score)) && score) analytics.track('rated_recording', { score });
    setAsk(null);
    setRated(score ? 'Thanks for sharing.' : '');
  };
  const snooze = async () => {
    await (await getDb()).put('kv', Date.now(), REMINDER_SNOOZE);
    setAsk(null);
  };
  const shareNumber =
    milestone?.kind === 'streak'
      ? Number(milestone.key.slice('streak_'.length))
      : milestone?.kind === 'weekly'
        ? (snap?.weeklyVideos ?? 0)
        : (snap?.challengeDays ?? 0);
  return (
    <>
      {storage > 0 && (
        <section class="studio-card" aria-label="Storage cleanup">
          <h2>Make room for your next take</h2>
          <p>
            {plural(storage, 'kept take is', 'kept takes are')} only in this browser. Save the ones
            you want, then delete the rest.
          </p>
          <div class="studio-actions">
            <a class="studio-button" href="#/takes">
              Review takes
            </a>
          </div>
        </section>
      )}
      {ask === 'reminder' && (
        <ReminderCard activeDays={streak?.activeDates.length ?? 0} onNotNow={() => void snooze()} />
      )}
      {ask === 'share_card' && milestone && (
        <section class="studio-card" aria-label="Share your progress">
          <h2>
            {milestone.kind === 'streak'
              ? 'Streak milestone'
              : milestone.kind === 'weekly'
                ? 'Weekly goal reached'
                : 'Challenge complete'}
          </h2>
          <p>Make a progress card for your story. It shows the number, never your script.</p>
          <div class="studio-actions">
            <CardShare
              kind={milestone.kind}
              number={shareNumber}
              label={
                milestone.kind === 'streak'
                  ? 'Day streak'
                  : milestone.kind === 'weekly'
                    ? 'Videos this week'
                    : 'Challenge days'
              }
            />
            <button class="studio-button studio-button--quiet" onClick={() => setAsk(null)}>
              Not now
            </button>
          </div>
        </section>
      )}
      {ask === 'rating' && (
        <section class="studio-card" aria-label="Rate recording">
          <h2>How did recording feel today?</h2>
          <p class="studio-muted">1 is hard, 5 is easy.</p>
          <div class="studio-rating">
            {([1, 2, 3, 4, 5] as const).map((score) => (
              <button
                key={score}
                class="studio-button studio-button--quiet"
                aria-label={`Rate ${score} out of 5`}
                onClick={() => void rate(score)}
              >
                {score}
              </button>
            ))}
          </div>
          <div class="studio-actions">
            <button class="studio-button studio-button--quiet" onClick={() => void rate(0)}>
              Skip
            </button>
          </div>
        </section>
      )}
      {rated && <p role="status">{rated}</p>}
    </>
  );
}

/** H3: the same prompt for everyone on a local date. */
export function TodayCard({ settings }: Pick<HabitData, 'settings'>) {
  const enabled = Boolean(settings?.habit.dailyPromptEnabled);
  const [prompts, setPrompts] = useState<DailyPrompt[]>([]);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    void import('../content/studio/dailyPrompts').then(({ dailyPrompts }) => {
      setPrompts(dailyPrompts);
      const key = `studio.today.viewed.${localDay(new Date())}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      } catch {
        /* Count once per page load. */
      }
      analytics.track('viewed_today_prompt');
    });
  }, [enabled]);
  if (!enabled || !prompts.length) return null;
  const index = dailyPromptIndex(new Date(), prompts.length);
  const today = prompts[index]!;
  const hook = prompts[(index + offset) % prompts.length]!.hook;
  const shuffle = () => {
    // Any other prompt's hook, never the one on screen.
    const step = 1 + (crypto.getRandomValues(new Uint32Array(1))[0]! % (prompts.length - 1));
    setOffset((offset + step) % prompts.length);
  };
  const create = async (record: boolean) => {
    setBusy(true);
    analytics.track('started_today_prompt');
    const script = await scriptFromPrompt(
      { title: today.title, templateId: today.templateId, hook, note: today.angle },
      'daily_prompt',
    );
    location.hash = record ? `#/record/${script.id}` : `#/scripts/${script.id}`;
  };
  return (
    <section class="studio-card studio-today" aria-label="Today's prompt">
      <h2>Today's prompt</h2>
      <p class="studio-today__title">{today.title}</p>
      <p class="studio-today__hook">{hook}</p>
      <p class="studio-muted">{today.angle}</p>
      <div class="studio-actions studio-actions--grid">
        <button class="studio-button" disabled={busy} onClick={() => void create(false)}>
          Write it
        </button>
        <button class="studio-button studio-button--quiet" onClick={shuffle}>
          Another hook
        </button>
        <button
          class="studio-button studio-button--quiet"
          disabled={busy}
          onClick={() => void create(true)}
        >
          Record
        </button>
      </div>
    </section>
  );
}

/** H10: shown on Mondays, about the week that just ended. */
export function WeeklyRecap({ streak, snap, settings }: HabitData) {
  if (!snap || !settings?.habit.recapEnabled || new Date().getDay() !== 1) return null;
  if (!snap.takes) return null;
  return (
    <section class="studio-card" aria-label="Weekly recap">
      <h2>Last week</h2>
      <dl class="studio-stat-grid">
        <div>
          <dt>Videos</dt>
          <dd>{snap.previousWeekVideos}</dd>
        </div>
        <div>
          <dt>Minutes recorded</dt>
          <dd>{snap.previousWeekMinutes}</dd>
        </div>
        <div>
          <dt>Best streak</dt>
          <dd>{plural(bestStreakInPreviousWeek(streak, new Date()), 'day')}</dd>
        </div>
        <div>
          <dt>Goal</dt>
          <dd>{snap.previousWeekGoalMet ? 'Reached' : `${snap.weeklyGoal} next`}</dd>
        </div>
      </dl>
      <p>{snap.previousWeekGoalMet ? 'Goal reached. Nice work.' : 'A new week starts today.'}</p>
      {settings.habit.shareCardsEnabled && (
        <div class="studio-actions">
          <CardShare kind="weekly" number={snap.previousWeekVideos} label="Last week's videos" />
        </div>
      )}
    </section>
  );
}

/** Stats, badges and the challenge entry, below the daily actions. */
export function HabitProgress({ streak, snap, settings }: HabitData) {
  if (!snap || !settings) return null;
  const { statsEnabled, badgesEnabled, challengeEnabled, shareCardsEnabled, streaksEnabled } =
    settings.habit;
  if (!statsEnabled && !badgesEnabled && !challengeEnabled) return null;
  return (
    <section class="studio-card" aria-label="Your progress">
      <h2>Your progress</h2>
      {statsEnabled && (
        <dl class="studio-stat-grid">
          <div>
            <dt>Videos</dt>
            <dd>{snap.videos}</dd>
          </div>
          <div>
            <dt>Takes</dt>
            <dd>{snap.takes}</dd>
          </div>
          <div>
            <dt>Minutes recorded</dt>
            <dd>{snap.minutes}</dd>
          </div>
          <div>
            <dt>Words read</dt>
            <dd>{snap.words}</dd>
          </div>
          <div>
            <dt>Average WPM</dt>
            <dd>{snap.averageWpm || '-'}</dd>
          </div>
        </dl>
      )}
      {badgesEnabled && (
        <>
          <h3>Badges</h3>
          {snap.badges.length ? (
            <ul class="studio-badges">
              {snap.badges.map((id) => (
                <li key={id}>{BADGES[id].label}</li>
              ))}
            </ul>
          ) : (
            <p class="studio-muted">Keep your first take to earn your first badge.</p>
          )}
        </>
      )}
      {challengeEnabled && (
        <p>
          {snap.challengeJoined
            ? `30-day challenge: ${snap.challengeDays} of 30 days.`
            : '30 videos in 30 days, with no deadline.'}
        </p>
      )}
      <div class="studio-actions">
        {challengeEnabled && (
          <a class="studio-button studio-button--quiet" href="#/challenge">
            {snap.challengeJoined ? 'Open challenge' : 'See the challenge'}
          </a>
        )}
        {shareCardsEnabled && streaksEnabled && streak && streak.current > 0 && (
          <CardShare kind="streak" number={streak.current} label="Day streak" text="Share streak" />
        )}
        {shareCardsEnabled && settings.habit.goalsEnabled && (
          <CardShare
            kind="weekly"
            number={snap.weeklyVideos}
            label="Videos this week"
            text="Share week"
          />
        )}
      </div>
    </section>
  );
}

/** H9: `#/challenge`. Days count kept takes on different local dates since joining. */
export function ChallengeScreen() {
  const [snap, setSnap] = useState<HabitSnapshot | null>(null);
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const refresh = () => void readHabits().then(setSnap);
    refresh();
    void loadSettings().then(setSettings);
    addEventListener('studio-habits-changed', refresh);
    return () => removeEventListener('studio-habits-changed', refresh);
  }, []);
  if (!snap || !settings) return <section class="studio-screen" aria-busy="true" />;
  if (!settings.habit.challengeEnabled)
    return (
      <section class="studio-screen">
        <h1>30-day challenge</h1>
        <p>The challenge is turned off. Turn it on in Habit settings.</p>
        <a class="studio-button studio-button--quiet" href="#/settings/habit">
          Habit settings
        </a>
      </section>
    );
  const complete = snap.challengeDays >= 30;
  const day = Math.min(30, snap.challengeDays + 1);
  const task = challenge30[day - 1];
  const start = async (record: boolean) => {
    if (!task) return;
    setBusy(true);
    const script = await scriptFromPrompt(
      {
        title: `Day ${task.day}: ${task.title}`,
        templateId: task.templateId,
        hook: '',
        note: `Day ${task.day}: ${task.prompt}`,
      },
      'challenge',
    );
    location.hash = record ? `#/record/${script.id}` : `#/scripts/${script.id}`;
  };
  return (
    <section class="studio-screen studio-challenge">
      <p class="studio-kicker">30-day challenge</p>
      <h1>30 videos in 30 days</h1>
      <p>
        Keep a take on 30 different days. There is no deadline, so a missed day never resets it.
      </p>
      {!snap.challengeJoined ? (
        <div class="studio-actions">
          <button class="studio-button" onClick={() => void joinChallenge()}>
            Join challenge
          </button>
        </div>
      ) : (
        <>
          <div
            class="studio-challenge__meter"
            role="progressbar"
            aria-label="Challenge progress"
            aria-valuemin={0}
            aria-valuemax={30}
            aria-valuenow={snap.challengeDays}
          >
            <span style={{ width: `${(snap.challengeDays / 30) * 100}%` }} />
          </div>
          <p role="status">{snap.challengeDays} of 30 days complete.</p>
          {complete ? (
            <section class="studio-card studio-celebration" aria-label="Challenge complete">
              <h2>Challenge complete</h2>
              <p>You showed up on 30 different days.</p>
            </section>
          ) : (
            task && (
              <article class="studio-card">
                <h2>
                  Day {day}: {task.title}
                </h2>
                <p>{task.prompt}</p>
                <div class="studio-actions studio-actions--grid">
                  <button class="studio-button" disabled={busy} onClick={() => void start(false)}>
                    Write it
                  </button>
                  <button
                    class="studio-button studio-button--quiet"
                    disabled={busy}
                    onClick={() => void start(true)}
                  >
                    Record
                  </button>
                </div>
              </article>
            )
          )}
          {settings.habit.shareCardsEnabled && snap.challengeDays > 0 && (
            <div class="studio-actions">
              <CardShare kind="challenge" number={snap.challengeDays} label="Challenge days" />
            </div>
          )}
          <h2>All 30 days</h2>
          <ol class="studio-challenge__days">
            {challenge30.map((item) => (
              <li key={item.day} aria-current={item.day === day && !complete ? 'step' : undefined}>
                <span>Day {item.day}</span> {item.title}
                {item.day <= snap.challengeDays && (
                  <span class="studio-visually-hidden"> (done)</span>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
      <div class="studio-actions">
        <a class="studio-button studio-button--quiet" href="#/">
          Back to Home
        </a>
      </div>
    </section>
  );
}
