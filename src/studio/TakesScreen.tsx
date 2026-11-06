import { useEffect, useRef, useState } from 'preact/hooks';
import { analytics, deviceClass } from '../domain/analytics';
import { exportTake, exportTakes, sizeBucket } from '../domain/studio/exportTake';
import { parseMarkup } from '../domain/studio/markup';
import { getScript } from '../domain/studio/scriptsRepo';
import { deleteTake, getTake, listTakes, saveTake, takeBlob } from '../domain/studio/takesRepo';
import { formatBytes, minutesLeft, storageEstimate } from '../domain/studio/storage';
import type { StudioScript, StudioTake } from '../domain/studio/types';
import { videoBitrate } from '../domain/studio/mime';
import { Icon } from './Icons';
import { Overflow } from './Overflow';
import { TakeToolSheet, type TakeTool } from './TakeTools';

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
    <div class="studio-storage">
      <p>
        {formatBytes(estimate.usage)} used · about{' '}
        {minutesLeft(available, videoBitrate('1080p', 30, 'high'))} min left at 1080p
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
/** A 2-up grid tile: the first frame as a thumbnail, play on tap, actions in a ... menu. */
function TakeTile({
  take,
  title,
  refresh,
}: {
  take: StudioTake;
  title: string;
  refresh: () => Promise<void>;
}) {
  const tile = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [url, setUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    // Read the take from storage only when its tile is about to scroll into view.
    if (!tile.current || typeof IntersectionObserver === 'undefined') return setNear(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(tile.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!near) return;
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
  }, [take.id, near]);
  return (
    <article class="studio-take-tile" ref={tile}>
      <div class="studio-take-tile__media">
        {url ? (
          // The #t fragment makes Safari paint the first frame as a thumbnail.
          <video
            ref={video}
            src={`${url}#t=0.1`}
            playsInline
            preload="metadata"
            controls={playing}
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <span class="studio-take-tile__placeholder">
            <Icon name="takes" size={40} />
          </span>
        )}
        {!playing && (
          <button
            class="studio-take-tile__play"
            aria-label={`Play take ${take.number}`}
            disabled={!url}
            onClick={() => {
              setPlaying(true);
              void video.current?.play();
            }}
          >
            <Icon name="play" />
          </button>
        )}
        {take.starred && (
          <span class="studio-take-tile__star" aria-hidden="true">
            <Icon name="star" size={16} />
          </span>
        )}
      </div>
      <div class="studio-take-tile__meta">
        <a href={`#/takes/${take.id}`}>
          Take {take.number} · {Math.round(take.durationMs / 1000)}s
          {take.starred && <span class="studio-visually-hidden"> Starred</span>}
          {take.status === 'recovered' && <small> Recovered</small>}
        </a>
        <Overflow label={`More actions for take ${take.number}`} up>
          <button onClick={() => void exportTake(take, title).then(refresh)}>
            <Icon name="share" size={18} /> Share
          </button>
          <button onClick={() => void saveTake({ ...take, starred: !take.starred }).then(refresh)}>
            <Icon name="star" size={18} /> {take.starred ? 'Unstar' : 'Star'}
          </button>
          <button onClick={() => setConfirming(true)}>
            <Icon name="trash" size={18} /> Delete
          </button>
        </Overflow>
      </div>
      {confirming && (
        <div
          class="studio-take-tile__confirm"
          role="group"
          aria-label={`Delete take ${take.number}?`}
        >
          <button class="studio-chip" onClick={() => setConfirming(false)}>
            Cancel
          </button>
          <button
            class="studio-chip studio-chip--danger-solid"
            aria-label={`Confirm delete take ${take.number}`}
            onClick={() => void deleteTake(take.id).then(refresh)}
          >
            Delete
          </button>
        </div>
      )}
    </article>
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
  const tiles = (rows: StudioTake[], id: string) => (
    <div class="studio-takes-grid">
      {rows.map((take) => (
        <TakeTile key={take.id} take={take} title={titles[id] ?? 'Take'} refresh={refresh} />
      ))}
    </div>
  );
  return (
    <section class="studio-screen">
      <h1>Takes</h1>
      <StorageMeter />
      {takes.some((take) => !take.exportedAt) && (
        <p class="studio-storage-warning">Save it to Photos now. Browser storage can be cleared.</p>
      )}
      {!takes.length && <p class="studio-muted">No takes yet. Tap the camera to record one.</p>}
      {message && <p role="status">{message}</p>}
      {Object.entries(grouped).map(([id, rows]) => {
        const parts = [...new Set(rows.map(sectionOf))].sort((a, b) => a - b);
        return (
          <section class="studio-take-group" key={id}>
            <div class="studio-section-head">
              <h2>{id === 'free' ? 'Free records' : (titles[id] ?? 'Script')}</h2>
              {rows.some((take) => take.starred) && (
                <button class="studio-pill" onClick={() => void saveStarred(rows)}>
                  <Icon name="share" size={18} />
                  Save starred takes
                </button>
              )}
            </div>
            {rows.some((take) => sectionOf(take) >= 0)
              ? parts.map((part) => (
                  <div key={part}>
                    <h3>
                      {part < 0
                        ? 'Whole script'
                        : `Section ${part + 1}${sectionTitles[id]?.[part] ? `: ${sectionTitles[id][part]}` : ''}`}
                    </h3>
                    {tiles(
                      rows.filter((take) => sectionOf(take) === part),
                      id,
                    )}
                  </div>
                ))
              : tiles(rows, id)}
          </section>
        );
      })}
      {takes.some((take) => take.exportedAt) && (
        <button
          class="studio-button studio-button--quiet studio-takes__clear"
          onClick={async () => {
            for (const take of takes.filter((t) => t.exportedAt)) await deleteTake(take.id);
            await refresh();
          }}
        >
          <Icon name="trash" size={20} />
          Delete saved takes
        </button>
      )}
    </section>
  );
}
export function TakeScreen({ id }: { id: string }) {
  const [take, setTake] = useState<StudioTake | null>(null);
  const [script, setScript] = useState<StudioScript | null>(null);
  const [tool, setTool] = useState<TakeTool | null>(null);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    void getTake(id).then(async (row) => {
      setTake(row ?? null);
      if (row?.scriptId) setScript((await getScript(row.scriptId)) ?? null);
    });
  }, [id]);
  if (!take)
    return (
      <section class="studio-screen">
        <h1>Take not found</h1>
      </section>
    );
  const title = script?.title ?? null;
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
  const toggleStar = () =>
    void saveTake({ ...take, starred: !take.starred }).then(() =>
      setTake({ ...take, starred: !take.starred }),
    );
  return (
    <section class="studio-screen studio-take-detail">
      <a class="studio-back" href="#/takes">
        Takes
      </a>
      <h1>Take {take.number}</h1>
      <TakePlayer take={take} />
      {!take.exportedAt && <p>Save it to Photos now. Browser storage can be cleared.</p>}
      <p class="studio-muted">
        {take.status === 'recovered' ? 'Recovered · ' : ''}
        {Math.round(take.durationMs / 1000)}s · {take.container.toUpperCase()} · {take.width} ×{' '}
        {take.height} · {Math.round(take.frameRate)} fps · {formatBytes(take.sizeBytes)}
      </p>
      {/* Hidden while a sheet is open, so the sheet's action is the screen's one accent. */}
      <div class="studio-take-actions" hidden={Boolean(tool)}>
        <button class="studio-button" onClick={() => void save()}>
          <Icon name="share" size={20} />
          {deviceClass() === 'desktop' ? `Download ${take.container.toUpperCase()}` : 'Save video'}
        </button>
        <button
          class="studio-button studio-button--quiet studio-icon-button"
          aria-label={take.starred ? 'Unstar' : 'Star'}
          onClick={toggleStar}
        >
          <Icon name="star" size={20} />
        </button>
        <Overflow label="More take actions" up>
          <button onClick={() => setTool('chapters')}>
            <Icon name="chapters" size={18} /> Chapters
          </button>
          <button onClick={() => setTool('captions')}>
            <Icon name="captions" size={18} /> Captions
          </button>
          {take.container === 'webm' && (
            <button onClick={() => setTool('convert')}>
              <Icon name="convert" size={18} /> Convert to MP4
            </button>
          )}
          <button onClick={() => setTool('trim')}>
            <Icon name="scissors" size={18} /> Trim
          </button>
          <button onClick={() => setConfirming(true)}>
            <Icon name="trash" size={18} /> Delete
          </button>
        </Overflow>
      </div>
      {confirming && (
        <div class="studio-take-confirm" role="group" aria-label={`Delete take ${take.number}?`}>
          <button class="studio-chip" onClick={() => setConfirming(false)}>
            Cancel
          </button>
          <button
            class="studio-chip studio-chip--danger-solid"
            aria-label={`Confirm delete take ${take.number}`}
            onClick={() =>
              void deleteTake(take.id).then(() => {
                location.hash = '#/takes';
              })
            }
          >
            Delete
          </button>
        </div>
      )}
      {tool && (
        <TakeToolSheet
          tool={tool}
          take={take}
          script={script}
          onClose={() => setTool(null)}
          onChange={setTake}
        />
      )}
    </section>
  );
}
