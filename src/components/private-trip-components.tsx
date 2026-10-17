import type { ComponentType } from 'react';
import {
  Anchor, BriefcaseMedical, Check, Clock, Fish, Fuel, Gauge, LifeBuoy, Music, Navigation, Radar, Ruler,
  ShowerHead, Ship, Snowflake, Sun, Users, Glasses, Waves,
} from 'lucide-react';
import { useLanguage } from '@/lib/language';
import type { PrivateBoat } from '@/lib/content';

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
// The admin writes free text, so icons are picked from keywords (English or Arabic). Unknown text gets a check mark.
const pick = (text: string, rules: [RegExp, Icon][], fallback: Icon): Icon => rules.find(([re]) => re.test(text))?.[1] ?? fallback;
const specRules: [RegExp, Icon][] = [
  [/length|طول/i, Ruler], [/engine|motor|hp|محرك/i, Gauge], [/capacity|guest|people|seat|سعة|أشخاص|ضيوف/i, Users],
  [/marina|port|depart|مرسى|ميناء|انطلاق/i, Anchor], [/trip|type|duration|time|نوع|مدة|رحلة/i, Clock],
];
const amenityRules: [RegExp, Icon][] = [
  [/shower|bath|toilet|حمام|دش/i, ShowerHead], [/fish tank|tank|fishing|catch|gear|صيد|سمك|خزان/i, Fish], [/radar|رادار/i, Radar],
  [/life|jacket|vest|نجاة/i, LifeBuoy], [/gps|navig|ملاحة/i, Navigation], [/first aid|medical|إسعاف/i, BriefcaseMedical],
  [/shade|canopy|sun|مظلة|شمس/i, Sun], [/cooler|ice|تبريد|ثلج/i, Snowflake], [/fuel|وقود/i, Fuel],
  [/speaker|music|bluetooth|سماعة/i, Music], [/snorkel|mask|غطس/i, Glasses], [/motor|trolling|محرك/i, Waves],
];

// "Our Boat": a deep-sea band on the private trip page. Specs sit in one strip, equipment as a checklist.
export function PrivateBoatSection({ boat, fallbackName }: { boat: PrivateBoat; fallbackName: string }) {
  const { lang, t } = useLanguage();
  const title = boat.name[lang] || t('Our Boat', 'قاربنا');
  return (
    <section className="boat-band" aria-labelledby="our-boat-title">
      <div className="container">
        <div className={boat.image ? 'boat-top has-image' : 'boat-top'}>
          <div className="boat-intro">
            <div className="boat-eyebrow"><Ship aria-hidden="true" />{t('Our Boat', 'قاربنا')}</div>
            <h2 id="our-boat-title">{title}</h2>
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
                  <Ic aria-hidden="true" />
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
                return <li key={i}><Ic aria-hidden="true" /><span>{a[lang]}</span></li>;
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
