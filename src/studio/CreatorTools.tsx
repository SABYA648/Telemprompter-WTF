import { useEffect, useState } from 'preact/hooks';
import { analytics, type TEMPLATE_IDS } from '../domain/analytics';
import { createIdea, deleteIdea, listIdeas } from '../domain/studio/ideasRepo';
import { createScript } from '../domain/studio/scriptsRepo';
import type { HookNiche, StudioTemplate } from '../content/studio/types';
import type { StudioIdea } from '../domain/studio/types';
import { Icon } from './Icons';

// The packs are large and only some screens use them, so they stay out of the Studio entry chunk.
const loadTemplates = () => import('../content/studio/templates').then((pack) => pack.templates);
const loadHooks = () => import('../content/studio/hooks').then((pack) => pack.hookNiches);
function usePack<T>(load: () => Promise<T[]>, wanted = true): T[] {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    if (wanted && !items.length) void load().then(setItems);
  }, [wanted]);
  return items;
}

const FORMATS: Record<string, string> = {
  'short-form': 'Short form',
  youtube: 'YouTube',
  ad: 'Ad',
  business: 'Business',
};
const lengthLabel = (seconds: number) =>
  seconds >= 120 ? `${Math.round(seconds / 60)} min` : `${seconds} s`;

function trackTemplate(id: string) {
  analytics.track('used_template', { template_id: id as (typeof TEMPLATE_IDS)[number] });
}

export async function createFromTemplate(id: string) {
  const template = (await loadTemplates()).find((item) => item.id === id);
  if (!template) return null;
  const script = await createScript({
    title: template.name,
    body: template.body,
    templateId: id,
    targetSeconds: template.targetSeconds,
    aspect: template.aspect,
  });
  analytics.track('created_script', { source: 'template' });
  trackTemplate(template.id);
  return script;
}

export function TemplatePicker({ onCreated, open }: { onCreated?: () => void; open?: boolean }) {
  const [expanded, setExpanded] = useState(Boolean(open));
  const templates = usePack<StudioTemplate>(loadTemplates, expanded);
  const [query, setQuery] = useState('');
  const [duration, setDuration] = useState('all');
  const [format, setFormat] = useState('all');
  const shown = templates.filter(
    (item) =>
      `${item.name} ${item.summary}`.toLowerCase().includes(query.toLowerCase()) &&
      (duration === 'all' ||
        (duration === 'short'
          ? item.targetSeconds <= 30
          : duration === 'medium'
            ? item.targetSeconds > 30 && item.targetSeconds <= 60
            : item.targetSeconds > 60)) &&
      (format === 'all' || item.format === format),
  );
  return (
    <details
      class="studio-card studio-disclosure"
      open={open}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <Icon name="grid" size={20} />
        Start from a template
      </summary>
      <div class="studio-grid-fields">
        <label class="studio-label">
          Search templates
          <input value={query} onInput={(event) => setQuery(event.currentTarget.value)} />
        </label>
        <label class="studio-label">
          Duration
          <select value={duration} onChange={(event) => setDuration(event.currentTarget.value)}>
            <option value="all">Any duration</option>
            <option value="short">Up to 30 seconds</option>
            <option value="medium">31 to 60 seconds</option>
            <option value="long">Over 60 seconds</option>
          </select>
        </label>
        <label class="studio-label">
          Format
          <select value={format} onChange={(event) => setFormat(event.currentTarget.value)}>
            <option value="all">Any format</option>
            {Object.entries(FORMATS).map(([id, label]) => (
              <option value={id}>{label}</option>
            ))}
          </select>
        </label>
      </div>
      <div class="studio-list">
        {shown.map((item) => (
          <button
            class="studio-list-item"
            key={item.id}
            onClick={() =>
              void createFromTemplate(item.id).then((script) => {
                if (script) {
                  onCreated?.();
                  location.hash = `#/scripts/${script.id}`;
                }
              })
            }
          >
            {item.name} · {lengthLabel(item.targetSeconds)} · {FORMATS[item.format]}
          </button>
        ))}
      </div>
      {!shown.length && (
        <p>{templates.length ? 'No matching templates.' : 'Loading templates...'}</p>
      )}
    </details>
  );
}

export function HookPicker({ insert }: { insert: (text: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const hookNiches = usePack<HookNiche>(loadHooks, expanded);
  const [niche, setNiche] = useState<HookNiche['id']>('fitness');
  const [index, setIndex] = useState(0);
  const hooks =
    hookNiches.find((item) => item.id === niche)?.groups.flatMap((group) => group.hooks) ?? [];
  return (
    <details
      class="studio-card studio-disclosure"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary>
        <Icon name="idea" size={20} />
        Choose a hook
      </summary>
      <label class="studio-label">
        Niche
        <select
          value={niche}
          onChange={(event) => {
            setNiche(event.currentTarget.value as typeof niche);
            setIndex(0);
          }}
        >
          {hookNiches.map((item) => (
            <option value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <p aria-live="polite" data-testid="hook-text">
        {hooks[index]?.text}
      </p>
      <div class="studio-actions">
        <button
          class="studio-button studio-button--quiet"
          onClick={() => {
            // Offset by at least one, so Shuffle always shows a different hook.
            setIndex((index + 1 + Math.floor(Math.random() * (hooks.length - 1))) % hooks.length);
            analytics.track('shuffled_hooks', { niche });
          }}
        >
          Shuffle
        </button>
        <button
          class="studio-button studio-button--quiet"
          onClick={() => {
            const hook = hooks[index];
            if (hook) {
              insert(`${hook.text}\n`);
              analytics.track('inserted_hook', { niche });
            }
          }}
        >
          Insert hook
        </button>
      </div>
    </details>
  );
}

function IdeaCard({
  idea,
  templates,
  onConvert,
  onDelete,
}: {
  idea: StudioIdea;
  templates: StudioTemplate[];
  onConvert: (idea: StudioIdea, templateId: string) => Promise<void>;
  onDelete: (idea: StudioIdea) => void;
}) {
  const [templateId, setTemplateId] = useState('');
  const selected = templateId || templates[0]?.id || '';
  return (
    <article class="studio-card">
      <p class="studio-idea-text">{idea.text}</p>
      <label class="studio-label">
        Turn into script with
        <select value={selected} onChange={(event) => setTemplateId(event.currentTarget.value)}>
          {templates.map((item) => (
            <option value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <div class="studio-actions">
        <button
          class="studio-button studio-button--quiet"
          disabled={!selected}
          onClick={() => void onConvert(idea, selected)}
        >
          Make script
        </button>
        <button class="studio-button studio-button--danger" onClick={() => onDelete(idea)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export function IdeasInbox({ refreshScripts }: { refreshScripts: () => Promise<void> }) {
  const [ideas, setIdeas] = useState<StudioIdea[]>([]);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const templates = usePack<StudioTemplate>(loadTemplates);
  const refresh = () => void listIdeas().then(setIdeas);
  useEffect(refresh, []);
  useEffect(() => {
    const shared = new URLSearchParams(location.hash.split('?')[1] ?? '').get('shared');
    if (shared === '1') {
      setMessage('Idea saved.');
      analytics.track('captured_idea', { source: 'share_target' });
    }
    if (shared === 'error') setMessage('We could not save that share. Try sharing it again.');
    // A reload of this landing must not count the same share twice.
    if (shared) history.replaceState(null, '', '#/inbox');
  }, []);
  const add = async () => {
    try {
      await createIdea(text);
      setText('');
      setMessage('Idea saved.');
      analytics.track('captured_idea', { source: 'inbox' });
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save this idea.');
    }
  };
  const convert = async (idea: StudioIdea, templateId: string) => {
    const template = templates.find((item) => item.id === templateId)!;
    const script = await createScript({
      title: idea.text.slice(0, 80),
      body: `// Idea: ${idea.text.replace(/\s+/g, ' ')}\n\n${template.body}`,
      templateId,
      targetSeconds: template.targetSeconds,
      aspect: template.aspect,
    });
    await deleteIdea(idea.id);
    analytics.track('created_script', { source: 'idea' });
    trackTemplate(template.id);
    analytics.track('converted_idea');
    await refreshScripts();
    location.hash = `#/scripts/${script.id}`;
  };
  return (
    <section class="studio-screen">
      <h1>Ideas inbox</h1>
      <p>Save a thought now and turn it into a script when you are ready.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <label class="studio-label">
          New idea
          <textarea value={text} onInput={(event) => setText(event.currentTarget.value)} />
        </label>
        <div class="studio-actions">
          <button class="studio-button" type="submit">
            Save idea
          </button>
        </div>
      </form>
      {message && <p role="status">{message}</p>}
      <h2>Your ideas</h2>
      <div class="studio-list">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            templates={templates}
            onConvert={convert}
            onDelete={(item) => void deleteIdea(item.id).then(refresh)}
          />
        ))}
      </div>
      {!ideas.length && <p>No ideas yet. Save one above or share text to Studio from any app.</p>}
    </section>
  );
}
