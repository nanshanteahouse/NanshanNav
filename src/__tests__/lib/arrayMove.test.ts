import { describe, it, expect } from 'vitest';
import { arrayMove } from '../../lib/utils/arrayMove';

describe('arrayMove', () => {
  it('moves item from index 1 to index 3', () => {
    expect(arrayMove(['a', 'b', 'c', 'd', 'e'], 1, 3)).toEqual(['a', 'c', 'd', 'b', 'e']);
  });

  it('returns new copy when fromIndex equals toIndex', () => {
    const arr = [1, 2, 3];
    const result = arrayMove(arr, 1, 1);
    expect(result).toEqual([1, 2, 3]);
    expect(result).not.toBe(arr); // different reference
  });

  it('moves first item to last position', () => {
    expect(arrayMove([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
  });

  it('moves last item to first position', () => {
    expect(arrayMove([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
  });

  it('handles single-element array (clamps out-of-bounds)', () => {
    expect(arrayMove(['x'], 0, 5)).toEqual(['x']);
  });

  it('handles empty array', () => {
    expect(arrayMove([], 0, 0)).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const original = [10, 20, 30, 40];
    const copy = [...original];
    arrayMove(original, 0, 3);
    expect(original).toEqual(copy);
  });
});
