import { FaInstagram, FaGithub, FaYoutube } from "react-icons/fa";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer-container">
      <h3 className="footer-title">Team ODD</h3>
      <p className="footer-address">
        서울특별시 성북구 삼선교로16길 116 한성대학교 인성관 508호
      </p>
      <p className="footer-email">teamoddhsu@gmail.com</p>
      <div className="footer-sociallink">
        <a
          className="social-icon"
          href="https://www.instagram.com/teamodd_hansunguniv/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram />
        </a>
        <a
          className="social-icon"
          href="https://github.com/TeamODD"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGithub />
        </a>
        <a
          className="social-icon"
          href="https://www.youtube.com/channel/UCHOpg-Sdej5zUwH9QlMf2fA"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaYoutube />
        </a>
      </div>
      <p className="footer-copyright">© Team ODD All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
