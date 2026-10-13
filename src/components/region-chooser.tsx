import type { CSSProperties } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowUpRight, Check, Compass, Globe, MessageCircle } from "lucide-react";
import { ExperienceCard } from "@/components/experience-components";
import { useLanguage } from "@/lib/language";
import { images, internationalExperiences, omanExperiences, whatsapp } from "@/lib/content";

type Region = "oman" | "international";

// Two side-by-side choice boxes (Oman / International). The choice lives in the URL
// (?trips=international) so it can be shared and the Back button works. The panel below is
// re-mounted per region, which plays a CSS fade/slide-in (disabled for reduced-motion users).
export function RegionChooser() {
  const { t } = useLanguage();
  const { trips } = useSearch({ from: "/" });
  const region: Region = trips === "international" ? "international" : "oman";
  const navigate = useNavigate();
  const choose = (next: Region) => {
    if (next === region) return;
    void navigate({ to: "/", search: { trips: next }, replace: true, resetScroll: false });
  };

  const boxes: { id: Region; title: string; text: string; bg: string; Icon: typeof Compass }[] = [
    {
      id: "oman",
      title: t("Oman Trips", "رحلات عمان"),
      text: t(
        "Sea trips, Masirah, camping and land adventures",
        "رحلات بحرية ومصيرة وتخييم ومغامرات برية",
      ),
      bg: `url(${images.coast})`,
      Icon: Compass,
    },
    {
      id: "international",
      title: t("International Trips", "رحلات دولية"),
      text: t(
        "Journeys beyond Oman. Tell us where you want to go.",
        "رحلات خارج عُمان. أخبرنا إلى أين تريد أن تذهب.",
      ),
      bg: "linear-gradient(135deg, var(--primary), #0b3b4f)",
      Icon: Globe,
    },
  ];
  const list = region === "oman" ? omanExperiences.slice(0, 6) : internationalExperiences;

  return (
    <section className="section region-section" id="choose-trip">
      <div className="container">
        <div className="region-heading">
          <div className="eyebrow">{t("Choose your journey", "اختر رحلتك")}</div>
          <h2 id="region-title">{t("Where do you want to go?", "إلى أين تريد أن تذهب؟")}</h2>
        </div>
        <div className="region-cards" role="group" aria-labelledby="region-title">
          {boxes.map(({ id, title, text, bg, Icon }) => (
            <button
              key={id}
              type="button"
              className="region-card"
              aria-pressed={region === id}
              onClick={() => choose(id)}
              style={{ "--region-bg": bg } as CSSProperties}
            >
              <span className="region-check" aria-hidden="true">
                <Check size={15} />
              </span>
              <Icon className="region-icon" size={26} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </button>
          ))}
        </div>
        <div
          className="region-panel"
          key={region}
          role="region"
          aria-live="polite"
          aria-label={boxes.find((b) => b.id === region)?.title}
        >
          <div className="region-panel-head">
            <h3>{boxes.find((b) => b.id === region)?.title}</h3>
            {region === "oman" ? (
              <Link className="text-link" to="/experiences">
                {t("View all experiences", "عرض جميع التجارب")}
                <ArrowUpRight />
              </Link>
            ) : (
              <a className="text-link" href={whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle size={16} />
                {t("Tell us your destination", "أخبرنا بوجهتك")}
                <ArrowUpRight />
              </a>
            )}
          </div>
          <div className="experience-grid">
            {list.map((e) => (
              <ExperienceCard key={e.id} experience={e} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
