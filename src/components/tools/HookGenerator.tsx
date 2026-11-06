import { useState } from 'preact/hooks';
import { recordNewScript } from '../../domain/studio/handoff';
interface NicheHooks {
  id: string;
  name: string;
  hooks: string[];
}
export default function HookGenerator({ niches }: { niches: NicheHooks[] }): preact.JSX.Element {
  const [niche, setNiche] = useState<string>(niches[0]?.id ?? 'fitness');
  const [topic, setTopic] = useState('');
  const [batch, setBatch] = useState(0);
  const [copyState, setCopyState] = useState<{ index: number; label: string } | null>(null);
  const found = niches.find((item) => item.id === niche) ?? niches[0];
  const hooks = found?.hooks ?? [];
  const chosen = topic.trim()
    ? Array.from({ length: 5 }, (_, index) => hooks[(batch * 5 + index) % hooks.length]).filter(
        (hook): hook is string => typeof hook === 'string',
      )
    : [];
  const fill = (value: string) => {
    const slots = [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1] ?? 'detail');
    const topicSlot = slots.findIndex(
      (slot) => !/number|amount|time|result|measure|day|percent/i.test(slot),
    );
    let index = 0;
    const line = value.replace(/\{([^}]+)\}/g, (_match, label: string) => {
      const replacement =
        topic.trim() && index === topicSlot ? topic.trim() : `[${label.toLowerCase()}]`;
      index++;
      return replacement;
    });
    return topic.trim() && topicSlot < 0 ? `${topic.trim()}: ${line}` : line;
  };
  const copy = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState({ index, label: 'Copied' });
    } catch {
      setCopyState({ index, label: 'Copy failed' });
    }
  };
  return (
    <div class="creator-tool">
      <p>Template-based hooks. Replace every bracket with a true detail before filming.</p>
      <label for="hook-niche">Niche</label>
      <select
        id="hook-niche"
        value={niche}
        onChange={(event) => {
          setNiche(event.currentTarget.value);
          setBatch(0);
          setCopyState(null);
        }}
      >
        {niches.map((item) => (
          <option value={item.id}>{item.name}</option>
        ))}
      </select>
      <label for="hook-topic">Topic</label>
      <input
        id="hook-topic"
        type="text"
        maxLength={80}
        value={topic}
        onInput={(event) => {
          setTopic(event.currentTarget.value);
          setCopyState(null);
        }}
        placeholder="e.g. morning routine"
      />
      {!topic.trim() && <p>Enter a topic to see five opening lines.</p>}
      <button
        type="button"
        disabled={!topic.trim()}
        onClick={() => {
          setBatch((value) => (value + 1) % 5);
          setCopyState(null);
        }}
      >
        Show five more hooks
      </button>
      <ol class="creator-tool__results">
        {chosen.map((hook, index) => (
          <li>
            <p>{fill(hook)}</p>
            <button type="button" onClick={() => void copy(fill(hook), index)}>
              {copyState?.index === index ? copyState.label : 'Copy'}
            </button>{' '}
            <button type="button" onClick={() => void recordNewScript('Hook idea', fill(hook))}>
              Record this hook
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
