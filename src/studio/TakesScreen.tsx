import { useEffect, useState } from 'preact/hooks';
import { analytics, deviceClass } from '../domain/analytics';
import { exportTake } from '../domain/studio/exportTake';
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
export function TakesScreen() {
  const [takes, setTakes] = useState<StudioTake[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const refresh = async () => {
    const rows = (await listTakes()).filter((t) => t.kept || t.status === 'recovered');
    setTakes(rows);
    const names: Record<string, string> = {};
    for (const take of rows) {
      if (take.scriptId && !names[take.scriptId])
        names[take.scriptId] = (await getScript(take.scriptId))?.title ?? 'Deleted script';
    }
    setTitles(names);
  };
  useEffect(() => {
    void refresh();
  }, []);
  const grouped = takes.reduce<Record<string, StudioTake[]>>((groups, take) => {
    const key = take.scriptId ?? 'free';
    (groups[key] ??= []).push(take);
    return groups;
  }, {});
  return (
    <section class="studio-screen">
      <h1>Takes</h1>
      <StorageMeter />
      {!takes.length && <p>No takes yet. Record a video to see it here.</p>}
      {Object.entries(grouped).map(([id, rows]) => (
        <div class="studio-card">
          <h2>{id === 'free' ? 'Free records' : (titles[id] ?? 'Script')}</h2>
          {rows?.map((take) => (
            <a class="take-row" href={`#/takes/${take.id}`}>
              <span>
                Take {take.number} · {Math.round(take.durationMs / 1000)}s ·{' '}
                {take.container.toUpperCase()}
              </span>
              <span>
                {!take.exportedAt ? 'Unsaved ' : ''}
                {take.starred ? 'Starred ' : ''}
                {take.status === 'recovered' ? 'Recovered' : ''}
              </span>
            </a>
          ))}
        </div>
      ))}
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
      size_bucket:
        take.sizeBytes < 1e7
          ? 'under_10mb'
          : take.sizeBytes < 5e7
            ? '10_50mb'
            : take.sizeBytes < 2e8
              ? '50_200mb'
              : '200mb_plus',
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
