import { MARK_WEIGHTS } from "./constants";

export function computeTotalMark(
  assignment: number,
  exam: number,
  final: number
): number {
  return (
    assignment * MARK_WEIGHTS.assignment +
    exam * MARK_WEIGHTS.exam +
    final * MARK_WEIGHTS.final
  );
}
