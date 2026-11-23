import { useState } from "react";
import type { Game } from "../types/game";
import { languageFlag } from "../utils/languageFlag";
import "../styles/ProjectLanguageEditor.css";

type Support = NonNullable<Game["languageSupport"]>;
const PRESETS = ["한국어", "영어"];

export default function ProjectLanguageEditor({languages, support, onChange}: {languages: string[]; support: Support; onChange: (languages: string[], support: Support) => void}) {
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const add = (raw: string) => {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name || name.length > 40) {setMessage("언어 이름은 1~40자로 입력해 주세요."); return;}
    if (languages.some(language => language.toLocaleLowerCase() === name.toLocaleLowerCase())) {setMessage("이미 추가한 언어입니다."); return;}
    onChange([...languages, name], {...support, [name]: {interface: true, voice: false, subtitles: false}});
    setCustom(""); setMessage("");
  };
  const toggle = (language: string, field: "interface" | "voice" | "subtitles", checked: boolean) => {
    const previous = support[language] || {interface: true, voice: false, subtitles: false};
    onChange(languages, {...support, [language]: {...previous, [field]: checked}});
  };
  const remove = (language: string) => {
    const nextSupport = {...support}; delete nextSupport[language];
    onChange(languages.filter(item => item !== language), nextSupport);
  };
  return <div className="project-language-editor project-editor__wide">
    <strong>지원 언어</strong>
    <div className="project-language-editor__add"><select aria-label="기본 언어 추가" value="" onChange={event => {if (event.target.value) add(event.target.value);}}><option value="">기본 언어 선택</option>{PRESETS.filter(language => !languages.includes(language)).map(language => <option key={language} value={language}>{language}</option>)}</select><input aria-label="직접 추가할 언어" value={custom} maxLength={40} onChange={event => setCustom(event.target.value)} onKeyDown={event => {if (event.key === "Enter") {event.preventDefault(); add(custom);}}} placeholder="다른 언어 직접 입력" /><button type="button" onClick={() => add(custom)}>언어 추가</button></div>
    {languages.length > 0 && <div className="project-language-editor__table-wrap"><table><thead><tr><th scope="col">언어</th><th scope="col">인터페이스</th><th scope="col">음성 지원</th><th scope="col">자막</th><th scope="col"><span className="sr-only">삭제</span></th></tr></thead><tbody>{languages.map(language => <tr key={language}><th scope="row">{languageFlag(language) && <img className="project-language-editor__flag" src={`/flags/${languageFlag(language)}.svg`} alt="" />}{language}</th>{(["interface", "voice", "subtitles"] as const).map(field => <td key={field}><input type="checkbox" aria-label={`${language} ${field === "interface" ? "인터페이스" : field === "voice" ? "음성 지원" : "자막"}`} checked={support[language]?.[field] ?? (field === "interface")} onChange={event => toggle(language, field, event.target.checked)} /></td>)}<td><button type="button" aria-label={`${language} 삭제`} onClick={() => remove(language)}>삭제</button></td></tr>)}</tbody></table></div>}
    {message && <p role="status">{message}</p>}
  </div>;
}
