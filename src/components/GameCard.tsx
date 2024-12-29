import { Game } from "../types/game";
import BlurImage from "./BlurImage";

interface GameCardProps {
  game: Game;
}

const GameCard = ({ game }: GameCardProps) => {
  return (
    <div className="game-card" onClick={() => window.open(game.link, "_blank")}>
      <BlurImage src={game.imageUrl} alt={game.title} className="game-image" />
      <div className="game-info">
        <h2 data-full-title={game.title}>{game.title}</h2>
        <p>{game.description}</p>
        <div className="game-details">
          <span>개발: {game.developer}</span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
