import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowUpRight, Compass, Globe, MessageCircle } from "lucide-react";
import { GroupTripsSection, PrivateTripsSection } from "@/components/trips-components";
import { useLanguage } from "@/lib/language";
import { tripRegion, whatsapp } from "@/lib/content";
import { useCatalog } from "@/lib/catalog-context";

type Region = "oman" | "international";

// The International tab lists the group trips whose region is "international" (set in the admin
// dashboard). While there are none it shows a short "coming soon + WhatsApp" message. The old
// placeholder experience cards (intl-sample-*) are intentionally not shown.

// The Oman / International choice lives in the URL (?trips=international) so it can be shared and
// the Back button works. RegionPicker = the small buttons shown inside the hero (first screen);
// RegionChooser = the trips panel below the hero, re-mounted per region to play a CSS fade-in.
function useRegion() {
  const { t } = useLanguage();
  const { trips } = useSearch({ from: "/" });
  const region: Region = trips === "international" ? "international" : "oman";
  const navigate = useNavigate();
  const choose = (next: Region) => {
    if (next !== region) void navigate({ to: "/", search: { trips: next }, replace: true, resetScroll: false });
  };
  const boxes: { id: Region; title: string; text: string; Icon: typeof Compass }[] = [
    {
      id: "oman",
      title: t("Oman Trips", "رحلات عمان"),
      text: t("Sea, Masirah, camping and land", "بحر ومصيرة وتخييم ومغامرات برية"),
      Icon: Compass,
    },
    {
      id: "international",
      title: t("International Trips", "رحلات دولية"),
      text: t("Journeys beyond Oman", "رحلات خارج عُمان"),
      Icon: Globe,
    },
  ];
  return { t, region, choose, boxes };
}

export function RegionPicker() {
  const { t, region, choose, boxes } = useRegion();
  return (
    <div className="region-mini" role="group" aria-label={t("Where do you want to go?", "إلى أين تريد أن تذهب؟")}>
      {boxes.map(({ id, title, Icon }) => (
        <button
          key={id}
          type="button"
          className="region-mini-btn"
          aria-pressed={region === id}
          onClick={() => choose(id)}
        >
          <Icon size={16} aria-hidden="true" />
          <span className="region-mini-text">{title}</span>
        </button>
      ))}
    </div>
  );
}

export function RegionChooser() {
  const { t, region, boxes } = useRegion();
  const { groupTrips, privateDestinations } = useCatalog();
  const omanGroupTrips = groupTrips.filter((g) => tripRegion(g) === "oman");
  const internationalGroupTrips = groupTrips.filter((g) => tripRegion(g) === "international");

  return (
    <section className="section region-section" id="choose-trip">
      <div className="container">
        <div
          className="region-panel"
          key={region}
          role="region"
          aria-live="polite"
          aria-label={boxes.find((b) => b.id === region)?.title}
        >
          <div className="region-panel-head">
            <h2>{boxes.find((b) => b.id === region)?.title}</h2>
            {region === "oman" ? (
              <Link className="text-link" to="/destinations">
                {t("View all trips", "عرض كل الرحلات")}
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
          {region === "oman" ? (
            <>
              <GroupTripsSection trips={omanGroupTrips} />
              <PrivateTripsSection destinations={privateDestinations} />
            </>
          ) : internationalGroupTrips.length === 0 ? (
            <p className="region-soon">
              {t(
                "International trips are coming soon. Tell us where you would like to go and we will arrange it.",
                "الرحلات الدولية قريبًا. أخبرنا إلى أين تريد أن تذهب وسنرتب لك الرحلة.",
              )}
            </p>
          ) : (
            <GroupTripsSection trips={internationalGroupTrips} />
          )}
        </div>
      </div>
    </section>
  );
}
