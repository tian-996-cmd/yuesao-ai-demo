export type DateRange = { start: Date; end: Date };
export function rangesOverlap(first: DateRange, second: DateRange) {
  return (
    first.start.getTime() <= second.end.getTime() &&
    first.end.getTime() >= second.start.getTime()
  );
}
