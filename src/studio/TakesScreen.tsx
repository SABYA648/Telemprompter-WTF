import { useEffect, useState } from 'preact/hooks';
import { analytics, deviceClass } from '../domain/analytics';
import { exportTake, exportTakes, sizeBucket } from '../domain/studio/exportTake';
import { parseMarkup } from '../domain/studio/markup';
import { getScript } from '../domain/studio/scriptsRepo';
import { deleteTake, getTake, listTakes, saveTake, takeBlob } from '../domain/studio/takesRepo';
import { formatBytes, minutesLeft, storageEstimate } from '../domain/studio/storage';
import type { StudioTake } from '../domain/studio/types';
import { videoBitrate } from '../domain/studio/mime';

function StorageMeter() {
  const [estimate, setEstimate] = useState({ usage: 0, quota: 0 });
  useEffect(() => {
    void storageEstimate().then((value) => {
      setEstimate(value);
      if (value.quota > 0) {
        const usage = value.usage / value.quota;
        if (usage >= 0.95) analytics.track('storage_warning', { level: 95 });
        else if (usage >= 0.8) analytics.track('storage_warning', { level: 80 });
      }
    });
  }, []);
  if (!estimate.quota) return null;
  const available = estimate.quota - estimate.usage;
  return (
    <div class="studio-card">
      <strong>Storage</strong>
      <p>
        Using {formatBytes(estimate.usage)}. About{' '}
        {minutesLeft(available, videoBitrate('1080p', 30, 'high'))} minutes of recording space left
        at 1080p High.
      </p>
      <meter value={estimate.usage} max={estimate.quota} aria-label="Storage used" />
    </div>
  );
}
function TakePlayer({ take }: { take: StudioTake }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    let objectUrl = '';
    void takeBlob(take).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      if (active) setUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [take.id]);
  return url ? (
    <video class="take-player" src={url} controls playsInline preload="metadata" />
  ) : (
    <p>Loading video...</p>
  );
}
const sectionOf = (take: StudioTake) => take.sectionIndex ?? -1;
/** Whole-script takes first, then section order, oldest first, so a share reads as the video does. */
const inSectionOrder = (takes: StudioTake[]) =>
  [...takes].sort((a, b) => sectionOf(a) - sectionOf(b) || a.createdAt - b.createdAt);
function TakeRow({ take }: { take: StudioTake }) {
  return (
    <a class="take-row" href={`#/takes/${take.id}`}>
      <span>
        Take {take.number} · {Math.round(take.durationMs / 1000)}s · {take.container.toUpperCase()}
      </span>
      <span>
        {!take.exportedAt ? 'Unsaved ' : ''}
        {take.starred ? 'Starred ' : ''}
        {take.status === 'recovered' ? 'Recovered' : ''}
      </span>
    </a>
  );
}
export function TakesScreen() {
  const [takes, setTakes] = useState<StudioTake[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [sectionTitles, setSectionTitles] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const refresh = async () => {
    const rows = (await listTakes()).filter((t) => t.kept || t.status === 'recovered');
    setTakes(rows);
    const names: Record<string, string> = {};
    const sections: Record<string, string[]> = {};
    for (const take of rows) {
      if (take.scriptId && !names[take.scriptId]) {
        const script = await getScript(take.scriptId);
        names[take.scriptId] = script?.title ?? 'Deleted script';
        sections[take.scriptId] = script
          ? parseMarkup(script.body).sections.map((section) => section.title)
          : [];
      }
    }
    setTitles(names);
    setSectionTitles(sections);
  };
  useEffect(() => {
    void refresh();
  }, []);
  const saveStarred = async (rows: StudioTake[]) => {
    try {
      const method = await exportTakes(inSectionOrder(rows.filter((t) => t.starred)), titles);
      if (method !== 'cancel') setMessage('Starred takes saved.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save takes.');
    }
  };
  const grouped = takes.reduce<Record<string, StudioTake[]>>((groups, take) => {
    (groups[take.scriptId ?? 'free'] ??= []).push(take);
    return groups;
  }, {});
  return (
    <section class="studio-screen">
      <h1>Takes</h1>
      <StorageMeter />
      {takes.some((take) => !take.exportedAt) && (
        <p class="studio-storage-warning">Save it to Photos now. Browser storage can be cleared.</p>
      )}
      {!takes.length && <p>No takes yet. Record a video to see it here.</p>}
      {message && <p role="status">{message}</p>}
      {Object.entries(grouped).map(([id, rows]) => {
        const hasSections = rows.some((take) => sectionOf(take) >= 0);
        const parts = [...new Set(rows.map(sectionOf))].sort((a, b) => a - b);
        return (
          <div class="studio-card" key={id}>
            <h2>{id === 'free' ? 'Free records' : (titles[id] ?? 'Script')}</h2>
            {!hasSections && rows.map((take) => <TakeRow take={take} />)}
            {hasSections &&
              parts.map((part) => (
                <div key={part}>
                  <h3>
                    {part < 0
                      ? 'Whole script'
                      : `Section ${part + 1}${sectionTitles[id]?.[part] ? `: ${sectionTitles[id][part]}` : ''}`}
                  </h3>
                  {rows
                    .filter((take) => sectionOf(take) === part)
                    .map((take) => (
                      <TakeRow take={take} />
                    ))}
                </div>
              ))}
            {rows.some((take) => take.starred) && (
              <div class="studio-actions">
                <button class="studio-button" onClick={() => void saveStarred(rows)}>
                  Save starred takes
                </button>
              </div>
            )}
          </div>
        );
      })}
      <button
        class="studio-button studio-button--danger"
        onClick={async () => {
          for (const take of takes.filter((t) => t.exportedAt)) await deleteTake(take.id);
          await refresh();
        }}
      >
        Delete saved takes
      </button>
    </section>
  );
}
export function TakeScreen({ id }: { id: string }) {
  const [take, setTake] = useState<StudioTake | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    void getTake(id).then(async (row) => {
      setTake(row ?? null);
      if (row?.scriptId) setTitle((await getScript(row.scriptId))?.title ?? null);
    });
  }, [id]);
  if (!take)
    return (
      <section class="studio-screen">
        <h1>Take not found</h1>
      </section>
    );
  const save = async () => {
    const method = await exportTake(take, title);
    if (method === 'cancel') return;
    analytics.track('exported_take', {
      method,
      container: take.container,
      size_bucket: sizeBucket(take.sizeBytes),
    });
    dispatchEvent(new Event('studio-take-exported'));
    setTake({ ...take, exportedAt: Date.now() });
  };
  return (
    <section class="studio-screen">
      <a class="studio-back" href="#/takes">
        Takes
      </a>
      <h1>Take {take.number}</h1>
      <TakePlayer take={take} />
      {!take.exportedAt && <p>Save it to Photos now. Browser storage can be cleared.</p>}
      <p>
        {take.status === 'recovered' ? 'Recovered · ' : ''}
        {Math.round(take.durationMs / 1000)}s · {take.container.toUpperCase()} · {take.width} ×{' '}
        {take.height} · {Math.round(take.frameRate)} fps · {formatBytes(take.sizeBytes)}
      </p>
      <div class="studio-actions">
        <button class="studio-button" onClick={() => void save()}>
          {deviceClass() === 'desktop' ? `Download ${take.container.toUpperCase()}` : 'Save video'}
        </button>
        <button
          class="studio-button studio-button--quiet"
          onClick={() =>
            void saveTake({ ...take, starred: !take.starred }).then(() =>
              setTake({ ...take, starred: !take.starred }),
            )
          }
        >
          {take.starred ? 'Unstar' : 'Star'}
        </button>
        <button
          class="studio-button studio-button--danger"
          onClick={() =>
            void deleteTake(take.id).then(() => {
              location.hash = '#/takes';
            })
          }
        >
          Delete
        </button>
      </div>
    </section>
  );
}
