import gamesData from "../assets/data/games.json";
import { GamesData } from "../types/game";
import GameCard from "../components/GameCard";

function Projects() {
  const typedGamesData: GamesData = gamesData;

  return (
    <>
      <main className="games-container">
        {typedGamesData.games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </main>
    </>
  );
}

export default Projects;
