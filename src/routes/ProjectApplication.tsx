import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { onValue, ref, set } from "firebase/database";
import { useMemberRole } from "../auth/useMemberRole";
import { database } from "../firebase";
import type { ProjectApplication as Application } from "../types/projectApplication";
import "../styles/ModernPages.css";

export default function ProjectApplication() {
  const {user, role, loading} = useMemberRole();
  const [existing, setExisting] = useState<Application | null>(null);
  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || role !== "member") { setChecking(false); return; }
    return onValue(ref(database, `projectApplications/${user.uid}`), snapshot => { setExisting(snapshot.val() || null); setChecking(false); }, () => { setMessage("신청 상태를 확인하지 못했습니다."); setChecking(false); });
  }, [user, role]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || role !== "member" || existing || busy) return;
    setBusy(true);
    try {
      await set(ref(database, `projectApplications/${user.uid}`), {title: title.trim(), description: description.trim(), applicantName: user.displayName || "부원", createdAt: Date.now()} satisfies Application);
      setMessage("프로젝트 신청을 접수했습니다.");
    } catch { setMessage("신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
    finally { setBusy(false); }
  };

  return <div className="modern-page"><header className="modern-page__hero"><span>PROJECT APPLICATION</span><h1>새 프로젝트 신청하기</h1><p>프로젝트 이름과 간단한 소개를 적어 운영진에게 신청하세요.</p></header>
    <section className="modern-panel">
      {loading || checking ? <p>신청 상태를 확인하는 중입니다.</p> : role !== "member" ? <p>승인된 부원 계정으로 로그인하면 신청할 수 있습니다.</p> : existing ? <p><strong>{existing.title}</strong> 프로젝트 신청이 접수되어 검토 중입니다.</p> : <form className="modern-form" onSubmit={event => void submit(event)}>
        <label>프로젝트 이름<input value={title} onChange={event => setTitle(event.target.value)} required minLength={2} maxLength={100} /></label>
        <label>프로젝트 소개<textarea value={description} onChange={event => setDescription(event.target.value)} required minLength={10} maxLength={1000} /></label>
        <button type="submit" disabled={busy}>{busy ? "신청 중..." : "신청하기"}</button>
      </form>}
      {message && <p role="status">{message}</p>}
      <Link to="/projects">← 프로젝트로 돌아가기</Link>
    </section>
  </div>;
}
