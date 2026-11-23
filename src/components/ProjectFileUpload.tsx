import { useState } from "react";
import { auth } from "../firebase";
import { uploadToGitHub } from "../utils/githubUpload";
import "../styles/ProjectFileUpload.css";

export default function ProjectFileUpload({onUploaded, imageOnly = false, projectKey}: {onUploaded: (url: string) => void; imageOnly?: boolean; projectKey?: string}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const upload = async (file?: File) => {
    if (!file) return;
    const user = auth.currentUser;
    if (!user) { setMessage("로그인 후 업로드할 수 있습니다."); return; }
    if (imageOnly && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setMessage("JPG, PNG, WebP 이미지를 선택해 주세요."); return; }
    if (file.size > 10 * 1024 * 1024) { setMessage("파일 크기는 10MB 이하여야 합니다."); return; }
    setMessage("");
    setProgress(0);
    try {
      onUploaded(await uploadToGitHub(user, file, {kind: "project", name: file.name, projectKey}));
      setMessage("업로드를 마쳤습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "업로드하지 못했습니다."); }
    finally { setProgress(null); }
  };

  return <span className="project-file-upload"><label className="project-file-upload__button">{imageOnly ? "이미지 업로드" : "파일 업로드"}<input type="file" accept={imageOnly ? "image/jpeg,image/png,image/webp" : undefined} disabled={progress !== null} onChange={event => {void upload(event.target.files?.[0]);event.target.value = "";}} /></label>{progress !== null && <small role="status">업로드 중...</small>}{message && <small role="status">{message}</small>}</span>;
}
