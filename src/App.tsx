import "./App.css";
import GameCard from "./components/GameCard";
import gamesData from "./assets/data/games.json";
import { GamesData } from "./types/game";

function App() {
  const typedGamesData = gamesData as GamesData;

  return (
    <div className="App">
      <header>
        <h1>
          <strong>TeamODD</strong>
        </h1>
        한성대학교 게임 개발 동아리
      </header>
      <main className="games-container">
        {typedGamesData.games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </main>
    </div>
  );
}

export default App;
