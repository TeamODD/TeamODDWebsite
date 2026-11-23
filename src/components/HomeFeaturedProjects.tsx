import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { database } from "../firebase";
import { homeProjectPages, type HomeProjectPage } from "../data/homeProjectPages";
import type { Game } from "../types/game";
import { projectAssetUrl } from "../utils/projectAssetUrl";
import "../styles/HomeFeaturedProjects.css";

const HomeFeaturedProjects = () => {
  const [projects, setProjects] = useState<Game[]>([]);
  const [pageConfig,setPageConfig] = useState<HomeProjectPage[]>(homeProjectPages);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => onValue(ref(database,"homeProjectPages"),snapshot => {
    const remote = snapshot.val() as Record<string,HomeProjectPage> | null;
    setPageConfig(remote ? Object.entries(remote).map(([id,page])=>({...page,id})) : homeProjectPages);
  },()=>{}),[]);
  useEffect(() => onValue(ref(database,"games"),snapshot => {
    setProjects(snapshot.exists()?Object.values(snapshot.val() as Record<string,Game>):[]);
    setLoading(false);
  },()=>{setLoadFailed(true);setLoading(false);}),[]);

  const pages = useMemo(() => {
    const byId = new Map(projects.map((game) => [Number(game.id), game]));
    return pageConfig.map((page) => ({
      ...page,
      projects: page.projects.flatMap((tile) => {
        const game = byId.get(tile.projectId);
        return game ? [{ ...tile, game }] : [];
      }),
    })).filter((page) => page.projects.length > 0);
  }, [projects,pageConfig]);

  useEffect(() => {
    setActivePage(0);
  }, [projects]);

  useEffect(() => {
    if (pages.length < 2) return;

    const timer = window.setTimeout(() => {
      setActivePage((current) => (current + 1) % pages.length);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [activePage, pages.length]);

  if (loading) return <p className="home-featured-projects__status">프로젝트를 불러오는 중입니다.</p>;
  if (loadFailed) return <p className="home-featured-projects__status">프로젝트를 불러오지 못했습니다.</p>;
  if (pages.length === 0) return <p className="home-featured-projects__status">표시할 프로젝트가 없습니다.</p>;

  return (
    <div className="home-featured-projects">
      <div className="home-featured-projects__slider">
        {pages.length > 1 && (
          <button type="button" className="home-featured-projects__arrow home-featured-projects__arrow--previous" onClick={() => setActivePage((activePage - 1 + pages.length) % pages.length)} aria-label="이전 프로젝트">
            <FiChevronLeft aria-hidden="true" />
          </button>
        )}

        <div className="home-featured-projects__viewport">
          <div
            className="home-featured-projects__track"
            style={{ transform: `translateX(-${activePage * 100}%)` }}
          >
            {pages.map((page, pageIndex) => (
              <div
                key={page.id}
                className="home-featured-projects__page"
                style={{
                  "--project-columns": page.columns,
                  "--project-rows": page.rows,
                } as CSSProperties}
                aria-hidden={pageIndex !== activePage}
              >
                {page.projects.map(({ game, ...tile }) => (
                  <Link
                    key={game.id}
                    className={`home-featured-projects__card${(tile.rowSpan ?? 1) > 1 || (tile.columnSpan ?? 1) > 1 ? " home-featured-projects__card--large" : ""}`}
                    to={`/project/${game.id}`}
                    style={{
                      "--tile-column": tile.column,
                      "--tile-row": tile.row,
                      "--tile-column-span": tile.columnSpan ?? 1,
                      "--tile-row-span": tile.rowSpan ?? 1,
                    } as CSSProperties}
                    tabIndex={pageIndex === activePage ? 0 : -1}
                  >
                    {tile.tag && (
                      <span className={`home-featured-projects__tag home-featured-projects__tag--${tile.tag.color}`}>
                        {tile.tag.label}
                      </span>
                    )}
                    <img
                      src={projectAssetUrl(game.imageUrl)}
                      alt=""
                      loading="lazy"
                    />
                    <span className="home-featured-projects__card-info">
                      <strong>{game.title}</strong>
                      <small>{game.description.replace(/\/n|\s+/g, " ").trim()}</small>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {pages.length > 1 && (
          <button type="button" className="home-featured-projects__arrow home-featured-projects__arrow--next" onClick={() => setActivePage((activePage + 1) % pages.length)} aria-label="다음 프로젝트">
            <FiChevronRight aria-hidden="true" />
          </button>
        )}
      </div>

      {pages.length > 1 && (
        <div className="home-featured-projects__pagination" role="group" aria-label="프로젝트 페이지 선택">
          {pages.map((page, pageIndex) => (
            <button
              key={page.id}
              type="button"
              className={pageIndex === activePage ? "is-active" : undefined}
              onClick={() => setActivePage(pageIndex)}
              aria-label={`${pageIndex + 1}번째 프로젝트 페이지`}
              aria-pressed={pageIndex === activePage}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeFeaturedProjects;
