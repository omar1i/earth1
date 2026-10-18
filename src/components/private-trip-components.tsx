import type { ComponentType } from 'react';
import {
  Anchor, BriefcaseMedical, Check, Clock, Fish, Fuel, Gauge, LifeBuoy, Music, Navigation, Radar, Ruler,
  ShowerHead, Ship, Snowflake, Sun, Users, Glasses, Waves,
} from 'lucide-react';
import { useLanguage } from '@/lib/language';
import type { PrivateBoat } from '@/lib/content';

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
// The admin writes free text, so icons are picked from keywords (English or Arabic). The first matching rule wins,
// so the more specific words come first (e.g. "trolling motor for fishing" must not get the fish icon).
// Unknown text gets a check mark.
const pick = (text: string, rules: [RegExp, Icon][], fallback: Icon): Icon => rules.find(([re]) => re.test(text))?.[1] ?? fallback;
const specRules: [RegExp, Icon][] = [
  [/length|طول/i, Ruler], [/engine|motor|\bhp\b|محرك/i, Gauge], [/capacity|guest|people|seat|سعة|أشخاص|ضيوف/i, Users],
  [/marina|port|depart|مرسى|ميناء|انطلاق/i, Anchor], [/trip|type|duration|time|نوع|مدة|رحلة/i, Clock],
];
const amenityRules: [RegExp, Icon][] = [
  [/trolling|motor|محرك/i, Waves], [/shower|bath|toilet|حمّ?ام|دش/i, ShowerHead], [/radar|رادار/i, Radar],
  [/life|jacket|vest|نجاة/i, LifeBuoy], [/gps|navig|ملاحة/i, Navigation], [/first aid|medical|إسعاف/i, BriefcaseMedical],
  [/snorkel|mask|غطس/i, Glasses], [/shade|canopy|\bsun|مظلة|شمس/i, Sun], [/cooler|\bice\b|تبريد|ثلج/i, Snowflake],
  [/fuel|وقود/i, Fuel], [/speaker|music|bluetooth|سماعة/i, Music], [/fish|tank|catch|صيد|سمك|خزان/i, Fish],
];

// "Our Boat": a light section in the same style as the rest of the site. Specs are small cards, equipment is a checklist.
export function PrivateBoatSection({ boat, fallbackName }: { boat: PrivateBoat; fallbackName: string }) {
  const { lang, t } = useLanguage();
  const label = t('Our Boat', 'قاربنا');
  const title = boat.name[lang] || label;
  const showLabel = title.trim() !== label; // no "Our Boat / Our Boat" when the boat has no name of its own
  return (
    <section className="section section-soft boat-section" aria-labelledby="our-boat-title">
      <div className="container">
        <div className={boat.image ? 'boat-head has-image' : 'boat-head'}>
          <div className="boat-intro">
            {showLabel && <div className="eyebrow">{label}</div>}
            <h2 id="our-boat-title" className="section-title">{title}</h2>
            {boat.tagline[lang] && <p className="boat-tagline">{boat.tagline[lang]}</p>}
            {boat.description[lang] && <p className="boat-text">{boat.description[lang]}</p>}
          </div>
          {boat.image && (
            <figure className="boat-photo">
              <img src={boat.image} alt={`${title} · ${fallbackName}`} loading="lazy" width="900" height="600" />
            </figure>
          )}
        </div>
        {boat.specs.length > 0 && (
          <dl className="boat-specs">
            {boat.specs.map((s, i) => {
              const Ic = pick(`${s.label.en} ${s.label.ar}`, specRules, Ship);
              return (
                <div className="boat-spec" key={i}>
                  <span className="boat-icon"><Ic aria-hidden="true" /></span>
                  <div>
                    <dt>{s.label[lang]}</dt>
                    <dd>{s.value[lang]}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        )}
        {boat.amenities.length > 0 && (
          <div className="boat-onboard">
            <h3>{t('On board', 'على متن القارب')}</h3>
            <ul className="boat-amenities">
              {boat.amenities.map((a, i) => {
                const Ic = pick(`${a.en} ${a.ar}`, amenityRules, Check);
                return <li key={i}><span className="boat-icon boat-icon-sm"><Ic aria-hidden="true" /></span><span>{a[lang]}</span></li>;
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
