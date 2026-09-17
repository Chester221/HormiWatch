export interface TaskSegment {
  startDateTime: string;
  endDateTime: string;
}

export function buildTaskSegments(
  days: { date: string }[],
  startTime: string,
  endTime: string
): TaskSegment[] {
  return days.map((day, index) => {
    const isFirst = index === 0;
    const isLast = index === days.length - 1;

    const start = new Date(`${day.date}T${isFirst ? startTime : "00:00"}:00`);
    const end = new Date(`${day.date}T${isLast ? endTime : "23:59"}:00`);

    if (end.getTime() <= start.getTime()) {
      end.setDate(end.getDate() + 1);
    }

    return {
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    };
  });
}