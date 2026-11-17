import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Header.css";
import AccountMenu from "./AccountMenu";
import { useSiteLanguage } from "../i18n/siteLanguage";

const previewNavItems = [
  { label: "홈", href: "/home-preview" },
  { label: "프로젝트", href: "/projects" },
  { label: "행사정보", href: "/events" },
  { label: "운영안내", href: "/operations" },
  { label: "동아리 소개", href: "/club" },
  { label: "가입안내", href: "/join" },
];

const defaultNavItems = [
  { label: "About Us", href: "/" },
  { label: "프로젝트", href: "/projects" },
  { label: "가입안내", href: "/join" },
  { label: "문의하기", href: "/contact" },
];

const Header = ({ isPreview = false }: { isPreview?: boolean }) => {
  const location = useLocation();
  const language = useSiteLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const toggleMenu = () => setIsOpen(!isOpen);

  const handleMenuClick = () => {
    setIsOpen(false);
  };

  useEffect(() => setIsOpen(false), [location.pathname]);

  // 햄버거 메뉴가 열려있을 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <div className="header">
      <header className="headerObj">
        <h1 className="logo" onClick={() => (window.location.href = "/")}>
          <img
            src={`${import.meta.env.BASE_URL}${isPreview ? "images/main-nav/main-nav-logo-teamodd-001.webp" : "logo.png"}`}
            alt=""
            className="logo-image"
          />
          <span>{isPreview ? "TEAM ODD" : "TEAMODD"}</span>
        </h1>
        <button
          type="button"
          className={`hamburger ${isOpen ? "active" : ""}`}
          onClick={toggleMenu}
          aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isOpen}
          aria-controls="site-navigation"
        >
          <span className={isOpen ? "open" : ""}></span>
          <span className={isOpen ? "open" : ""}></span>
          <span className={isOpen ? "open" : ""}></span>
        </button>
        <nav id="site-navigation" className={`nav-menu ${isOpen ? "active" : ""}`}>
          <ul className="nav-links">
            {(isPreview ? previewNavItems : defaultNavItems).map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <a
                    className={isActive(item.href) ? "activeList" : ""}
                    href={item.href}
                    onClick={handleMenuClick}
                  >
                    {language === "en" ? ({"홈":"Home","프로젝트":"Projects","행사정보":"Events","운영안내":"Guide","동아리 소개":"About","가입안내":"Join"} as Record<string,string>)[item.label] || item.label : item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className={isPreview ? "preview-header-account" : "header-account"}>
          <AccountMenu />
        </div>
      </header>
    </div>
  );
};

export default Header;
