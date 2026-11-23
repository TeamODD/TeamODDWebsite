import { useEffect, useRef, useState } from "react";
import { updateProfile, type User } from "firebase/auth";
import { ref as databaseRef, update } from "firebase/database";
import { FiImage, FiUser } from "react-icons/fi";
import { database } from "../firebase";
import { uploadToGitHub } from "../utils/githubUpload";

const PREVIEW_SIZE = 280;
const OUTPUT_SIZE = 512;

function renderCrop(canvas: HTMLCanvasElement, image: HTMLImageElement, zoom: number, offset: {x: number; y: number}, size: number) {
  canvas.width = size;
  canvas.height = size;
  const ratio = size / PREVIEW_SIZE;
  const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const maxX = (width - size) / 2;
  const maxY = (height - size) / 2;
  const x = Math.max(-maxX, Math.min(maxX, offset.x * ratio));
  const y = Math.max(-maxY, Math.min(maxY, offset.y * ratio));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지 편집기를 열 수 없습니다.");
  context.fillStyle = "#181818";
  context.fillRect(0, 0, size, size);
  context.drawImage(image, (size - width) / 2 + x, (size - height) / 2 + y, width, height);
}

export default function ProfilePhotoEditor({user, onSaved}: {user: User; onSaved?: (url: string) => void}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{x: number; y: number; offsetX: number; offsetY: number} | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!file) { setImage(null); return; }
    const url = URL.createObjectURL(file);
    const next = new Image();
    next.onload = () => { setImage(next); setZoom(1); setOffset({x: 0, y: 0}); };
    next.onerror = () => setMessage("이미지를 열 수 없습니다. 다른 파일을 선택해 주세요.");
    next.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (image && canvasRef.current) renderCrop(canvasRef.current, image, zoom, offset, PREVIEW_SIZE);
  }, [image, zoom, offset]);

  const selectFile = (selected?: File) => {
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 10 * 1024 * 1024) { setMessage("JPG, PNG, WebP 이미지 중 10MB 이하 파일을 선택해 주세요."); return; }
    setMessage("");
    setFile(selected);
  };

  const savePhoto = async () => {
    if (!image || saving) return;
    setSaving(true);
    setMessage("");
    try {
      const output = document.createElement("canvas");
      renderCrop(output, image, zoom, offset, OUTPUT_SIZE);
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(value => value ? resolve(value) : reject(new Error("이미지를 만들지 못했습니다.")), "image/jpeg", 0.9));
      const url = await uploadToGitHub(user, blob, {kind: "avatar", name: "avatar.jpg"});
      await updateProfile(user, {photoURL: url});
      await update(databaseRef(database), { [`users/${user.uid}/photoURL`]: url, [`publicAvatars/${user.uid}`]: url });
      onSaved?.(url);
      setFile(null);
      setMessage("프로필 사진을 저장했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "프로필 사진을 저장하지 못했습니다."); }
    finally { setSaving(false); }
  };

  return <div className="profile-photo-editor">
    <div className="profile-photo-editor__current">{user.photoURL ? <img src={user.photoURL} alt="현재 프로필 사진" /> : <FiUser aria-hidden="true" />}</div>
    <label className="profile-photo-editor__choose"><FiImage aria-hidden="true" /> 사진 선택<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => selectFile(event.target.files?.[0])} /></label>
    {image && <div className="profile-photo-editor__crop">
      <p>사진을 드래그해 위치를 조절하세요. 원 안에 보이는 부분이 저장됩니다.</p>
      <div className="profile-photo-editor__preview"><canvas ref={canvasRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} aria-label="프로필 사진 자르기 미리보기" onPointerDown={event => {dragRef.current = {x:event.clientX,y:event.clientY,offsetX:offset.x,offsetY:offset.y};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event => {if (!dragRef.current) return; const width = event.currentTarget.getBoundingClientRect().width; const ratio = PREVIEW_SIZE / width; setOffset({x:dragRef.current.offsetX + (event.clientX - dragRef.current.x) * ratio, y:dragRef.current.offsetY + (event.clientY - dragRef.current.y) * ratio});}} onPointerUp={() => {dragRef.current = null;}} onPointerCancel={() => {dragRef.current = null;}} /><span aria-hidden="true" /></div>
      <label>확대 <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label>
      <div className="profile-photo-editor__actions"><button type="button" onClick={() => setFile(null)} disabled={saving}>취소</button><button type="button" onClick={() => void savePhoto()} disabled={saving}>{saving ? "저장 중..." : "사진 저장"}</button></div>
    </div>}
    {message && <p role="status">{message}</p>}
  </div>;
}
