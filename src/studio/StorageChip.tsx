import { useEffect, useState } from 'preact/hooks';
import { analytics } from '../domain/analytics';
import { formatBytes, minutesLeft, storageEstimate } from '../domain/studio/storage';
import { videoBitrate } from '../domain/studio/mime';
import { Icon } from './Icons';

/** Browser storage use. Takes reports the storage warning; Settings shows the chip. */
export function useStorageEstimate(track = false) {
  const [estimate, setEstimate] = useState({ usage: 0, quota: 0 });
  useEffect(() => {
    void storageEstimate().then((value) => {
      setEstimate(value);
      if (track && value.quota > 0) {
        const usage = value.usage / value.quota;
        if (usage >= 0.95) analytics.track('storage_warning', { level: 95 });
        else if (usage >= 0.8) analytics.track('storage_warning', { level: 80 });
      }
    });
  }, []);
  return estimate;
}

export function StorageChip() {
  const estimate = useStorageEstimate();
  if (!estimate.quota) return null;
  const used = formatBytes(estimate.usage);
  const minutes = minutesLeft(estimate.quota - estimate.usage, videoBitrate('1080p', 30, 'high'));
  const detail = `${used} used · about ${minutes} min left at 1080p`;
  return (
    <p class="studio-storage" role="img" aria-label={detail} title={detail}>
      <Icon name="storage" size={16} />
      {used} · ~{minutes} min
    </p>
  );
}
