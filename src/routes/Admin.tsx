import { useState, useEffect } from "react";
import { ref, push, remove, get } from "firebase/database";
import { database } from "../firebase";
import { Game } from "../types/game";
import "../styles/Admin.css";

const Admin = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [newGame, setNewGame] = useState<Partial<Game>>({
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

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const gamesRef = ref(database, "games");
      const snapshot = await get(gamesRef);
      if (snapshot.exists()) {
        const gamesData = Object.entries(snapshot.val()).map(([id, data]) => ({
          ...(data as Omit<Game, "id">),
          id: parseInt(id),
        }));
        setGames(gamesData);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gamesRef = ref(database, "games");
      const newGameData = {
        ...newGame,
        id: Date.now(),
        placeholder: newGame.placeholder || "",
      };

      await push(gamesRef, newGameData);
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
      fetchGames();
      alert("게임이 성공적으로 추가되었습니다!");
    } catch (error) {
      console.error("Error adding game:", error);
      alert("게임 추가 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (gameId: number) => {
    if (window.confirm("정말로 이 게임을 삭제하시겠습니까?")) {
      try {
        const gameRef = ref(database, `games/${gameId}`);
        await remove(gameRef);
        fetchGames();
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
          <label>Placeholder:</label>
          <input
            type="text"
            value={newGame.placeholder}
            onChange={(e) =>
              setNewGame({ ...newGame, placeholder: e.target.value })
            }
            required
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
