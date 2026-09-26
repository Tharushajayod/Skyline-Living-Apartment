/**
 * Centralized Date and Time Utilities for Skyline Living
 * Consistent with Sri Lanka Standard Time (Asia/Colombo, UTC+05:30)
 */

export const SRI_LANKA_TIMEZONE = 'Asia/Colombo';

export const ALL_VIEWING_TIME_SLOTS: string[] = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
];

/**
 * Returns today's date formatted as YYYY-MM-DD in Sri Lankan timezone.
 * Avoids UTC boundary drift around midnight.
 */
export function getTodayDateString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: SRI_LANKA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Returns tomorrow's date formatted as YYYY-MM-DD.
 */
export function getTomorrowDateString(): string {
  const todayStr = getTodayDateString();
  const [y, m, d] = todayStr.split('-').map(Number);
  const tomorrow = new Date(y, m - 1, d + 1);
  const ty = tomorrow.getFullYear();
  const tm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const td = String(tomorrow.getDate()).padStart(2, '0');
  return `${ty}-${tm}-${td}`;
}

/**
 * Checks if a given YYYY-MM-DD date is strictly in the past (before today).
 */
export function isPastDate(dateStr?: string | null): boolean {
  if (!dateStr || !dateStr.trim()) return false;
  return dateStr.trim() < getTodayDateString();
}

/**
 * Checks if a given YYYY-MM-DD date is today.
 */
export function isToday(dateStr?: string | null): boolean {
  if (!dateStr || !dateStr.trim()) return false;
  return dateStr.trim() === getTodayDateString();
}

/**
 * Parses the start time of a time slot like "09:00 AM - 10:00 AM" into 24-hour hour & minute.
 */
export function parseSlotStartTime(slot: string): { hour: number; minute: number } | null {
  try {
    const startPart = slot.split('-')[0].trim();
    const [timePart, modifier] = startPart.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (isNaN(hours)) return null;
    minutes = isNaN(minutes) ? 0 : minutes;

    if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;

    return { hour: hours, minute: minutes };
  } catch {
    return null;
  }
}

/**
 * Checks if a viewing time slot has already passed for the current time today.
 */
export function isTimeSlotPassedToday(slot: string): boolean {
  const parsed = parseSlotStartTime(slot);
  if (!parsed) return false;

  // Get current hour and minute in Sri Lankan timezone
  let currentHour: number;
  let currentMinute: number;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: SRI_LANKA_TIMEZONE,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(new Date());

    currentHour = Number(parts.find((p) => p.type === 'hour')?.value ?? new Date().getHours());
    currentMinute = Number(parts.find((p) => p.type === 'minute')?.value ?? new Date().getMinutes());
  } catch {
    const now = new Date();
    currentHour = now.getHours();
    currentMinute = now.getMinutes();
  }

  if (currentHour > parsed.hour) return true;
  if (currentHour === parsed.hour && currentMinute >= parsed.minute) return true;
  return false;
}

/**
 * Filters the list of time slots based on the selected date:
 * - If in the past: returns empty list.
 * - If today: excludes time slots that have already passed.
 * - If in the future: returns all slots.
 */
export function getAvailableTimeSlots(dateStr?: string | null, allSlots: string[] = ALL_VIEWING_TIME_SLOTS): string[] {
  if (!dateStr || isPastDate(dateStr)) {
    return [];
  }
  if (isToday(dateStr)) {
    return allSlots.filter((slot) => !isTimeSlotPassedToday(slot));
  }
  return allSlots;
}
