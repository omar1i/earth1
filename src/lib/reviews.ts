// Guest reviews shown on the home page ("Guest stories").
// Taken from the company's Tripadvisor page; the guests agreed to have their words shown on the website.
// Wording is the guest's own (only trimmed to a short excerpt, with spacing / capital-letter clean-up).
// To add or change a review: edit this list. `ar` is used only when the guest really wrote in Arabic.
// Update the numbers below from time to time (they are copied from the Tripadvisor listing).

export type GuestReview = {
  id: string;
  name: string;
  date: { en: string; ar: string };
  stars: number;
  meta: { en: string; ar: string };
  headline?: { en: string; ar?: string };
  text: { en: string; ar?: string };
};

export const tripadvisor = {
  rating: 4.9,
  count: 47,
  rank: 74,
  rankOf: 625,
  asOf: 'October 2026',
  url: 'https://www.tripadvisor.com/Attraction_Review-g1940497-d25403033-Reviews-Earth_Adventure-Muscat_Muscat_Governorate.html',
  writeUrl: 'https://www.tripadvisor.com/UserReviewEdit-g1940497-d25403033-Earth_Adventure-Muscat_Muscat_Governorate.html',
};

export const reviews: GuestReview[] = [
  {
    id: 'aqdar',
    name: 'AQDAR',
    date: { en: 'Nov 2025', ar: 'نوفمبر 2025' },
    stars: 5,
    meta: { en: 'Solo trip', ar: 'رحلة منفردة' },
    text: { en: '…everything was perfect from the start of the trip till the very end. The guides were very professional, kind, welcoming and respectful.' },
  },
  {
    id: 'anfal-k',
    name: 'anfal k',
    date: { en: 'May 2025', ar: 'مايو 2025' },
    stars: 5,
    meta: { en: 'Tripadvisor guest', ar: 'ضيف على Tripadvisor' },
    headline: { en: 'The best trip ever' },
    text: { en: 'Amazing trip, good team, great experience, I will do it again.' },
  },
  {
    id: 'ayesha',
    name: 'Ayesha',
    date: { en: 'Sep 2024', ar: 'سبتمبر 2024' },
    stars: 5,
    meta: { en: 'With friends', ar: 'مع الأصدقاء' },
    text: { en: 'I have done various trips with Dalal and each trip has been amazing!' },
  },
  {
    id: 'smubarak',
    name: 'SMubarak',
    date: { en: 'Nov 2023', ar: 'نوفمبر 2023' },
    stars: 5,
    meta: { en: 'With friends', ar: 'مع الأصدقاء' },
    headline: { en: 'Amazing trip in Oman' },
    text: {
      en: 'I was a bit hesitant to push myself out of my comfort zone, however they made it really easy. It felt like travelling among my friends and family.',
      ar: 'ما شاء الله الطاقم ولا أروع محترمين جداً',
    },
  },
  {
    id: 'maha-k',
    name: 'Maha K',
    date: { en: 'Apr 2023', ar: 'أبريل 2023' },
    stars: 5,
    meta: { en: 'Solo trip', ar: 'رحلة منفردة' },
    text: { en: 'All accommodation, transportation, water, snacks, and main meals were covered. I would definitely go on trips with them again.' },
  },
  {
    id: 'hamad-a',
    name: 'Hamad A',
    date: { en: 'Feb 2023', ar: 'فبراير 2023' },
    stars: 5,
    meta: { en: 'Kuwait City', ar: 'مدينة الكويت' },
    headline: { en: 'Awesome Oman with Earth Adventure' },
    text: {
      en: 'Awesome adventure team, we saw the treasure that is Oman like never before.',
      ar: 'تجربة فريدة من نوعها و طاقم متفهم و ذو خبرة مع قيادة الكابتن دلال',
    },
  },
];
