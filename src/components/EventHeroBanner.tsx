import { useState } from "react";
import type { EventBanner } from "../types/eventBanner";
import "../styles/EventHeroBanner.css";

export default function EventHeroBanner({ banner }: { banner: EventBanner }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <section className="event-hero-banner" aria-label={banner.title}>
      <img src={banner.imageSrc} alt={banner.title} onError={() => setFailed(true)} fetchPriority="high" />
    </section>
  );
}
