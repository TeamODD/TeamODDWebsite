import ProjectImageEditor from "./ProjectImageEditor";
import type { Game } from "../types/game";
import { youtubeVideoId } from "../utils/youtubeVideo";
import "../styles/ProjectPreviewMediaEditor.css";

type PreviewImages = NonNullable<Game["previewImages"]>;

export default function ProjectPreviewMediaEditor({projectKey, images, youtubeUrl, onImagesChange, onYoutubeChange}: {projectKey: string; images: PreviewImages; youtubeUrl: string; onImagesChange: (images: PreviewImages) => void; onYoutubeChange: (url: string) => void}) {
  const videoId = youtubeVideoId(youtubeUrl);
  const add = () => onImagesChange([...images, {id: crypto.randomUUID().replace(/-/g, "").slice(0, 12), url: ""}]);
  const update = (id: string, url: string) => onImagesChange(images.map(image => image.id === id ? {...image, url} : image));
  const remove = (id: string) => onImagesChange(images.filter(image => image.id !== id));
  const move = (index: number, direction: -1 | 1) => {
    const next = [...images];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onImagesChange(next);
  };

  return <div className="project-preview-media-editor project-editor__wide">
    <div className="project-preview-media-editor__heading"><strong>가운데 미리보기</strong><span>영상 → 미리보기 이미지 순서로 표시 · 사진은 5초마다 자동 전환 · 대표 이미지는 포함되지 않음</span></div>
    <label className="project-preview-media-editor__youtube">YouTube 영상 링크 <small>선택 · 영상은 항상 첫 번째</small><input type="url" value={youtubeUrl} onChange={event => onYoutubeChange(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></label>
    {youtubeUrl && !videoId && <p className="project-preview-media-editor__notice">YouTube 영상 주소를 확인해 주세요.</p>}
    {videoId && <div className="project-preview-media-editor__video"><img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt="영상 썸네일 미리보기" /><span>영상 미리보기 · 첫 번째</span></div>}
    <div className="project-preview-media-editor__list">{images.map((image, index) => <div className="project-preview-media-editor__item" key={image.id}><div className="project-preview-media-editor__item-heading"><strong>미리보기 이미지 {index + 1}</strong><div><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`미리보기 이미지 ${index + 1} 앞으로 이동`}>↑</button><button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label={`미리보기 이미지 ${index + 1} 뒤로 이동`}>↓</button></div></div><ProjectImageEditor slot="preview" imageId={image.id} projectKey={projectKey} currentUrl={image.url} onUploaded={url => update(image.id, url)} onRemove={() => remove(image.id)} /></div>)}</div>
    <button className="project-preview-media-editor__add" type="button" onClick={add}>+ 미리보기 이미지 추가</button>
  </div>;
}
