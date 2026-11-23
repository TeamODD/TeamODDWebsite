import { useEffect, useState } from "react";
import { ref, remove, set, update } from "firebase/database";
import { database } from "../firebase";
import { MEMBER_PARTS, memberPart } from "../utils/memberPart";

type Props = {
  itemTitle: string;
  kind: "행사 참여" | "프로젝트 담당";
  path: string;
  mirrorPath?: string;
  defaultPart: string;
  savedPart?: string;
  onError: (message: string) => void;
};

export default function AssignmentPartSelect({ itemTitle, kind, path, mirrorPath, defaultPart, savedPart, onError }: Props) {
  const storedSelection = savedPart && savedPart !== "없음" && savedPart !== memberPart(defaultPart) ? memberPart(savedPart) : "default";
  const [selected, setSelected] = useState(storedSelection);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSelected(storedSelection); }, [storedSelection]);

  const changePart = async (next: string) => {
    setSelected(next);
    setSaving(true);
    try {
      if (mirrorPath) await update(ref(database), { [path]: next === "default" ? null : next, [mirrorPath]: next === "default" ? null : next });
      else if (next === "default") await remove(ref(database, path));
      else await set(ref(database, path), next);
    } catch {
      setSelected(storedSelection);
      onError(`${kind} 파트를 저장하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.`);
    } finally {
      setSaving(false);
    }
  };

  return <select aria-label={`${itemTitle} ${kind} 파트`} value={selected} disabled={saving} onChange={event => void changePart(event.target.value)}><option value="default">기본 값 ({memberPart(defaultPart)})</option>{MEMBER_PARTS.filter(option => option !== "없음").map(option => <option key={option} value={option}>{option}</option>)}</select>;
}
