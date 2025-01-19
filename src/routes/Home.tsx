import "../styles/Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <img
        className="home-image"
        src="images/home/home.webp"
        loading="lazy"
        alt="home"
      />
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
