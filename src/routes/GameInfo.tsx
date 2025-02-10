import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../firebase";
import { Game } from "../types/game";
import Loading from "../components/Loading";
import "../styles/GameInfo.css";
import GradientButton from "../components/GradientButton";

const GameInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameDetail = async () => {
      try {
        const gamesRef = ref(database, "games");
        const snapshot = await get(gamesRef);
        if (snapshot.exists()) {
          const gamesData = snapshot.val();
          // ID 타입을 일치시켜 비교
          const foundGame = Object.values(gamesData).find(
            (game: any) => game.id.toString() === id
          );
          if (foundGame) {
            setGame(foundGame as Game);
          } else {
            setGame(null);
          }
        }
      } catch (error) {
        console.error("게임 상세 정보를 가져오는 중 오류 발생:", error);
        setGame(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGameDetail();
    }
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!game) {
    return <div className="game-info-detail">게임을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="game-info-detail">
      <div className="game-info-detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <div className="back-button-arrow-box">
            <span className="back-button-arrow" />
          </div>
        </button>
        <h3 className="game-info-project">{game.project}</h3>
        <h1 className="game-info-title">{game.title}</h1>
        <div className="game-info-meta">
          <div className="meta-item">
            <span className="meta-label">팀원</span>
            <span className="meta-value">{game.developer}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">엔진</span>
            <span className="meta-value">{game.engine || "-"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">플랫폼</span>
            <span className="meta-value">{game.platform || "-"}</span>
          </div>
        </div>
        <div className="download-link-button">
          <GradientButton
            innerText="다운로드↗"
            onClick={() => window.open(game.link, "_blank")}
          />
        </div>
      </div>

      <div className="game-info-image">
        {/* <BlurImage
          src={`${import.meta.env.BASE_URL}${game.imageUrl}`}
          alt={game.title}
        /> */}
        <img
          src={`${import.meta.env.BASE_URL}${game.imageUrl}`}
          alt={game.title}
        />
      </div>

      <div className="game-info-description">
        {/* {game.detail.split("/n").map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))} */}
        {game.detail.split("/n").map((paragraph, idx) => (
          <span key={idx}>
            {paragraph
              .split(/\*(.*?)\*/)
              .map((text, index) =>
                index % 2 === 0 ? text : <strong key={index}>{text}</strong>
              )}
            <br />
          </span>
        ))}
      </div>

      <Link to="/projects" className="back-to-list">
        목록으로
      </Link>
    </div>
  );
};

export default GameInfo;
