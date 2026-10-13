import { describe, expect, it } from 'vitest';
import { groupTrips, privateDestinations } from '@/lib/content';

describe('Oman trips content', () => {
  it('has the four private destinations', () => {
    expect(privateDestinations.map((d) => d.id)).toEqual(['wadi-al-arbaeen', 'jabal-akhdar', 'masirah-island', 'salalah']);
  });
  it('has the three group trips with unique ids and full details', () => {
    expect(groupTrips).toHaveLength(3);
    expect(new Set(groupTrips.map((t) => t.id)).size).toBe(3);
    for (const t of groupTrips) {
      expect(t.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.itinerary.length).toBeGreaterThan(0);
      expect(t.inclusions.length).toBeGreaterThan(0);
      expect(t.terms.length).toBeGreaterThan(0);
    }
  });
});
