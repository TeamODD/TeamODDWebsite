import { useState, useEffect, useRef, useMemo } from "react";
import { ref, get } from "firebase/database";
import { database } from "../firebase";
import { GamesData } from "../types/game";
import GameCard from "../components/GameCard";
import "../styles/Projects.css";
import Loading from "../components/Loading";

/**
 * Projects 컴포넌트는 Firebase Realtime Database에서 게임 데이터를 가져와서
 * 연도별로 필터링하고, 선택된 연도에 따라 게임을 그룹화하여 표시합니다.
 *
 * @component
 * @example
 * <Projects />
 *
 * @returns {JSX.Element} 게임 데이터를 연도별로 필터링하고 그룹화하여 표시하는 컴포넌트
 *
 * @remarks
 * - Firebase Realtime Database에서 게임 데이터를 가져옵니다.
 * - 드롭다운 메뉴를 통해 연도를 선택할 수 있습니다.
 * - 선택된 연도에 따라 게임을 필터링하고, 특정 연도가 선택된 경우 프로젝트 유형별로 게임을 그룹화합니다.
 * - 드롭다운 메뉴 외부 클릭을 처리하여 닫습니다.
 *
 * @typedef {Object} GamesData
 * @property {Array<Object>} games - 게임 데이터 배열
 *
 * @typedef {Object} Game
 * @property {string} id - 게임 ID
 * @property {string} year - 게임 연도
 * @property {string} project - 프로젝트 유형
 *
 * @state {GamesData} gamesData - 게임 데이터를 저장할 상태
 * @state {string} selectedYear - 필터링을 위한 선택된 연도를 저장할 상태
 * @state {boolean} isDropdownOpen - 드롭다운 메뉴의 가시성을 관리할 상태
 * @state {boolean} loading - 로딩 상태를 관리할 상태
 * @state {React.RefObject<HTMLDivElement>} dropdownRef - 드롭다운 메뉴 외부 클릭을 처리하기 위한 ref
 *
 * @hook {useEffect} fetchGames - Firebase Realtime Database에서 게임 데이터를 가져오는 비동기 함수
 * @hook {useMemo} years - 게임 데이터에서 고유한 연도를 추출
 * @hook {useMemo} filteredGames - 선택된 연도에 따라 게임을 필터링
 * @hook {useMemo} groupedGames - 특정 연도가 선택된 경우 프로젝트 유형별로 게임을 그룹화
 * @hook {useEffect} handleClickOutside - 드롭다운 메뉴 외부 클릭을 처리하여 닫음
 */

const Projects: React.FC = () => {
  // 게임 데이터를 저장할 상태
  const [gamesData, setGamesData] = useState<GamesData>({ games: [] });
  // 필터링을 위한 선택된 연도를 저장할 상태
  const [selectedYear, setSelectedYear] = useState<string>("all");
  // 드롭다운 메뉴의 가시성을 관리할 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // 로딩 상태를 관리할 상태
  const [loading, setLoading] = useState(true);
  // 드롭다운 메뉴 외부 클릭을 처리하기 위한 ref
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Firebase Realtime Database에서 게임 데이터를 가져옴
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesRef = ref(database, "games");
        const snapshot = await get(gamesRef);
        if (snapshot.exists()) {
          setGamesData({ games: Object.values(snapshot.val()) });
        }
      } catch (error) {
        console.error("게임 데이터를 가져오는 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // 게임 데이터에서 고유한 연도를 추출
  const years = useMemo(
    () =>
      ["all", ...new Set(gamesData.games.map((game) => game.year))]
        .sort()
        .reverse(),
    [gamesData.games]
  );

  // 선택된 연도에 따라 게임을 필터링하고 정렬
  const filteredGames = useMemo(() => {
    const filtered =
      selectedYear === "all"
        ? [...gamesData.games].sort((a, b) => {
            const timestampA = a.id || 0;
            const timestampB = b.id || 0;
            return timestampB - timestampA; // 최근 추가된 순으로 정렬
          })
        : [...gamesData.games]
            .filter((game) => game.year === selectedYear)
            .sort((a, b) => {
              const priorityA = a.priority || 0;
              const priorityB = b.priority || 0;
              return priorityB - priorityA;
            });

    return filtered;
  }, [selectedYear, gamesData.games]);

  // 특정 연도가 선택된 경우 프로젝트 유형별로 게임을 그룹화
  const groupedGames = useMemo(
    () =>
      selectedYear !== "all"
        ? filteredGames.reduce((acc, game) => {
            if (!acc[game.project]) acc[game.project] = [];
            acc[game.project].push(game);
            return acc;
          }, {} as Record<string, typeof filteredGames>)
        : {},
    [selectedYear, filteredGames]
  );

  // 드롭다운 메뉴 외부 클릭을 처리하여 닫음
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

  if (loading) {
    return <Loading />;
  }

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
};

export default Projects;
