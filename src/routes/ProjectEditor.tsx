import { useEffect, useState, type FormEvent } from "react";
import { get, onValue, ref, set } from "firebase/database";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiImage, FiInfo, FiLayers, FiSave, FiTag } from "react-icons/fi";
import { useMemberRole } from "../auth/useMemberRole";
import ProjectUpdatesEditor from "../components/ProjectUpdatesEditor";
import ProjectImageEditor from "../components/ProjectImageEditor";
import ProjectPreviewMediaEditor from "../components/ProjectPreviewMediaEditor";
import ProjectFeaturePicker from "../components/ProjectFeaturePicker";
import ProjectLanguageEditor from "../components/ProjectLanguageEditor";
import ProjectDevelopersPicker from "../components/ProjectDevelopersPicker";
import type { PreMemberRecord } from "../components/PreMemberRecords";
import { enrichProjectDevelopers, sortProjectDevelopers } from "../utils/projectDevelopers";
import { cleanupReplacedProjectImage } from "../utils/githubUpload";
import ProjectVersionsEditor from "../components/ProjectVersionsEditor";
import { auth, database } from "../firebase";
import type { Game } from "../types/game";
import { projectAssetUrl } from "../utils/projectAssetUrl";
import { MID_DESCRIPTION_MAX_LENGTH, normalizeProjectLineBreaks, previewDescription, singleLineDescription } from "../utils/projectContent";
import { youtubeVideoId } from "../utils/youtubeVideo";
import { sortProjectVersions, validVersionNumber, versionFields, versionLabel } from "../utils/projectVersions";
import { sortProjectUpdates } from "../utils/projectUpdates";
import "../styles/ProjectEditor.css";

const split = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean);
const sections = [
  {id: "required", label: "필수 정보", icon: <FiInfo aria-hidden="true" />},
  {id: "details", label: "세부 정보", icon: <FiTag aria-hidden="true" />},
  {id: "versions", label: "버전관리", icon: <FiDownload aria-hidden="true" />},
  {id: "updates", label: "업데이트 관리", icon: <FiLayers aria-hidden="true" />},
] as const;

export default function ProjectEditor() {
  const {id} = useParams();
  const {user, role, loading: authLoading} = useMemberRole();
  const [gameKey, setGameKey] = useState("");
  const [draft, setDraft] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]["id"]>("required");
  const [tags, setTags] = useState({genre: "", awards: ""});
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [projectYears, setProjectYears] = useState<string[]>([]);
  const [memberRecords, setMemberRecords] = useState<Record<string, PreMemberRecord>>({});
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState(false);
  const [originalImages, setOriginalImages] = useState({main: "", icon: "", cover: ""});
  const [originalPreviewImages, setOriginalPreviewImages] = useState<NonNullable<Game["previewImages"]>>([]);
  const backToProject = `/projects?project=${encodeURIComponent(id || "")}`;

  useEffect(() => {
    let active = true;
    get(ref(database, "games")).then(snapshot => {
      if (!active) return;
      const allGames = Object.entries(snapshot.val() as Record<string, Game> || {});
      const found = allGames.find(([,game]) => String(game.id) === id);
      const currentYear = new Date().getFullYear();
      setProjectYears([...new Set([...allGames.map(([,game]) => game.year).filter(Boolean), ...Array.from({length: currentYear - 2022}, (_,index) => String(currentYear - index)), String(currentYear + 1)])].sort((a,b) => Number(b) - Number(a)));
      setProjectTypes([...new Set(allGames.map(([,game]) => game.project?.trim()).filter((value): value is string => Boolean(value)))].sort((a,b) => a.localeCompare(b, "ko")));
      if (found) {
        const existingVersions = found[1].versions || [];
        const versions = found[1].link && !existingVersions.some(version => version.url === found[1].link)
          ? [...existingVersions, {label: "기본 버전", url: found[1].link, source: "base" as const}]
          : existingVersions;
        setGameKey(found[0]);
        setDraft({...found[1], versions, description: singleLineDescription(found[1].description || ""), midDescription: normalizeProjectLineBreaks(found[1].midDescription || ""), detail: normalizeProjectLineBreaks(found[1].detail || "")});
        setOriginalImages({main: found[1].imageUrl || "", icon: found[1].iconUrl || "", cover: found[1].coverUrl || ""});
        setOriginalPreviewImages(found[1].previewImages || []);
        setTags({genre: (found[1].genreTags || []).join(", "), awards: (found[1].awards || []).join(", ")});
      }
    }).catch(() => {if (active) setMessage("프로젝트를 불러오지 못했습니다.");}).finally(() => {if (active) setLoading(false);});
    return () => {active = false;};
  }, [id]);

  useEffect(() => {
    let active = true;
    if (authLoading || !gameKey) return;
    if (role === "admin") {setCanEdit(true); setCheckingAccess(false); return;}
    if (role !== "member" || !user) {setCanEdit(false); setCheckingAccess(false); return;}
    get(ref(database, `gameMembers/${gameKey}/${user.uid}`)).then(snapshot => {if (active) setCanEdit(snapshot.val() === true);}).catch(() => {if (active) setCanEdit(false);}).finally(() => {if (active) setCheckingAccess(false);});
    return () => {active = false;};
  }, [authLoading, gameKey, role, user]);

  useEffect(() => {
    if (authLoading || !canEdit) return;
    return onValue(ref(database, "memberRecords"), snapshot => {
      const records = snapshot.val() as Record<string, PreMemberRecord> || {};
      setMemberRecords(records);
      setDraft(current => current ? {...current, developerProfiles: sortProjectDevelopers(enrichProjectDevelopers(current, records))} : current);
      setRecordsLoading(false);
      setRecordsError(false);
    }, () => {setRecordsLoading(false); setRecordsError(true);});
  }, [authLoading, canEdit]);

  const change = (patch: Partial<Game>) => setDraft(current => current ? {...current, ...patch} : current);
  const requiredMissing = ![draft?.title, draft?.year, draft?.project, draft?.description, draft?.midDescription, draft?.detail, draft?.engine, draft?.platform, draft?.imageUrl].every(value => value?.trim())
    || !(draft?.developerProfiles?.some(person => person.name.trim()) || draft?.developer?.trim())
    || !split(tags.genre).length || !draft?.featureTags?.some(tag => tag.trim()) || !draft?.supportedLanguages?.some(language => language.trim());
  const versionsMissing = !draft?.versions?.length || draft.versions.some(version => {
    const {number, stage} = versionFields(version);
    return !version.label.trim() || !/^https?:\/\/\S+$/i.test(version.url.trim()) || !validVersionNumber(number, stage);
  });
  const updatesIncomplete = Boolean(draft?.updates?.some(update => !update.title.trim() || !update.summary?.trim() || !update.detail?.trim()));
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !canEdit || saving) return;
    if (![draft.title, draft.year, draft.project, draft.description, draft.midDescription, draft.detail, draft.engine, draft.platform].every(value => value?.trim())) {setActiveSection("required"); setMessage("필수 정보를 모두 입력해 주세요."); return;}
    if (!draft.imageUrl) {setActiveSection("required"); setMessage("대표 이미지는 필수입니다. 이미지를 업로드해 주세요."); return;}
    if (!(draft.developerProfiles?.some(person => person.name.trim()) || (draft.developer || "").trim())) {setActiveSection("required"); setMessage("제작자를 한 명 이상 추가해 주세요."); return;}
    if (!split(tags.genre).length) {setActiveSection("required"); setMessage("장르 태그를 한 개 이상 입력해 주세요."); return;}
    if (!draft.featureTags?.some(tag => tag.trim())) {setActiveSection("required"); setMessage("게임 기능을 한 개 이상 선택해 주세요."); return;}
    if (!draft.supportedLanguages?.some(language => language.trim())) {setActiveSection("required"); setMessage("지원 언어를 한 개 이상 추가해 주세요."); return;}
    if (!draft.versions?.length) {setActiveSection("versions"); setMessage("버전을 한 개 이상 추가하고 링크를 입력해 주세요."); return;}
    if (draft.versions?.some(version => !version.label.trim() || !/^https?:\/\/\S+$/i.test(version.url.trim()))) {setActiveSection("versions"); setMessage("버전 이름과 올바른 다운로드 주소를 입력해 주세요."); return;}
    if (draft.versions?.some(version => {const {number, stage} = versionFields(version); return !validVersionNumber(number, stage);})) {setActiveSection("versions"); setMessage("버전 번호는 세 자리로 입력하고, 정식 출시 전 Major는 0으로 설정해 주세요."); return;}
    if (updatesIncomplete) {setActiveSection("updates"); setMessage("추가한 업데이트의 제목, 미리보기 글, 상세 내용을 입력해 주세요."); return;}
    if (draft.previewYoutubeUrl?.trim() && !youtubeVideoId(draft.previewYoutubeUrl)) {setActiveSection("details"); setMessage("미리보기 영상에는 올바른 YouTube 링크를 입력해 주세요."); return;}
    setSaving(true);
    setMessage("");
    try {
      const developerProfiles = sortProjectDevelopers(enrichProjectDevelopers(draft, memberRecords));
      const versions = sortProjectVersions(draft.versions.map(version => {const fields = versionFields(version); return {...version, ...fields, label: versionLabel(fields.number, fields.stage)};}));
      const updated = {...draft, description: singleLineDescription(draft.description), versions, link: versions[0].url.trim(), updates: sortProjectUpdates(draft.updates || []), previewImages: (draft.previewImages || []).filter(image => image.url), previewYoutubeUrl: draft.previewYoutubeUrl?.trim() || "", developerProfiles, developer: developerProfiles.length ? developerProfiles.map(person => person.name).join(", ") : draft.developer, genreTags: split(tags.genre), awards: split(tags.awards)};
      await set(ref(database, `games/${gameKey}`), updated);
      setDraft(updated);
      const account = auth.currentUser;
      const replacements = [{slot: "main" as const, old: originalImages.main, current: updated.imageUrl}, {slot: "icon" as const, old: originalImages.icon, current: updated.iconUrl || ""}, {slot: "cover" as const, old: originalImages.cover, current: updated.coverUrl || ""}].filter(item => item.old && item.old !== item.current);
      const removedPreviewImages = originalPreviewImages.filter(image => !updated.previewImages.some(current => current.id === image.id) && /^[a-f0-9]{12}$/.test(image.id));
      const cleaned = account ? await Promise.allSettled([...replacements.map(item => cleanupReplacedProjectImage(account, gameKey, item.slot, item.old)), ...removedPreviewImages.map(image => cleanupReplacedProjectImage(account, gameKey, `preview-${image.id}`, image.url))]) : [];
      setOriginalImages({main: updated.imageUrl || "", icon: updated.iconUrl || "", cover: updated.coverUrl || ""});
      setOriginalPreviewImages(updated.previewImages);
      setMessage(cleaned.some(result => result.status === "rejected") ? "프로젝트 정보는 저장됐지만 이전 이미지 파일 일부를 정리하지 못했습니다." : "프로젝트 정보가 저장됐습니다.");
    } catch {setMessage("저장하지 못했습니다. 입력 내용과 프로젝트 권한을 확인해 주세요.");}
    finally {setSaving(false);}
  };

  if (loading || authLoading || (draft && checkingAccess)) return <div className="project-editor__state">프로젝트 편집 화면을 불러오는 중입니다.</div>;
  if (!draft) return <div className="project-editor__state">프로젝트를 찾을 수 없습니다. <Link to="/projects">프로젝트로 돌아가기</Link></div>;
  if (!canEdit) return <div className="project-editor__state">이 프로젝트를 수정할 권한이 없습니다. <Link to={backToProject}>프로젝트로 돌아가기</Link></div>;

  return <div className="project-editor">
    <header className="project-editor__top">
      <div><Link className="project-editor__back" to={backToProject}><FiArrowLeft aria-hidden="true" /> 프로젝트로 돌아가기</Link><span className="project-editor__eyebrow">PROJECT STUDIO · {draft.year || "연도 미설정"}</span><h1>{draft.title || "새 프로젝트"}<span> 편집</span></h1><p>프로젝트 페이지에 표시될 이미지와 소개, 다운로드 정보를 구성하세요.</p></div>
      <button className="project-editor__save" type="submit" form="project-editor-form" disabled={saving}><FiSave aria-hidden="true" />{saving ? "저장 중..." : "변경사항 저장"}</button>
    </header>
    {message && <p className="project-editor__message" role="status">{message}</p>}
    <div className="project-editor__workspace">
      <nav className="project-editor__nav" aria-label="편집 구역">{sections.map(section => {const incomplete = section.id === "required" ? requiredMissing : section.id === "versions" ? versionsMissing : section.id === "updates" ? updatesIncomplete : false; return <button type="button" className={`${activeSection === section.id ? "is-active " : ""}${incomplete ? "is-incomplete" : ""}`} aria-current={activeSection === section.id ? "page" : undefined} aria-label={`${section.label}${incomplete ? " · 입력 미완료" : ""}`} onClick={() => {setActiveSection(section.id); setMessage(""); window.scrollTo({top: 0});}} key={section.id}>{section.icon}{section.label}{incomplete && <span className="project-editor__nav-warning" aria-hidden="true">!</span>}</button>})}</nav>
      <form id="project-editor-form" className="project-editor__form" onSubmit={event => void save(event)} noValidate>
        {activeSection === "required" && <section id="required" className="project-editor__panel">
          <div className="project-editor__panel-heading"><span>01</span><div><h2><FiInfo aria-hidden="true" />필수 정보</h2><p>기존 프로젝트 등록에 필요한 정보입니다.</p></div></div>
          <div className="project-editor__fields">
            <label className="project-editor__wide">프로젝트 제목<input required value={draft.title} onChange={event => change({title: event.target.value})} placeholder="프로젝트 제목" /></label>
            <label>제작 연도<select required value={draft.year} onChange={event => change({year: event.target.value})}><option value="" disabled>연도 선택</option>{[...new Set([draft.year, ...projectYears].filter(Boolean))].map(year => <option value={year} key={year}>{year}년</option>)}</select></label>
            <label>프로젝트 구분<select required value={draft.project} onChange={event => change({project: event.target.value})}><option value="" disabled>구분 선택</option>{[...new Set([draft.project, ...projectTypes].filter(Boolean))].map(type => <option value={type} key={type}>{type}</option>)}</select></label>
            <ProjectDevelopersPicker game={draft} records={memberRecords} onChange={change} loading={recordsLoading} error={recordsError} />
            <div className="project-editor__wide project-editor__image-field"><ProjectImageEditor slot="main" projectKey={gameKey} currentUrl={draft.imageUrl} onUploaded={url => change({imageUrl: url})} /></div>
            <label className="project-editor__wide">짧은 소개<input required type="text" value={draft.description} onChange={event => change({description: event.target.value.replace(/\/n|\r?\n/g, " ")})} placeholder="프로젝트를 한 문장으로 소개해 주세요." /></label>
            <label className="project-editor__wide">대표 이미지 옆 설명 <small>{(draft.midDescription || "").length}/{MID_DESCRIPTION_MAX_LENGTH}자</small><textarea required maxLength={MID_DESCRIPTION_MAX_LENGTH} value={draft.midDescription || ""} onChange={event => change({midDescription: event.target.value})} placeholder="상세 화면의 오른쪽에 보이는 설명입니다." /></label>
            <label className="project-editor__wide">프로젝트 소개<textarea required className="project-editor__long-text" value={draft.detail} onChange={event => change({detail: event.target.value})} placeholder="게임의 배경과 플레이 방식을 자세히 적어 주세요." /></label>
            <label>엔진<input required value={draft.engine} onChange={event => change({engine: event.target.value})} placeholder="예: Unity" /></label>
            <label>플랫폼<input required value={draft.platform} onChange={event => change({platform: event.target.value})} placeholder="예: PC" /></label>
            <label className="project-editor__wide">평가 작성 범위<select value={draft.reviewPolicy || "off"} onChange={event => change({reviewPolicy: event.target.value as Game["reviewPolicy"]})}><option value="off">평가 받지 않음</option><option value="everyone">누구나</option><option value="account">인증된 계정</option><option value="member">승인된 부원</option></select></label>
            <label className="project-editor__wide">장르 태그 <small>쉼표로 구분</small><input required value={tags.genre} onChange={event => setTags(current => ({...current, genre: event.target.value}))} placeholder="공포, 퍼즐, 협동" /></label>
            <ProjectFeaturePicker selected={draft.featureTags || []} onChange={featureTags => change({featureTags})} />
            <ProjectLanguageEditor languages={draft.supportedLanguages || []} support={draft.languageSupport || {}} onChange={(supportedLanguages, languageSupport) => change({supportedLanguages, languageSupport})} />
          </div>
        </section>}
        {activeSection === "details" && <section id="details" className="project-editor__panel">
          <div className="project-editor__panel-heading"><span>02</span><div><h2><FiTag aria-hidden="true" />세부 정보</h2><p>미리보기, 조작 방식 및 관련 정보를 편집합니다.</p></div></div>
          <div className="project-editor__fields">
            <div className="project-editor__wide project-editor__image-grid project-editor__image-grid--optional">
              <div className="project-editor__image-field"><ProjectImageEditor slot="icon" projectKey={gameKey} currentUrl={draft.iconUrl} fallbackUrl={draft.imageUrl} onUploaded={url => change({iconUrl: url})} onRemove={() => change({iconUrl: ""})} /></div>
              <div className="project-editor__image-field"><ProjectImageEditor slot="cover" projectKey={gameKey} currentUrl={draft.coverUrl} fallbackUrl={draft.imageUrl} onUploaded={url => change({coverUrl: url})} onRemove={() => change({coverUrl: ""})} /></div>
            </div>
            <ProjectPreviewMediaEditor projectKey={gameKey} images={draft.previewImages || []} youtubeUrl={draft.previewYoutubeUrl || ""} onImagesChange={previewImages => change({previewImages})} onYoutubeChange={previewYoutubeUrl => change({previewYoutubeUrl})} />
            <label className="project-editor__wide">조작 방식<input value={draft.controls || ""} onChange={event => change({controls: event.target.value})} placeholder="예: 키보드, 마우스" /></label>
            <label>팀 Instagram<input type="url" value={draft.socialLinks?.instagram || ""} onChange={event => change({socialLinks: {...draft.socialLinks, instagram: event.target.value}})} placeholder="https://..." /></label>
            <label>팀 YouTube<input type="url" value={draft.socialLinks?.youtube || ""} onChange={event => change({socialLinks: {...draft.socialLinks, youtube: event.target.value}})} placeholder="https://..." /></label>
            <label className="project-editor__wide">수상 내역 <small>쉼표로 구분</small><input value={tags.awards} onChange={event => setTags(current => ({...current, awards: event.target.value}))} placeholder="2025 게임잼 대상" /></label>
          </div>
        </section>}
        {activeSection === "versions" && <section id="versions" className="project-editor__panel"><div className="project-editor__panel-heading"><span>03</span><div><h2><FiDownload aria-hidden="true" />버전관리</h2><p>버전별 다운로드 파일을 설정합니다.</p></div></div><div className="project-editor__fields"><div className="project-editor__wide"><ProjectVersionsEditor projectKey={gameKey} game={draft} onChange={setDraft} /></div></div></section>}
        {activeSection === "updates" && <section id="updates" className="project-editor__panel"><div className="project-editor__panel-heading"><span>04</span><div><h2><FiLayers aria-hidden="true" />업데이트 관리</h2><p>업데이트와 공지의 배너, 미리보기 글, 상세 내용을 편집합니다.</p></div></div><ProjectUpdatesEditor projectKey={gameKey} game={draft} onChange={updates => change({updates})} /></section>}
        <div className="project-editor__bottom"><Link to={backToProject}>프로젝트로 돌아가기</Link><button type="submit" disabled={saving}><FiSave aria-hidden="true" />{saving ? "저장 중..." : "변경사항 저장"}</button></div>
      </form>
      <aside className="project-editor__preview" aria-label="프로젝트 미리보기"><span>LIVE PREVIEW</span><div className="project-editor__preview-card"><div className="project-editor__preview-image">{draft.imageUrl ? <img src={projectAssetUrl(draft.imageUrl)} alt="대표 이미지 미리보기" /> : <FiImage aria-hidden="true" />}</div><div className="project-editor__preview-body"><small>{draft.year} · {draft.project || "프로젝트"}</small><h2>{draft.title || "프로젝트 제목"}</h2><p>{previewDescription(draft.midDescription || draft.description || "설명을 입력하면 이곳에 표시됩니다.")}</p><div>{split(tags.genre).map(tag => <span key={tag}>{tag}</span>)}</div></div></div><div className="project-editor__image-previews"><div><span>목록 아이콘</span><img src={projectAssetUrl(draft.iconUrl || draft.imageUrl)} alt="목록 아이콘 미리보기" /></div><div><span>오른쪽 소개</span><img src={projectAssetUrl(draft.coverUrl || draft.imageUrl)} alt="오른쪽 소개 이미지 미리보기" /></div></div><p>입력 내용이 바로 반영됩니다. 저장하면 프로젝트 페이지에 적용됩니다.</p>{role === "admin" && <Link to={`/admin?tab=games&game=${encodeURIComponent(gameKey)}`}>관리자 고급 설정 →</Link>}</aside>
    </div>
  </div>;
}
