import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { categories, bi, pageHead } from '@/lib/content';
import { resolveImage } from '@/lib/catalog';
import { getGalleryPhotos } from '@/lib/gallery.functions';
import { useLanguage, headLang } from '@/lib/language';
import { PageHeading } from '@/components/experience-components';

export const Route = createFileRoute('/gallery')({
  head: ({ matches }) =>
    pageHead(
      headLang(matches),
      bi('Oman Adventure Gallery', 'معرض مغامرات عُمان'),
      bi(
        'Explore the landscapes and moments that inspire Earth Adventure trips across Oman: the sea, camping under the stars, mountains and wadis.',
        'استكشف المناظر واللحظات التي تلهم رحلات Earth Adventure في أنحاء عُمان: البحر والتخييم تحت النجوم والجبال والأودية.',
      ),
    ),
  loader: () => getGalleryPhotos(),
  component: Gallery,
});

function Gallery() {
  const { lang, t } = useLanguage();
  const data = Route.useLoaderData();
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState<number | null>(null);

  // photos saved in the admin panel (or the built-in samples when none were saved yet)
  const photos = data.photos
    .map((p) => ({ image: resolveImage(p.image), category: p.category, name: bi(p.title_en, p.title_ar) }))
    .filter((p): p is { image: string; category: string | null; name: { en: string; ar: string } } => !!p.image);
  const label = (p: { name: { en: string; ar: string } }) => p.name[lang] || p.name.en || p.name.ar;
  const alt = (p: { name: { en: string; ar: string } }) => label(p) || t('Earth Adventure photo', 'صورة من Earth Adventure');
  const filters = categories.filter((c) => photos.some((p) => p.category === c.id));
  const list = photos.filter((p) => filter === 'all' || p.category === filter);
  const p = active === null ? null : list[active];

  return (
    <>
      <PageHeading
        title={t('A place for your imagination.', 'مساحة لخيالك.')}
        description={t('A glimpse of the landscapes that inspire us. See where your curiosity takes you.', 'لمحة من المناظر التي تلهمنا. دع فضولك يقودك.')}
        eyebrow={t('Oman in focus', 'عُمان في الصورة')}
      />
      <section className="section">
        <div className="container">
          {filters.length > 0 && (
            <div className="filter-bar">
              <Button
                variant="outline"
                aria-pressed={filter === 'all'}
                onClick={() => {
                  setFilter('all');
                  setActive(null);
                }}
              >
                {t('All landscapes', 'جميع المناظر')}
              </Button>
              {filters.map((c) => (
                <Button
                  key={c.id}
                  variant="outline"
                  aria-pressed={filter === c.id}
                  onClick={() => {
                    setFilter(c.id);
                    setActive(null);
                  }}
                >
                  {c.title[lang]}
                </Button>
              ))}
            </div>
          )}
          <div className="gallery-grid">
            {list.map((item, i) => (
              <Button
                key={item.image + i}
                className="gallery-item"
                variant="ghost"
                aria-label={t('View image: ', 'عرض الصورة: ') + alt(item)}
                onClick={() => setActive(i)}
              >
                <img src={item.image} alt={alt(item)} width="700" height="700" loading="lazy" />
                {label(item) && <span>{label(item)}</span>}
              </Button>
            ))}
          </div>
          {!data.custom && (
            <p className="notice">
              {t(
                'Illustrative landscape imagery created for inspiration. These are not photographs of Earth Adventure customers, trips, or company-owned equipment.',
                'صور توضيحية للمناظر الطبيعية للإلهام. ليست صورًا لعملاء Earth Adventure أو رحلاتها أو معدات مملوكة للشركة.',
              )}
            </p>
          )}
        </div>
      </section>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent
          className="max-w-5xl"
          onKeyDown={(ev) => {
            if (active === null) return;
            const next = lang === 'ar' ? 'ArrowLeft' : 'ArrowRight';
            const prev = lang === 'ar' ? 'ArrowRight' : 'ArrowLeft';
            if (ev.key === next) setActive((active + 1) % list.length);
            if (ev.key === prev) setActive((active - 1 + list.length) % list.length);
          }}
        >
          <DialogTitle>{p ? label(p) || alt(p) : ''}</DialogTitle>
          <DialogDescription className="sr-only">{t('Photo gallery', 'معرض الصور')}</DialogDescription>
          {p && <img className="lightbox-image" src={p.image} alt={alt(p)} width="1440" height="1024" />}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="icon"
              aria-label={t('Previous photo', 'الصورة السابقة')}
              onClick={() => {
                if (active !== null) setActive((active - 1 + list.length) % list.length);
              }}
            >
              <ArrowLeft />
            </Button>
            <span className="text-sm text-muted-foreground">
              {active === null ? 0 : active + 1} / {list.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('Next photo', 'الصورة التالية')}
              onClick={() => {
                if (active !== null) setActive((active + 1) % list.length);
              }}
            >
              <ArrowRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
