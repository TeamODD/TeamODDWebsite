import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Header.css";

const Header = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const toggleMenu = () => setIsOpen(!isOpen);

  const handleMenuClick = () => {
    setIsOpen(false);
  };

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
          <img src="logo.svg" alt="" className="logo-image" />
          TEAMODD
        </h1>
        <div
          className={`hamburger ${isOpen ? "active" : ""}`}
          onClick={toggleMenu}
        >
          <span className={isOpen ? "open" : ""}></span>
          <span className={isOpen ? "open" : ""}></span>
          <span className={isOpen ? "open" : ""}></span>
        </div>
        <nav className={`nav-menu ${isOpen ? "active" : ""}`}>
          <ul className="nav-links">
            <li style={{ letterSpacing: "0.3px" }}>
              <a
                className={isActive("/") ? "activeList" : ""}
                href="/"
                onClick={handleMenuClick}
              >
                About Us
              </a>
            </li>
            <li>
              <a
                className={isActive("/projects") ? "activeList" : ""}
                href="/projects"
                onClick={handleMenuClick}
              >
                프로젝트
              </a>
            </li>
            <li>
              <a
                className={isActive("/join") ? "activeList" : ""}
                href="/join"
                onClick={handleMenuClick}
              >
                가입안내
              </a>
            </li>
            <li>
              <a
                className={isActive("/contact") ? "activeList" : ""}
                href="/contact"
                onClick={handleMenuClick}
              >
                문의하기
              </a>
            </li>
          </ul>
        </nav>
      </header>
    </div>
  );
};

export default Header;
