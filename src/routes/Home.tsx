import "../styles/Home.css";

function Home() {
  return (
    <div className="home-container">
      <img className="home-image" src="images/home/home.png" loading="lazy" />
      <span className="home-image-text-title">
        Team ODD
        <br />
        <span className="home-image-text">
          한성대학교 중앙 게임 개발 동아리
        </span>
      </span>
    </div>
  );
}

export default Home;
