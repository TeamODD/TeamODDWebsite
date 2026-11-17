import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { database } from "../firebase";
import HomeFeaturedProjects from "../components/HomeFeaturedProjects";
import "../styles/HomePreview.css";
import { useSiteLanguage, tr } from "../i18n/siteLanguage";

type HomeBanner = {
  id: string;
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
};

// 이미지를 추가할 때 imageSrc에 /images/home-preview/banners/파일명.webp를 지정하세요.
const defaultBanners: HomeBanner[] = [
  {
    id: "01",
    title: "Team ODD 경진대회 안내",
    description: "함께 만든 게임으로 실력을 겨루고, 서로의 아이디어를 나누는 자리입니다.",
    imageSrc: "/images/home-preview/banners/home-preview-banner-competition-001.webp",
    imageAlt: "Team ODD Competition 대회 배너",
  },
  {
    id: "02",
    title: "동아리 행사",
    description: "Team ODD 구성원들이 모여 게임과 개발 이야기를 나누는 행사입니다.",
    imageSrc: "/images/home-preview/banners/home-preview-banner-club-event-001.webp",
    imageAlt: "Team ODD Club Event 행사 배너",
  },
  {
    id: "03",
    title: "게임잼",
    description: "짧은 시간 동안 아이디어를 모아 하나의 게임으로 완성해 봅니다.",
    imageSrc: "/images/home-preview/banners/home-preview-banner-game-jam-001.webp",
    imageAlt: "Team ODD Game Jam 배너",
  },
];

type HomeSectionData = { id: string; title: string; moreHref?: string };

const homeSections: HomeSectionData[] = [
  { id: "recent-projects", title: "최근 등록된 프로젝트", moreHref: "/projects" },
];

const HomeSection = ({ section, children }: { section: HomeSectionData; children?: ReactNode }) => (
  <section className="home-preview-section" aria-labelledby={`home-preview-section-${section.id}`}>
    <header className="home-preview-section__header">
      <h2 id={`home-preview-section-${section.id}`}>{section.title}</h2>
      {section.moreHref && <Link className="home-preview-section__more" to={section.moreHref}>더보기</Link>}
    </header>
    <div className="home-preview-section__body">
      {children ?? <p>콘텐츠 준비 중</p>}
    </div>
  </section>
);

const TRANSITION_MS = 650;

const BannerTitle = ({ title }: { title: string }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const heading = titleRef.current;
    if (!heading) return;

    let isMounted = true;
    const fitTitle = () => {
      heading.style.fontSize = "";
      heading.style.whiteSpace = "nowrap";

      let fontSize = Number.parseFloat(window.getComputedStyle(heading).fontSize);
      while (heading.scrollWidth > heading.clientWidth && fontSize > 14) {
        fontSize = Math.max(14, fontSize - 0.5);
        heading.style.fontSize = `${fontSize}px`;
      }

      if (heading.scrollWidth > heading.clientWidth) {
        heading.style.whiteSpace = "normal";
      }
    };

    fitTitle();
    window.addEventListener("resize", fitTitle);
    document.fonts.ready.then(() => {
      if (isMounted) fitTitle();
    });

    return () => {
      isMounted = false;
      window.removeEventListener("resize", fitTitle);
    };
  }, [title]);

  return <h1 ref={titleRef}>{title}</h1>;
};

const BannerPanel = ({
  banner,
  appearance = "current",
}: {
  banner: HomeBanner;
  appearance?: "current" | "preview" | "promoting" | "demoting";
}) => (
  <section
    className={`home-preview-banner home-preview-banner--${appearance}`}
    aria-label="홈 배너"
    aria-hidden={appearance === "preview" || appearance === "demoting"}
  >
    <div className="home-preview-banner__media">
      {banner.imageSrc ? (
        <img
          src={`${import.meta.env.BASE_URL}${banner.imageSrc.replace(/^\//, "")}`}
          alt={banner.imageAlt ?? banner.title}
        />
      ) : (
        <div className="home-preview-banner__placeholder" aria-hidden="true">
          <span>배너 이미지 {banner.id}</span>
        </div>
      )}
    </div>

    <div className="home-preview-banner__content">
      <div className="home-preview-banner__copy" aria-live={appearance === "current" || appearance === "promoting" ? "polite" : "off"}>
        <BannerTitle title={banner.title} />
        {banner.description && <p>{banner.description}</p>}
      </div>

    </div>
  </section>
);

const HomePreview = () => {
  const language = useSiteLanguage();
  const [banners, setBanners] = useState<HomeBanner[]>(defaultBanners);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transition, setTransition] = useState<{ to: number; direction: -1 | 1 } | null>(null);
  const isTransitioning = useRef(false);
  const transitionTimer = useRef<number | undefined>(undefined);
  useEffect(() => onValue(ref(database, "banners"), snapshot => {
    window.clearTimeout(transitionTimer.current);
    const remote = snapshot.val() as Record<string, Omit<HomeBanner, "id">> | null;
    setBanners(remote ? Object.entries(remote).map(([id, banner]) => ({ ...banner, id })) : defaultBanners);
    setActiveIndex(0);
    setTransition(null);
    isTransitioning.current = false;
  }, () => {}), []);
  const safeIndex = Math.min(activeIndex, banners.length - 1);
  const previousIndex = (safeIndex - 1 + banners.length) % banners.length;
  const nextIndex = (safeIndex + 1) % banners.length;
  const previousBanner = banners[previousIndex];
  const nextBanner = banners[nextIndex];

  const goToBanner = useCallback((targetIndex: number, direction: -1 | 1) => {
    if (isTransitioning.current || targetIndex === safeIndex || banners.length < 2) return;

    isTransitioning.current = true;
    setTransition({ to: targetIndex, direction });
    transitionTimer.current = window.setTimeout(() => {
      setActiveIndex(targetIndex);
      setTransition(null);
      isTransitioning.current = false;
    }, TRANSITION_MS);
  }, [safeIndex, banners.length]);

  const showBanner = (direction: -1 | 1) => {
    goToBanner((safeIndex + direction + banners.length) % banners.length, direction);
  };

  useEffect(() => {
    if (banners.length < 2) return;

    const timer = window.setTimeout(() => {
      goToBanner((safeIndex + 1) % banners.length, 1);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [safeIndex, banners.length, goToBanner]);

  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  return (
    <div className="home-preview">
      <div className="home-preview__background" aria-hidden="true">
        <video autoPlay loop muted playsInline preload="metadata" disablePictureInPicture>
          <source src={`${import.meta.env.BASE_URL}images/home/home.webm`} type="video/webm" />
          <source src={`${import.meta.env.BASE_URL}images/home/home.mp4`} type="video/mp4" />
        </video>
      </div>

      <h2 className="home-preview__heading">{tr(language, "특집 및 추천 게임", "Featured & Recommended Games")}</h2>

      <div className={`home-preview-carousel${transition ? " is-transitioning" : ""}`}>
        <button
          type="button"
          className="home-preview-banner__side-preview home-preview-banner__side-preview--previous"
          onClick={() => showBanner(-1)}
          aria-label={`이전 배너: ${previousBanner.title}`}
          disabled={Boolean(transition)}
        >
          <FiChevronLeft aria-hidden="true" />
        </button>

        <div className="home-preview-banner__stage">
          <div className={`home-preview-banner__track${transition ? ` home-preview-banner__track--${transition.direction === 1 ? "next" : "previous"}` : ""}`}>
            {transition?.direction === -1 && (
              <BannerPanel key="before-previous" banner={banners[(transition.to - 1 + banners.length) % banners.length]} appearance="preview" />
            )}
            <BannerPanel key="previous" banner={transition?.direction === -1 ? banners[transition.to] : previousBanner} appearance={transition?.direction === -1 ? "promoting" : "preview"} />
            <BannerPanel key="current" banner={banners[safeIndex]} appearance={transition ? "demoting" : "current"} />
            <BannerPanel key="next" banner={transition?.direction === 1 ? banners[transition.to] : nextBanner} appearance={transition?.direction === 1 ? "promoting" : "preview"} />
            {transition?.direction === 1 && (
              <BannerPanel key="after-next" banner={banners[(transition.to + 1) % banners.length]} appearance="preview" />
            )}
          </div>
        </div>

        <button
          type="button"
          className="home-preview-banner__side-preview home-preview-banner__side-preview--next"
          onClick={() => showBanner(1)}
          aria-label={`다음 배너: ${nextBanner.title}`}
          disabled={Boolean(transition)}
        >
          <FiChevronRight aria-hidden="true" />
        </button>

        <div className="home-preview-banner__pagination" role="group" aria-label="배너 선택">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              className={index === (transition?.to ?? safeIndex) ? "is-active" : undefined}
              onClick={() => goToBanner(index, index === previousIndex ? -1 : 1)}
              aria-label={`${index + 1}번째 배너: ${banner.title}`}
              aria-pressed={index === (transition?.to ?? safeIndex)}
            />
          ))}
        </div>
      </div>

      {homeSections.map((section) => (
        <HomeSection key={section.id} section={{...section,title:tr(language,section.title,"Featured projects")}}>
          {section.id === "recent-projects" ? <HomeFeaturedProjects /> : undefined}
        </HomeSection>
      ))}
    </div>
  );
};

export default HomePreview;
