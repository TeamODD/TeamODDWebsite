import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiGithub,
  FiGlobe,
  FiHelpCircle,
  FiMail,
  FiSearch,
  FiShare2,
} from "react-icons/fi";
import "../styles/TopBarPreview.css";
import AccountMenu from "./AccountMenu";
import { setSiteLanguage, useSiteLanguage, tr } from "../i18n/siteLanguage";

const TopBarPreview = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [helpOpen,setHelpOpen] = useState(false);
  const [languageOpen,setLanguageOpen] = useState(false);
  const [notice,setNotice] = useState("");
  const language = useSiteLanguage();
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({title:"Team ODD",url:window.location.href});
      else { await navigator.clipboard.writeText(window.location.href); setNotice("현재 페이지 주소를 복사했습니다."); }
    } catch { /* The user can cancel the share sheet. */ }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/projects?q=${encodeURIComponent(query)}` : "/projects");
  };

  return (
    <div className="odd-top-bar-preview">
      <div className="odd-top-bar-preview__left">
        <details className="odd-top-bar-preview__dropdown">
          <summary>☰ {tr(language,"메뉴","Menu")}</summary>
          <nav aria-label="빠른 메뉴">
            <Link to="/club">{tr(language,"동아리 소개","About")}</Link>
            <Link to="/projects">{tr(language,"프로젝트","Projects")}</Link>
            <Link to="/events">{tr(language,"행사정보","Events")}</Link>
            <Link to="/operations">{tr(language,"운영안내","Guide")}</Link>
            <Link to="/join">{tr(language,"가입안내","Join")}</Link>
            <Link to="/contact">{tr(language,"문의하기","Contact")}</Link>
          </nav>
        </details>
      </div>

      <Link className="odd-top-bar-preview__brand" to="/">
        <img
          className="odd-top-bar-preview__brand-logo"
          src={`${import.meta.env.BASE_URL}images/top-bar/top-bar-logo-teamodd-001.webp`}
          alt=""
        />
        <span>TEAM ODD</span>
      </Link>

      <div className="odd-top-bar-preview__tools">
        <form className="odd-top-bar-preview__search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            aria-label="프로젝트 검색"
            placeholder={tr(language,"검색","Search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" aria-label="검색">
            <FiSearch />
          </button>
        </form>
        <span className="odd-top-bar-preview__separator" aria-hidden="true" />
        <div className="odd-top-bar-preview__actions" aria-label="도구 모음">
          <button type="button" aria-label="도움말" onClick={()=>setHelpOpen(true)}><FiHelpCircle /></button>
          <button type="button" aria-label="공유" onClick={()=>void share()}><FiShare2 /></button>
          <a
            href="https://github.com/TeamODD"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Team ODD GitHub"
            title="GitHub"
          >
            <FiGithub />
          </a>
          <button type="button" aria-label="언어" aria-expanded={languageOpen} onClick={()=>setLanguageOpen(!languageOpen)}><FiGlobe /></button>
          <Link to="/contact" aria-label="문의하기" title="문의하기"><FiMail /></Link>
        </div>
      </div>

      <div className="odd-top-bar-preview__right">
        <AccountMenu />
      </div>
      {languageOpen && <div className="topbar-popover"><strong>{tr(language,"언어","Language")}</strong><button type="button" onClick={()=>{setSiteLanguage("ko");setLanguageOpen(false);}}>한국어 {language==="ko"?"✓":""}</button><button type="button" onClick={()=>{setSiteLanguage("en");setLanguageOpen(false);}}>English {language==="en"?"✓":""}</button></div>}
      {helpOpen && <div className="topbar-help-backdrop" onClick={()=>setHelpOpen(false)}><section className="topbar-help" role="dialog" aria-modal="true" aria-label={tr(language,"도움말","Help")} onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>setHelpOpen(false)} aria-label={tr(language,"닫기","Close")}>×</button><h2>{tr(language,"도움말","Help")}</h2><p>{tr(language,"프로젝트 검색으로 작품을 찾고, 행사정보와 가입안내에서 활동 내용을 확인할 수 있습니다.","Find work through project search, and browse events and joining information to learn about club activities.")}</p><Link to="/contact" onClick={()=>setHelpOpen(false)}>{tr(language,"문의하기 →","Contact →")}</Link></section></div>}
      {notice && <div className="topbar-notice" role="status" onClick={()=>setNotice("")}>{notice}</div>}
    </div>
  );
};

export default TopBarPreview;
