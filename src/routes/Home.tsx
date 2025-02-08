import { useEffect } from "react";
import "../styles/Home.css";

const Home = () => {
  useEffect(() => {
    document.oncontextmenu = function () {
      return false;
    };
  }, []);

  return (
    <div className="home-container">
      {/* <img
        className="home-image"
        src={`${import.meta.env.BASE_URL}images/home/home.png`}
        alt="home"
      /> */}
      <video className="home-image" autoPlay={true} loop muted>
        <source src={`${import.meta.env.BASE_URL}images/home/home.webm`} />
        <source src={`${import.meta.env.BASE_URL}images/home/home.mp4`} />
      </video>
      <span className="home-image-text-title">
        Team ODD
        <br />
        <span className="home-image-text">
          한성대학교 중앙 게임 개발 동아리
        </span>
      </span>
    </div>
  );
};

export default Home;
