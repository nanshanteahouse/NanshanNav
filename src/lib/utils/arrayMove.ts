/**
 * Returns a new array with the item at `fromIndex` moved to `toIndex`.
 *
 * Does NOT mutate the original array.
 * Clamps out-of-bounds indices to [0, arr.length - 1].
 * Returns a copy for empty, single-element, or same-index calls.
 */
export function arrayMove<T>(
  arr: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  // Trivial cases: empty, single item, or no movement needed
  if (arr.length <= 1 || fromIndex === toIndex) {
    return [...arr];
  }

  const from = Math.max(0, Math.min(fromIndex, arr.length - 1));
  const to = Math.max(0, Math.min(toIndex, arr.length - 1));

  // After clamping, from and to may coincide
  if (from === to) {
    return [...arr];
  }

  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
