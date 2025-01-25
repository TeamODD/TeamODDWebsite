import { useState, useEffect, useCallback } from "react";
import { ref, push, remove, get, child } from "firebase/database";
import { database } from "../firebase";
import { Game } from "../types/game";
import "../styles/Admin.css";

/**
 * 관리자 페이지 컴포넌트입니다. 게임 목록을 불러오고, 새로운 게임을 추가하거나 기존 게임을 삭제할 수 있습니다.
 *
 * @component
 * @example
 * return (
 *   <Admin />
 * )
 *
 * @returns {JSX.Element} 관리자 페이지 컴포넌트
 *
 * @remarks
 * - `useState`를 사용하여 게임 목록과 새로운 게임 데이터를 관리합니다.
 * - `useEffect`를 사용하여 컴포넌트가 마운트될 때 게임 목록을 불러옵니다.
 * - `fetchGames` 함수는 데이터베이스에서 게임 목록을 불러와 상태를 업데이트합니다.
 * - `handleSubmit` 함수는 새로운 게임을 데이터베이스에 추가하고 상태를 초기화합니다.
 * - `handleDelete` 함수는 선택한 게임을 데이터베이스에서 삭제하고 상태를 업데이트합니다.
 *
 * @function fetchGames
 * @async
 * @description 데이터베이스에서 게임 목록을 불러와 상태를 업데이트합니다.
 *
 * @function handleSubmit
 * @async
 * @param {React.FormEvent} e - 폼 제출 이벤트
 * @description 새로운 게임을 데이터베이스에 추가하고 상태를 초기화합니다.
 *
 * @function handleDelete
 * @async
 * @param {number} gameId - 삭제할 게임의 ID
 * @description 선택한 게임을 데이터베이스에서 삭제하고 상태를 업데이트합니다.
 */
const Admin = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [newGame, setNewGame] = useState<Partial<Game>>({
    id: 0,
    title: "",
    description: "",
    year: new Date().getFullYear().toString(),
    project: "",
    imageUrl: "images/games/",
    link: "",
    developer: "",
    placeholder: "",
  });

  // 데이터베이스 참조를 상수로 분리
  const gamesRef = ref(database, "games");

  // useCallback을 사용하여 함수 재생성 방지
  const fetchGames = useCallback(async () => {
    try {
      const snapshot = await get(gamesRef);
      if (snapshot.exists()) {
        const gamesData = Object.entries(snapshot.val()).map(([key, data]) => ({
          ...(data as Omit<Game, "id">),
          id: parseInt(key),
        }));
        setGames(gamesData);
      } else {
        setGames([]);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newGameData = {
        ...newGame,
        id: Date.now(),
        placeholder: newGame.placeholder || "",
      };

      const newGameRef = await push(gamesRef, newGameData);
      // 로컬 상태 업데이트
      setGames((prevGames) => [
        ...prevGames,
        {
          ...newGameData,
          id: parseInt(newGameRef.key || Date.now().toString()),
        } as Game,
      ]);

      setNewGame({
        id: 0,
        title: "",
        description: "",
        year: new Date().getFullYear().toString(),
        project: "",
        imageUrl: "",
        link: "",
        developer: "",
        placeholder: "",
      });

      alert("게임이 성공적으로 추가되었습니다!");
    } catch (error) {
      console.error("Error adding game:", error);
      alert("게임 추가 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (gameId: number) => {
    if (window.confirm("정말로 이 게임을 삭제하시겠습니까?")) {
      try {
        const gameRef = child(gamesRef, gameId.toString());
        await remove(gameRef);
        // 로컬 상태 업데이트
        setGames((prevGames) => prevGames.filter((game) => game.id !== gameId));
        alert("게임이 삭제되었습니다.");
      } catch (error) {
        console.error("Error deleting game:", error);
        alert("게임 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>관리자 페이지</h1>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label>제목:</label>
          <input
            type="text"
            value={newGame.title}
            onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>설명:</label>
          <textarea
            value={newGame.description}
            onChange={(e) =>
              setNewGame({ ...newGame, description: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>연도:</label>
          <input
            type="text"
            value={newGame.year}
            onChange={(e) => setNewGame({ ...newGame, year: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>프로젝트:</label>
          <input
            type="text"
            value={newGame.project}
            onChange={(e) =>
              setNewGame({ ...newGame, project: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>이미지 URL:</label>
          <input
            type="text"
            value={newGame.imageUrl}
            onChange={(e) =>
              setNewGame({ ...newGame, imageUrl: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>게임 링크:</label>
          <input
            type="url"
            value={newGame.link}
            onChange={(e) => setNewGame({ ...newGame, link: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>개발자:</label>
          <input
            type="text"
            value={newGame.developer}
            onChange={(e) =>
              setNewGame({ ...newGame, developer: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>Placeholder(선택):</label>
          <input
            type="text"
            value={newGame.placeholder}
            onChange={(e) =>
              setNewGame({ ...newGame, placeholder: e.target.value })
            }
          />
        </div>

        <button type="submit" className="submit-button">
          게임 추가
        </button>
      </form>

      <div className="game-list">
        <h2>등록된 게임 목록</h2>
        {games.map((game) => (
          <div key={game.id} className="game-item">
            <span>{game.title}</span>
            <button
              className="delete-button"
              onClick={() => handleDelete(game.id)}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
