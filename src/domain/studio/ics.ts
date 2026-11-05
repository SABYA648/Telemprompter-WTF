export function reminderIcs(time: string, standaloneIos: boolean, now = new Date()): string {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Invalid reminder time');
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const [hour, minute] = time.split(':').map(Number);
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  if (first <= now) first.setDate(first.getDate() + 1);
  const floating = (date: Date) =>
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}00`;
  const end = new Date(first);
  end.setHours(end.getHours() + 1);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//teleprompter.wtf//Studio//EN',
    'BEGIN:VEVENT',
    `UID:studio-reminder-${stamp}@teleprompter.wtf`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${floating(first)}`,
    `DTEND:${floating(end)}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Record your next video',
    ...(standaloneIos
      ? []
      : ['URL:https://www.teleprompter.wtf/studio?utm_source=calendar&utm_medium=reminder']),
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-PT0M',
    'DESCRIPTION:Time to record your next video',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadReminder(time: string, standaloneIos: boolean): void {
  const url = URL.createObjectURL(
    new Blob([reminderIcs(time, standaloneIos)], { type: 'text/calendar;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'teleprompter-daily-reminder.ics';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
