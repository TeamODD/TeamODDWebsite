import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { auth } from "../firebase";
import { uploadToGitHub } from "../utils/githubUpload";
import { projectAssetUrl } from "../utils/projectAssetUrl";
import "../styles/ProjectImageEditor.css";

type Slot = "main" | "icon" | "cover" | "preview";
const settings: Record<Slot, {label: string; width: number; height: number; hint: string}> = {
  main: {label: "대표 이미지", width: 1280, height: 720, hint: "필수 · 16:9 · 1280 × 720"},
  icon: {label: "목록 아이콘", width: 512, height: 512, hint: "선택 · 1:1 · 512 × 512"},
  cover: {label: "오른쪽 소개 이미지", width: 1280, height: 560, hint: "선택 · 16:7 · 1280 × 560"},
  preview: {label: "미리보기 이미지", width: 1280, height: 720, hint: "선택 · 16:9 · 1280 × 720"},
};
const PREVIEW_WIDTH = 600;
const clampZoom = (value: number) => Math.max(1, Math.min(4, value));

function paint(canvas: HTMLCanvasElement, image: HTMLImageElement, slot: Slot, zoom: number, offset: {x: number; y: number}, output: boolean) {
  const {width, height} = settings[slot];
  const canvasWidth = output ? width : PREVIEW_WIDTH;
  const canvasHeight = Math.round(canvasWidth * height / width);
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const scale = Math.max(canvasWidth / image.naturalWidth, canvasHeight / image.naturalHeight) * zoom;
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  const multiplier = canvasWidth / PREVIEW_WIDTH;
  const x = Math.max((canvasWidth - drawnWidth) / 2, Math.min((drawnWidth - canvasWidth) / 2, offset.x * multiplier));
  const y = Math.max((canvasHeight - drawnHeight) / 2, Math.min((drawnHeight - canvasHeight) / 2, offset.y * multiplier));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지 미리보기를 만들 수 없습니다.");
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(image, (canvasWidth - drawnWidth) / 2 + x, (canvasHeight - drawnHeight) / 2 + y, drawnWidth, drawnHeight);
}

export default function ProjectImageEditor({slot, projectKey, imageId, currentUrl, fallbackUrl, onUploaded, onRemove}: {slot: Slot; projectKey: string; imageId?: string; currentUrl?: string; fallbackUrl?: string; onUploaded: (url: string) => void; onRemove?: () => void}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{x: number; y: number; offsetX: number; offsetY: number} | null>(null);
  const zoomDragRef = useRef<{x: number; y: number; zoom: number} | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const config = settings[slot];
  const uploadSlot = slot === "preview" ? `preview-${imageId}` as const : slot;

  useEffect(() => {
    if (!image) return;
    const scrollY = window.scrollY;
    const previousBody = {position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.body.style.overflow};
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.position = previousBody.position;
      document.body.style.top = previousBody.top;
      document.body.style.width = previousBody.width;
      document.body.style.overflow = previousBody.overflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [image]);

  useEffect(() => {
    if (!image) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {if (event.key === "Escape" && !uploading) {setFile(null); setImage(null);}};
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [image, uploading]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const next = new Image();
    next.onload = () => {setImage(next); setZoom(1); setOffset({x: 0, y: 0});};
    next.onerror = () => setMessage("이미지를 열 수 없습니다.");
    next.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {if (image && canvasRef.current) paint(canvasRef.current, image, slot, zoom, offset, false);}, [image, slot, zoom, offset]);

  const select = (selected?: File) => {
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 10 * 1024 * 1024) {setMessage("JPG, PNG, WebP 이미지 중 10MB 이하 파일을 선택해 주세요."); return;}
    setMessage(""); setFile(selected);
  };
  const upload = async () => {
    const user = auth.currentUser;
    if (!user || !image || uploading) return;
    setUploading(true); setMessage("");
    try {
      const output = document.createElement("canvas");
      paint(output, image, slot, zoom, offset, true);
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(value => value ? resolve(value) : reject(new Error("이미지 파일을 만들 수 없습니다.")), "image/webp", 0.88));
      const url = await uploadToGitHub(user, blob, {kind: "project", name: `${uploadSlot}.webp`, projectKey, imageSlot: uploadSlot, previousUrl: currentUrl});
      onUploaded(url); setFile(null); setImage(null); setMessage("이미지를 업로드했습니다. 변경사항 저장을 누르면 프로젝트에 적용됩니다.");
    } catch (error) {setMessage(error instanceof Error ? error.message : "이미지를 업로드하지 못했습니다.");}
    finally {setUploading(false);}
  };

  return <div className="project-image-editor">
    <div className="project-image-editor__title"><strong>{config.label}</strong><small>{config.hint}</small></div>
    <div className={`project-image-editor__preview project-image-editor__preview--${slot}`}>
      {(currentUrl || fallbackUrl) ? <img src={projectAssetUrl(currentUrl || fallbackUrl || "")} alt={`${config.label} 미리보기`} /> : <span>이미지 없음</span>}
    </div>
    <div className="project-image-editor__actions"><label className="project-image-editor__choose">{currentUrl ? "이미지 교체" : "이미지 선택"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => {select(event.target.files?.[0]); event.target.value = "";}} /></label>{onRemove && (currentUrl || slot === "preview") && <button type="button" onClick={onRemove}>{slot === "preview" ? "이미지 삭제" : "대표 이미지 사용"}</button>}</div>
    {message && <p className="project-image-editor__message" role="status">{message}</p>}
    {image && createPortal(<div className="project-image-crop" role="presentation" onPointerDown={event => {if (event.target === event.currentTarget && !uploading) {setFile(null); setImage(null);}}}>
      <section className="project-image-crop__dialog" role="dialog" aria-modal="true" aria-label={`${config.label} 자르기`}>
        <header><div><strong>{config.label} 자르기</strong><span>{config.hint}</span></div><button ref={closeRef} type="button" aria-label="닫기" onClick={() => {setFile(null); setImage(null);}} disabled={uploading}>×</button></header>
        <p>이미지를 드래그해 위치를 옮기세요. 오른쪽 아래 손잡이를 드래그하거나 마우스 휠을 돌려 확대·축소할 수 있습니다.</p>
        <div className="project-image-crop__stage" onWheel={event => {event.preventDefault(); setZoom(value => clampZoom(value * (event.deltaY < 0 ? 1.08 : 1 / 1.08)));}}>
          <canvas ref={canvasRef} aria-label={`${config.label} 자르기 미리보기`} onPointerDown={event => {dragRef.current = {x:event.clientX,y:event.clientY,offsetX:offset.x,offsetY:offset.y}; event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event => {if (!dragRef.current) return; const ratio = PREVIEW_WIDTH / event.currentTarget.getBoundingClientRect().width; setOffset({x:dragRef.current.offsetX + (event.clientX - dragRef.current.x) * ratio,y:dragRef.current.offsetY + (event.clientY - dragRef.current.y) * ratio});}} onPointerUp={() => {dragRef.current = null;}} onPointerCancel={() => {dragRef.current = null;}} />
          <button className="project-image-crop__zoom-handle" type="button" aria-label="드래그하여 확대 축소" onPointerDown={event => {event.stopPropagation(); zoomDragRef.current = {x:event.clientX,y:event.clientY,zoom}; event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event => {if (!zoomDragRef.current) return; const delta = (event.clientX - zoomDragRef.current.x) - (event.clientY - zoomDragRef.current.y); setZoom(clampZoom(zoomDragRef.current.zoom * Math.exp(delta / 220)));}} onPointerUp={() => {zoomDragRef.current = null;}} onPointerCancel={() => {zoomDragRef.current = null;}}>⤢ <span>확대·축소</span></button>
        </div>
        <div className="project-image-crop__footer"><span>확대 {Math.round(zoom * 100)}%</span><div><button type="button" onClick={() => {setFile(null); setImage(null);}} disabled={uploading}>취소</button><button type="button" onClick={() => void upload()} disabled={uploading}>{uploading ? "업로드 중..." : "이대로 업로드"}</button></div></div>
        {message && <p className="project-image-crop__message" role="status">{message}</p>}
      </section>
    </div>, document.body)}
  </div>;
}
