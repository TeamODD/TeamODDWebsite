import { useEffect, useState, type FormEvent } from "react";
import { onValue, push, ref, remove, set } from "firebase/database";
import { Link } from "react-router-dom";
import { database } from "../firebase";
import EventHeroBanner from "../components/EventHeroBanner";
import { parseEventBanner, shortProjectBanner, type EventBanner } from "../types/eventBanner";
import "../styles/ModernPages.css";

const emptyBanner = (): EventBanner => ({ title: "", imageSrc: "" });
const sameBanner = (a: EventBanner | null, b: EventBanner) => a?.title === b.title && a.imageSrc === b.imageSrc;

export default function AdminEventBanner({ embedded = false }: { embedded?: boolean }) {
  const [current, setCurrent] = useState<EventBanner | null>(null);
  const [library, setLibrary] = useState<Record<string, EventBanner>>({});
  const [draft, setDraft] = useState<EventBanner>(emptyBanner);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState({ current: false, library: false });
  const [errors, setErrors] = useState({ current: "", library: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const subscribe = (path: string, key: "current" | "library") => onValue(ref(database, path), snapshot => {
      if (key === "current") setCurrent(parseEventBanner(snapshot.val()));
      else {
        const entries = snapshot.val() as Record<string, unknown> | null;
        setLibrary(Object.fromEntries(Object.entries(entries ?? {}).flatMap(([id, value]) => {
          const banner = parseEventBanner(value);
          return banner ? [[id, banner]] : [];
        })));
      }
      setErrors(previous => ({ ...previous, [key]: "" }));
      setLoaded(previous => ({ ...previous, [key]: true }));
    }, error => {
      setLoaded(previous => ({ ...previous, [key]: true }));
      setErrors(previous => ({ ...previous, [key]: error.message.toLowerCase().includes("permission")
        ? "배너 접근 권한이 없습니다. 운영진 계정과 Firebase DB 규칙 배포 상태를 확인해 주세요."
        : "배너를 불러오지 못했습니다. 네트워크 연결을 확인한 뒤 새로고침해 주세요." }));
    });
    const subscriptions = [subscribe("eventHeroBanner", "current"), subscribe("eventBannerLibrary", "library")];
    return () => subscriptions.forEach(unsubscribe => unsubscribe());
  }, []);

  const ready = loaded.current && loaded.library && !errors.current && !errors.library;
  const act = async (operation: () => Promise<unknown>, success: string) => {
    if (busy || !ready) return;
    setBusy(true);
    setMessage("");
    try { await operation(); setMessage(success); }
    catch { setMessage("저장하지 못했습니다. 운영진 권한과 DB 규칙을 확인해 주세요."); }
    finally { setBusy(false); }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const banner = parseEventBanner({ title: draft.title.trim(), imageSrc: draft.imageSrc });
    if (!banner || !__EVENT_BANNER_IMAGES__.includes(banner.imageSrc)) {
      setMessage("폴더의 이미지를 선택하고 배너 이름을 입력해 주세요.");
      return;
    }
    await act(async () => {
      await set(editingId ? ref(database, `eventBannerLibrary/${editingId}`) : push(ref(database, "eventBannerLibrary")), banner);
      setEditingId(null);
      setDraft(emptyBanner());
    }, "배너 정보를 저장했습니다. 등록 목록에서 게시할 배너를 선택해 주세요.");
  };

  const preview = parseEventBanner(draft);
  return <div className={embedded ? "event-banner-editor" : "modern-page admin-modern"}>
    {!embedded && <Link className="admin-pending-back" to="/admin">← 대시보드로 돌아가기</Link>}
    <header className="modern-page__hero">{embedded ? <h2>행사 히어로 배너</h2> : <h1>행사 히어로 배너</h1>}<p>이미지를 선택해 배너 정보를 미리 등록하고, 원하는 배너를 게시하세요. 홈에는 한 번에 최대 한 개만 표시됩니다.</p></header>
    {Object.entries(errors).filter(([, error]) => error).map(([key, error]) => <p className="modern-message" role="alert" key={key}>{error}</p>)}
    {message && <p className="modern-message" role="status">{message}</p>}
    <section className="modern-panel">
      <h2>현재 게시 중</h2>
      {!loaded.current ? <p>확인 중…</p> : errors.current ? <p>게시 상태를 확인할 수 없습니다.</p> : current ? <>
        <p>{current.title}</p><EventHeroBanner key={current.imageSrc} banner={current} />
        <button className="modern-action" disabled={busy || !ready} onClick={() => void act(() => remove(ref(database, "eventHeroBanner")), "배너를 내렸습니다. 등록된 배너 정보는 유지됩니다.")}>배너 내리기</button>
      </> : <p>게시 중인 배너가 없습니다.</p>}
    </section>
    <section className="modern-panel">
      <h2>{editingId ? "배너 정보 수정" : "배너 사전 등록"}</h2>
      <form className="modern-form" onSubmit={save}>
        <fieldset disabled={busy} className="modern-form">
          <legend>행사 배너 이미지 선택</legend>
          <div className="event-banner-editor__images">
            {__EVENT_BANNER_IMAGES__.map(imageSrc => <label className={`event-banner-editor__image${draft.imageSrc === imageSrc ? " is-selected" : ""}`} key={imageSrc}>
              <input type="radio" name="event-banner-image" value={imageSrc} checked={draft.imageSrc === imageSrc} onChange={() => setDraft({ title: draft.title || (imageSrc === shortProjectBanner.imageSrc ? shortProjectBanner.title : imageSrc.split("/").pop()!.replace(/\.[^.]+$/, "")), imageSrc })} />
              <img src={imageSrc} alt={imageSrc === shortProjectBanner.imageSrc ? shortProjectBanner.title : imageSrc.split("/").pop()} />
              <span>{imageSrc.split("/").pop()}</span>
            </label>)}
          </div>
          {!__EVENT_BANNER_IMAGES__.length && <p>선택할 행사 배너 이미지가 없습니다.</p>}
          <label>배너 이름<input required maxLength={100} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="제3회 단기프로젝트" /></label>
          <p>정보 저장만으로 홈에 게시되지는 않습니다.</p>
          <div className="event-banner-editor__actions">
            <button type="submit" disabled={!ready || !preview}>{editingId ? "정보 저장" : "배너 등록"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setDraft(emptyBanner()); }}>수정 취소</button>}
          </div>
        </fieldset>
      </form>
      {preview && <div className="event-banner-editor__preview"><EventHeroBanner key={preview.imageSrc} banner={preview} /></div>}
    </section>
    <section className="modern-panel">
      <h2>등록된 배너</h2>
      <p>게시 버튼을 누르면 기존 게시 배너가 선택한 배너로 교체됩니다. 정보 수정은 다시 게시해야 홈에 반영됩니다.</p>
      {!loaded.library ? <p>불러오는 중…</p> : errors.library ? <p>등록 목록을 확인할 수 없습니다.</p> : !Object.keys(library).length && <p>아직 등록된 배너가 없습니다.</p>}
      <div className="event-banner-editor__library">{Object.entries(library).map(([id, banner]) => {
        const published = sameBanner(current, banner);
        return <article className="event-banner-editor__saved" key={id}>
          <EventHeroBanner key={banner.imageSrc} banner={banner} />
          <h3>{banner.title}{published && <span className="event-banner-editor__badge">게시 중</span>}</h3>
          <div className="event-banner-editor__actions">
            <button className="modern-action" disabled={busy || !ready || published} onClick={() => void act(() => set(ref(database, "eventHeroBanner"), banner), `‘${banner.title}’ 배너를 게시했습니다.`)}>{published ? "게시 중" : "게시"}</button>
            <button className="modern-action" disabled={busy} onClick={() => { setEditingId(id); setDraft({ ...banner }); }}>정보 수정</button>
            <button className="modern-action" disabled={busy || !ready || published} title={published ? "배너를 내린 후 삭제할 수 있습니다." : undefined} onClick={() => { if (window.confirm(`‘${banner.title}’ 등록 정보를 삭제할까요?`)) void act(() => remove(ref(database, `eventBannerLibrary/${id}`)), "배너 등록 정보를 삭제했습니다."); }}>삭제</button>
          </div>
        </article>;
      })}</div>
    </section>
  </div>;
}
