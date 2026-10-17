import { describe, expect, it } from 'vitest';
import { groupTrips, privateDestinations } from '@/lib/content';
import { buildCatalog, privateHasPage, type TripRow } from '@/lib/catalog';

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

describe('Private trip page details (Masirah fishing trip)', () => {
  const masirah = privateDestinations.find((d) => d.id === 'masirah-island')!;
  it('has a label, price, guest number, itinerary and boat section', () => {
    expect(masirah.tag?.en).toBe('Fishing Trip');
    expect(masirah.price?.en).toMatch(/OMR/);
    expect(masirah.maxGuests).toBe(10);
    expect(masirah.showItinerary).toBe(true);
    expect(masirah.itinerary!.length).toBeGreaterThan(0);
    expect(masirah.boat!.specs.length).toBeGreaterThan(0);
    expect(masirah.boat!.amenities.length).toBeGreaterThan(0);
  });
  it('leaves the other private trips as plain cards', () => {
    for (const d of privateDestinations.filter((x) => x.id !== 'masirah-island')) expect(privateHasPage(d)).toBe(false);
    expect(privateHasPage(masirah)).toBe(true);
  });
});

describe('Private trip details coming from the database', () => {
  const row = (over: Partial<TripRow>): TripRow => ({
    id: 1, slug: 'p', kind: 'private', category: null, region: 'oman', destination: null, name_en: 'P', name_ar: 'ب', description_en: '', description_ar: '', image: null,
    location_en: null, location_ar: null, duration_en: null, duration_ar: null, group_size_en: null, group_size_ar: null, max_group: null, accommodation_en: null, accommodation_ar: null,
    price: null, price_type: 'contact', itinerary: '[]', inclusions: '[]', exclusions: '[]', requirements: '[]', terms: '[]', is_sample: 0, is_active: 1, sort_order: 0, ...over,
  });
  const build = (r: TripRow) => buildCatalog({ trips: [r], schedules: [] }).privateDestinations[0]!;
  it('old rows without details stay plain', () => {
    const d = build(row({}));
    expect(privateHasPage(d)).toBe(false);
    expect(d.boat).toBeUndefined();
  });
  it('hides the itinerary and the boat when the switches are off, and uses a custom policy', () => {
    const itin = JSON.stringify([{ title: { en: 'A', ar: 'أ' }, text: { en: 'x', ar: 'س' } }]);
    const off = build(row({ itinerary: itin, details: JSON.stringify({ show_itinerary: false, boat: { enabled: false, specs: [{ label: { en: 'L', ar: 'ط' }, value: { en: '1', ar: '1' } }] } }) }));
    expect(off.showItinerary).toBe(false);
    expect(off.boat).toBeUndefined();
    const on = build(row({ price: 300, price_type: 'group', max_group: 8, itinerary: itin, details: JSON.stringify({ tag: { en: 'Fishing Trip', ar: 'رحلة صيد' }, show_itinerary: true, show_cancellation: false, cancellation: [{ en: 'Custom', ar: 'مخصص' }] }) }));
    expect(on.showItinerary).toBe(true);
    expect(on.showCancellation).toBe(false);
    expect(on.cancellation![0]!.en).toBe('Custom');
    expect(on.price!.en).toBe('OMR 300 per group');
    expect(on.maxGuests).toBe(8);
  });
});
