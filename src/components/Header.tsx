import { useLocation } from "react-router-dom";
import "../styles/Header.css";

const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="header">
      <header className="headerObj">
        <h1 className="logo" onClick={() => (window.location.href = "/")}>
          <img src="logo.svg" alt="" className="logo-image" />
          TEAMODD
        </h1>
        <nav>
          <ul className="nav-links">
            <li style={{ letterSpacing: "0.3px" }}>
              <a className={isActive("/") ? "activeList" : ""} href="/">
                About Us
              </a>
            </li>
            <li>
              <a
                className={isActive("/projects") ? "activeList" : ""}
                href="/projects"
              >
                프로젝트
              </a>
            </li>
            <li>
              <a className={isActive("/join") ? "activeList" : ""} href="/join">
                가입안내
              </a>
            </li>
            <li>
              <a
                className={isActive("/contact") ? "activeList" : ""}
                href="/contact"
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
