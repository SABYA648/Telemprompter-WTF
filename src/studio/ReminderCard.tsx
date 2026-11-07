import { useEffect, useState } from 'preact/hooks';
import { downloadReminder } from '../domain/studio/ics';
import { isStandaloneDisplay, installPlatform } from '../domain/studio/install';
import { loadSettings, saveSettings } from '../domain/studio/settings';
import type { StudioSettings } from '../domain/studio/types';

export function ReminderCard({
  activeDays = 0,
  always = false,
  onNotNow,
}: {
  activeDays?: number;
  always?: boolean;
  /** Home only: snoozes the suggestion so other asks get their turn. */
  onNotNow?: () => void;
}) {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [installed, setInstalled] = useState(() => isStandaloneDisplay());
  useEffect(() => {
    void loadSettings().then(setSettings);
    const onInstalled = () => setInstalled(true);
    addEventListener('studio-installed', onInstalled);
    return () => removeEventListener('studio-installed', onInstalled);
  }, []);
  if (
    !settings ||
    (!always && activeDays < 2 && !installed) ||
    (!always && (!settings.reminders.askEnabled || settings.reminders.fileDownloaded))
  )
    return null;
  const add = async () => {
    const ios = installPlatform(navigator.userAgent, navigator.maxTouchPoints) === 'ios';
    downloadReminder(settings.reminders.time, ios && isStandaloneDisplay());
    const next = { ...settings, reminders: { ...settings.reminders, fileDownloaded: true } };
    setSettings(next);
    await saveSettings(next);
  };
  return (
    <section class="studio-card" aria-label="Daily reminder">
      <h2>Daily reminder</h2>
      <p>
        Download a daily calendar reminder file for {settings.reminders.time}. Open and import it in
        your calendar to turn on the alert.
      </p>
      {always && settings.reminders.fileDownloaded && (
        <p role="status">
          Reminder file downloaded. Check your calendar to confirm you imported it.
        </p>
      )}
      {always && (
        <>
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
          <label class="studio-setting-field">
            <input
              type="checkbox"
              checked={settings.reminders.askEnabled}
              onChange={(event) => {
                const next = {
                  ...settings,
                  reminders: {
                    ...settings.reminders,
                    askEnabled: (event.target as HTMLInputElement).checked,
                  },
                };
                setSettings(next);
                void saveSettings(next);
              }}
            />{' '}
            Show reminder suggestion on Home
          </label>
        </>
      )}
      <div class="studio-actions">
        <button class="studio-button studio-button--quiet" onClick={() => void add()}>
          Download calendar file
        </button>
        {onNotNow && !always && (
          <button class="studio-button studio-button--quiet" onClick={onNotNow}>
            Not now
          </button>
        )}
      </div>
    </section>
  );
}
