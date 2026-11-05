import { useEffect, useState } from 'preact/hooks';
import { downloadReminder } from '../domain/studio/ics';
import { isStandaloneDisplay, installPlatform } from '../domain/studio/install';
import { loadSettings, saveSettings } from '../domain/studio/settings';
import type { StudioSettings } from '../domain/studio/types';

export function ReminderCard({
  activeDays = 0,
  always = false,
}: {
  activeDays?: number;
  always?: boolean;
}) {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    void loadSettings().then(setSettings);
    const onInstalled = () => setInstalled(true);
    addEventListener('studio-installed', onInstalled);
    return () => removeEventListener('studio-installed', onInstalled);
  }, []);
  if (
    !settings ||
    (!always && activeDays < 2 && !installed) ||
    (!always && settings.reminders.enabled)
  )
    return null;
  const add = async () => {
    const ios = installPlatform(navigator.userAgent, navigator.maxTouchPoints) === 'ios';
    downloadReminder(settings.reminders.time, ios && isStandaloneDisplay());
    const next = { ...settings, reminders: { ...settings.reminders, enabled: true } };
    setSettings(next);
    await saveSettings(next);
  };
  return (
    <section class="studio-card" aria-label="Daily reminder">
      <h2>Daily reminder</h2>
      <p>
        We will create a daily calendar alert at {settings.reminders.time}. You can change it in
        your calendar.
      </p>
      {always && (
        <label class="studio-label">
          Reminder time
          <input
            type="time"
            value={settings.reminders.time}
            onInput={(event) => {
              const next = {
                ...settings,
                reminders: {
                  ...settings.reminders,
                  time: (event.target as HTMLInputElement).value,
                },
              };
              setSettings(next);
              void saveSettings(next);
            }}
          />
        </label>
      )}
      <button class="studio-button" onClick={() => void add()}>
        Add to calendar
      </button>
    </section>
  );
}
