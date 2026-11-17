export type ScoredEvent = {
  title: string;
  description: string;
  date: string;
  endDate?: string;
  semester?: string;
  activityPoints?: number;
};

export type EventParticipation = Record<string, Record<string, boolean>>;

export function validSemester(value: string): boolean {
  return /^[0-9]{2}-[12]$/.test(value);
}

export function eventDateLabel(event: ScoredEvent): string {
  return event.endDate && event.endDate !== event.date ? `${event.date} ~ ${event.endDate}` : event.date;
}

export function eventPoints(event: ScoredEvent): number {
  return Number.isInteger(event.activityPoints) && (event.activityPoints ?? 0) >= 0
    ? event.activityPoints as number
    : 1;
}

export function participatedEvents(events: Record<string, ScoredEvent>, participation: Record<string, boolean>, semester?: string) {
  return Object.entries(events)
    .filter(([key, event]) => participation[key] === true && (!semester || event.semester === semester))
    .sort(([, a], [, b]) => b.date.localeCompare(a.date));
}

export function activityScore(events: Record<string, ScoredEvent>, participation: Record<string, boolean>, semester?: string): number {
  return participatedEvents(events, participation, semester).reduce((sum, [, event]) => sum + eventPoints(event), 0);
}
