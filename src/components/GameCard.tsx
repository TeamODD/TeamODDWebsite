import { Game } from "../types/game";
import BlurImage from "./BlurImage";
import "../styles/GameCard.css";
import { useNavigate } from "react-router-dom";

interface GameCardProps {
  game: Game;
}

/**
 * GameCard 컴포넌트는 게임 정보를 표시하는 카드 UI를 렌더링합니다.
 *
 * @param {GameCardProps} props - GameCard 컴포넌트의 props
 * @param {Object} props.game - 게임 정보 객체
 * @param {string} props.game.link - 게임 링크 URL
 * @param {string} props.game.imageUrl - 게임 이미지 URL
 * @param {string} props.game.title - 게임 제목
 * @param {string} props.game.placeholder - 이미지 로딩 전 표시할 placeholder
 * @param {string} props.game.description - 게임 설명 (줄바꿈은 "//n"으로 구분)
 * @param {string} props.game.developer - 게임 개발자
 *
 * @returns {JSX.Element} 게임 정보를 표시하는 카드 UI
 */
const GameCard = ({ game }: GameCardProps) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/project/${game.id}`);
  };

  return (
    <div className="game-card" onClick={handleClick}>
      <BlurImage
        src={`${import.meta.env.BASE_URL}${game.imageUrl}`}
        alt={game.title}
        className="game-image"
        placeholder={game.placeholder}
      />
      <div className="game-info">
        <h2
          data-full-title={game.title}
          style={{
            fontSize: game.title.length > 20 ? "1.3rem" : "1.5rem",
          }}
        >
          {game.title}
        </h2>
        <p className="game-description" style={{
          fontSize: game.description.length > 25 ? "0.9rem" : "1rem",
        }}>
          {game.description.split("/n").map((it, idx) => (
            <span key={idx}>
              {it}
              <br />
            </span>
          ))}
        </p>
        <div className="game-details">
          <span>{game.developer}</span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
