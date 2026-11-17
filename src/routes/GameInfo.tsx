import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ref, get, set } from "firebase/database";
import { database } from "../firebase";
import { Game } from "../types/game";
import Loading from "../components/Loading";
import "../styles/GameInfo.css";
import GradientButton from "../components/GradientButton";
import ProjectReviews from "../components/ProjectReviews";
import { useMemberRole } from "../auth/useMemberRole";
import "../styles/ModernPages.css";

const GameInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [gameKey, setGameKey] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title:"", description:"", detail:"", imageUrl:"", link:"" });
  const [message, setMessage] = useState("");
  const { user, role } = useMemberRole();
  const [isDownload, setIsDownLoad] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameDetail = async () => {
      try {
        const gamesRef = ref(database, "games");
        const snapshot = await get(gamesRef);
        if (snapshot.exists()) {
          const gamesData = snapshot.val();
          const found = Object.entries(gamesData).find(
            ([, game]) => (game as Game).id.toString() === id
          );
          if (found) {
            setGameKey(found[0]);
            setGame(found[1] as Game);
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

  useEffect(() => {
    if (game) setIsDownLoad(/^https?:\/\//i.test(game.link || ""));
  }, [game]);

  useEffect(() => {
    if (!gameKey || !user?.uid || role === "guest") { setCanEdit(false); return; }
    if (role === "admin") { setCanEdit(true); return; }
    if (role !== "member") { setCanEdit(false); return; }
    get(ref(database,`gameMembers/${gameKey}/${user.uid}`)).then(s=>setCanEdit(s.val()===true)).catch(()=>setCanEdit(false));
  },[gameKey,user?.uid,role]);

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!game || !canEdit) return;
    try { const updated = {...game,...draft}; await set(ref(database,`games/${gameKey}`),updated); setGame(updated); setEditing(false); setMessage("프로젝트를 저장했습니다."); }
    catch { setMessage("저장하지 못했습니다. 담당 프로젝트 권한을 확인해 주세요."); }
  };

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
        {isDownload && (
          <div className="download-link-button">
            <GradientButton
              innerText="다운로드↗"
              onClick={() => window.open(game.link, "_blank", "noopener,noreferrer")}
            />
          </div>
        )}
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

      {canEdit && <section className="modern-panel"><button onClick={() => { setDraft({title:game.title,description:game.description,detail:game.detail,imageUrl:game.imageUrl,link:game.link||""});setEditing(!editing); }}>프로젝트 수정</button>{editing && <form className="modern-form" onSubmit={saveEdit}>{(["title","description","detail","imageUrl","link"] as const).map(field => <label key={field}>{({title:"제목",description:"설명",detail:"상세 설명",imageUrl:"이미지 경로",link:"다운로드 URL"})[field]}{field==="detail"||field==="description"?<textarea value={draft[field]} onChange={e=>setDraft({...draft,[field]:e.target.value})}/>:<input value={draft[field]} onChange={e=>setDraft({...draft,[field]:e.target.value})}/>}</label>)}<button>저장</button></form>}{message && <p role="status">{message}</p>}</section>}
      {gameKey && <ProjectReviews gameKey={gameKey} game={game} />}

      <Link to="/projects" className="back-to-list">
        목록으로
      </Link>
    </div>
  );
};

export default GameInfo;
