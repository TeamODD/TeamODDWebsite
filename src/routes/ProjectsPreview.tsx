import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { get, onValue, ref } from "firebase/database";
import { FiArrowRight, FiEdit2, FiGrid, FiHome, FiPlus, FiRefreshCw, FiSearch } from "react-icons/fi";
import { useMemberRole } from "../auth/useMemberRole";
import { database } from "../firebase";
import type { Game } from "../types/game";
import ProjectReviews from "../components/ProjectReviews";
import ProjectDownload from "../components/ProjectDownload";
import ProjectUpdateModal from "../components/ProjectUpdateModal";
import { sortProjectUpdates } from "../utils/projectUpdates";
import ProjectSideDetails from "../components/ProjectSideDetails";
import ProjectIntroduction from "../components/ProjectIntroduction";
import ProjectMediaGallery from "../components/ProjectMediaGallery";
import { previewDescription } from "../utils/projectContent";
import { projectAssetUrl } from "../utils/projectAssetUrl";
import "../styles/ProjectsPreview.css";
import "../styles/ProjectsPreviewTheme.css";
import "../styles/ProjectsPreviewLower.css";

const imagePath = projectAssetUrl;
const byRecent = (a: Game, b: Game) => Number(b.year) - Number(a.year) || (b.priority || 0) - (a.priority || 0) || b.id - a.id;

export default function ProjectsPreview() {
  const { user, role } = useMemberRole();
  const [params] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [myProjectKeys, setMyProjectKeys] = useState<Set<string>>(() => new Set());
  const [myProjectsLoading, setMyProjectsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openUpdate, setOpenUpdate] = useState<{gameId: number; index: number} | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState(params.get("q") || "");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(params.get("project")) || null);
  const [showHome, setShowHome] = useState(!params.get("project"));
  const detailPaneRef = useRef<HTMLElement>(null);

  useEffect(() => onValue(ref(database, "games"), snapshot => {
    setGames(snapshot.exists() ? Object.entries(snapshot.val() as Record<string, Game>).map(([key, game]) => ({ ...game, key })).sort(byRecent) : []);
    setLoading(false);
    setError(false);
  }, () => { setLoading(false); setError(true); }), []);

  useEffect(() => {
    setMyProjectKeys(new Set());
    if (!user || role === "guest" || games.length === 0) return;
    let active = true;
    setMyProjectsLoading(true);
    Promise.all(games.map(async game => {
      try { return (await get(ref(database, `gameMembers/${game.key}/${user.uid}`))).val() === true ? game.key : undefined; }
      catch { return undefined; }
    })).then(keys => { if (active) { setMyProjectKeys(new Set(keys.filter((key): key is string => Boolean(key)))); setMyProjectsLoading(false); } });
    return () => { active = false; };
  }, [games, user, role]);

  const years = useMemo(() => [...new Set(games.map(game => game.year).filter(Boolean))].sort((a, b) => b.localeCompare(a)), [games]);
  const projectTypes = useMemo(() => [...new Set(games.map(game => game.project || "기타 프로젝트"))].sort((a, b) => a.localeCompare(b, "ko")), [games]);
  const filtered = useMemo(() => games.filter(game => {
    const term = query.trim().toLocaleLowerCase();
    return (projectFilter === "all" || (game.project || "기타 프로젝트") === projectFilter) && (!term || [game.title, game.description, game.developer, game.project, game.year].some(value => value?.toLocaleLowerCase().includes(term)));
  }), [games, query, projectFilter]);
  const featured = filtered.find(game => game.id === selectedId) || filtered[0];
  const sortedUpdates = useMemo(() => sortProjectUpdates(featured?.updates || []), [featured?.updates]);
  const categories = useMemo(() => [...new Set(filtered.map(game => game.project || "기타 프로젝트"))], [filtered]);
  const myProjects = filtered.filter(game => game.key && myProjectKeys.has(game.key));
  const selectProject = (game: Game) => { setSelectedId(game.id); setShowHome(false); detailPaneRef.current?.scrollTo(0, 0); };
  const projectListItem = (game: Game) => <button key={game.id} type="button" className={!showHome && featured?.id === game.id ? "is-active" : ""} onClick={() => selectProject(game)}><img src={imagePath(game.iconUrl || game.imageUrl)} alt="" loading="lazy" /><span>{game.title}</span></button>;

  return <div className="project-library">
    <aside className="project-library__sidebar" aria-label="프로젝트 목록">
    <div className="project-library__toolbar">
      <select className="project-library__filter" aria-label="프로젝트 유형 필터" value={projectFilter} onChange={event => { setProjectFilter(event.target.value); setSelectedId(null); }}><option value="all">모든 유형</option>{projectTypes.map(type => <option key={type} value={type}>{type}</option>)}</select>
      <button className="project-library__home" type="button" aria-label="프로젝트 홈" title="프로젝트 홈" onClick={() => { setQuery(""); setProjectFilter("all"); setSelectedId(null); setShowHome(true); detailPaneRef.current?.scrollTo(0, 0); }}><FiHome aria-hidden="true" /></button>
      <label className="project-library__search"><FiSearch aria-hidden="true" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="프로젝트 검색" aria-label="프로젝트 검색" /></label>
      <span className="project-library__grid-icon" aria-label="격자 보기" title="격자 보기"><FiGrid aria-hidden="true" /></span>
    </div>
      <div className="project-library__side-list">{(role === "admin" || role === "member") && <Link className="project-library__add-project" to={role === "admin" ? "/admin?tab=games&new=1" : "/projects/apply"}><FiPlus aria-hidden="true" />{role === "admin" ? "새 프로젝트 추가하기" : "새 프로젝트 신청하기"}</Link>}{user && role !== "guest" && !myProjectsLoading && myProjects.length > 0 && <section className="project-library__year-group project-library__year-group--mine"><h2>참여한 프로젝트 <span>{myProjects.length}</span></h2>{myProjects.map(projectListItem)}</section>}{years.map(item => {
        const yearGames = filtered.filter(game => game.year === item);
        return yearGames.length > 0 && <section className="project-library__year-group" key={item}><h2>{item}년 <span>{yearGames.length}</span></h2>{yearGames.map(projectListItem)}</section>;
      })}</div>
    </aside>

    <main ref={detailPaneRef} className={`project-library__main${showHome ? " project-library__main--home" : ""}`}>
      {loading ? <p className="project-library__state">프로젝트를 불러오는 중입니다.</p> : error ? <p className="project-library__state">프로젝트를 불러오지 못했습니다.</p> : !featured ? <p className="project-library__state">표시할 프로젝트가 없습니다.</p> : <>
        {showHome ? <>
          <section className="project-library__section"><div className="project-library__section-heading"><div><span>RECENT PROJECTS</span><h2>최근 프로젝트</h2></div><span>{Math.min(filtered.length, 6)}개</span></div><div className="project-library__recent">{filtered.slice(0, 6).map(game => <button type="button" key={game.id} onClick={() => selectProject(game)}><img src={imagePath(game.imageUrl)} alt="" loading="lazy" /><span>{game.title}<small>{game.year} · {game.project}</small></span></button>)}</div></section>
          <section className="project-library__section"><div className="project-library__section-heading"><div><span>EXPLORE</span><h2>모든 프로젝트</h2></div><span>{filtered.length}개</span></div>{categories.map(category => <div className="project-library__category" key={category}><h3>{category}</h3><div className="project-library__cards project-library__cards--grid">{filtered.filter(game => (game.project || "기타 프로젝트") === category).map(game => <button type="button" key={game.id} onClick={() => selectProject(game)} className="project-library__card"><img src={imagePath(game.imageUrl)} alt="" loading="lazy" /><span><strong>{game.title}</strong><small>{game.year} · {game.developer}</small></span><FiArrowRight aria-hidden="true" /></button>)}</div></div>)}</section>
        </> : <article className="project-library__detail" aria-label={`${featured.title} 프로젝트 정보`}>
          <div className="project-library__detail-kicker">{featured.year} <span>·</span> {featured.project || "프로젝트"}</div>
          {(role === "admin" || (featured.key && myProjectKeys.has(featured.key))) && <Link className="project-library__edit-project" to={`/project/${featured.id}/edit`}><FiEdit2 aria-hidden="true" />정보 수정하기</Link>}
          <h1>{featured.title}</h1>
          <div className="project-library__detail-layout">
            <ProjectMediaGallery key={featured.id} game={featured} />
            <div className="project-library__detail-info"><img className="project-library__detail-cover" src={imagePath(featured.coverUrl || featured.imageUrl)} alt="" /><p className="project-library__detail-description">{previewDescription(featured.midDescription || featured.description)}</p><dl><div><dt>제작</dt><dd>{featured.developer || "정보 없음"}</dd></div><div><dt>제작 연도</dt><dd>{featured.year}</dd></div><div><dt>프로젝트 유형</dt><dd>{featured.project || "정보 없음"}</dd></div>{(featured.engine || featured.platform) && <div><dt>엔진 · 플랫폼</dt><dd>{[featured.engine, featured.platform].filter(Boolean).join(" · ")}</dd></div>}{featured.controls && <div><dt>조작 방식</dt><dd>{featured.controls}</dd></div>}</dl>{!!featured.genreTags?.length && <div className="project-library__detail-tags"><span className="project-library__detail-tags-label">장르 태그</span><div>{featured.genreTags.map(tag=><span key={tag}>{tag}</span>)}</div></div>}</div>
          </div>
          <div className="project-library__detail-lower">
            <div className="project-library__detail-lower-main">
              <ProjectDownload game={featured} />
              {!!sortedUpdates.length && <section className="project-library__updates"><h2><FiRefreshCw aria-hidden="true" />최근 업데이트 및 공지</h2><div className="project-library__update-grid">{sortedUpdates.slice(0, 2).map((update,index) => <button type="button" key={index} onClick={() => setOpenUpdate({gameId: featured.id, index})}><div className="project-library__update-image"><img src={imagePath(update.imageUrl || featured.imageUrl)} alt="" loading="lazy" /></div><strong>{update.title}</strong>{update.summary && <span className="project-library__update-summary">{update.summary}</span>}{update.date && <time dateTime={update.date}>{update.date}</time>}</button>)}</div></section>}
              <ProjectIntroduction key={featured.id} text={featured.detail ? featured.detail.replace(/\/n/g, "\n") : featured.description.replace(/\/n/g, "\n")} />
            </div>
            <ProjectSideDetails game={featured} />
          </div>
          {featured.key && <ProjectReviews key={`${featured.key}-form`} gameKey={featured.key} game={featured} preview />}
          {featured.key && <ProjectReviews key={`${featured.key}-list`} gameKey={featured.key} game={featured} preview previewSection="list" />}
        </article>}
      </>}
    </main>
    {openUpdate && featured?.id === openUpdate.gameId && <ProjectUpdateModal updates={sortedUpdates} initialIndex={openUpdate.index} game={featured} onClose={() => setOpenUpdate(null)} />}
  </div>;
}

