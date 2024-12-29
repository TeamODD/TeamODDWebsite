import { useState, useEffect, useRef } from "react";
import gamesData from "../assets/data/games.json";
import { GamesData } from "../types/game";
import GameCard from "../components/GameCard";
import "../styles/Projects.css";

function Projects() {
  const typedGamesData: GamesData = gamesData;
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const years = [
    "all",
    ...new Set(typedGamesData.games.map((game) => game.year)),
  ]
    .sort()
    .reverse();

  const filteredGames =
    selectedYear === "all"
      ? typedGamesData.games
      : typedGamesData.games.filter((game) => game.year === selectedYear);

  // 게임을 프로젝트 유형별로만 그룹화
  const groupedGames =
    selectedYear !== "all"
      ? filteredGames.reduce((acc, game) => {
          if (!acc[game.project]) acc[game.project] = [];
          acc[game.project].push(game);
          return acc;
        }, {} as Record<string, typeof filteredGames>)
      : {};

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="projects-page">
      <div className="year-filter">
        <div
          ref={dropdownRef}
          className={`year-dropdown ${isDropdownOpen ? "active" : ""}`}
        >
          <button
            className="year-dropdown-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedYear === "all" ? "모든 연도" : selectedYear}
            <span className="year-dropdown-arrow" />
          </button>
          <div className="year-dropdown-menu">
            <ul>
              {years.map((year) => (
                <li
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setIsDropdownOpen(false);
                  }}
                >
                  {year === "all" ? "모든 연도" : year}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <main className="games-container">
        {selectedYear === "all" ? (
          <div className="games-grid">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          Object.entries(groupedGames).map(([projectType, games]) => (
            <div key={projectType} className="project-type-section">
              <h2 className="project-type-title">{projectType}</h2>
              <div className="games-grid">
                {games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default Projects;
