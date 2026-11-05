import { expect, it } from 'vitest';
import { reminderIcs } from './ics';

it('creates a floating daily event with an alarm and a calendar link', () => {
  const text = reminderIcs('19:00', false, new Date(2026, 10, 5, 12));
  expect(text).toContain('DTSTART:20261105T190000');
  expect(text).toContain('RRULE:FREQ=DAILY');
  expect(text).toContain('BEGIN:VALARM');
  expect(text).toContain(
    'URL:https://www.teleprompter.wtf/studio?utm_source=calendar&utm_medium=reminder',
  );
  expect(text).not.toContain('DTSTART;TZID');
});
it('omits URL in standalone iOS and schedules tomorrow if time has passed', () => {
  const text = reminderIcs('09:00', true, new Date(2026, 10, 5, 12));
  expect(text).toContain('DTSTART:20261106T090000');
  expect(text).not.toContain('URL:');
});
