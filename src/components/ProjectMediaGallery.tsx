import { useEffect, useMemo, useState } from "react";
import { FiPlay } from "react-icons/fi";
import type { Game } from "../types/game";
import { projectAssetUrl } from "../utils/projectAssetUrl";
import { youtubeVideoId } from "../utils/youtubeVideo";

type MediaItem = {kind: "video"; id: string} | {kind: "image"; url: string};

export default function ProjectMediaGallery({game}: {game: Game}) {
  const videoId = youtubeVideoId(game.previewYoutubeUrl);
  const items = useMemo<MediaItem[]>(() => [
    ...(videoId ? [{kind: "video" as const, id: videoId}] : []),
    ...(game.previewImages || []).filter(image => image.url).map(image => ({kind: "image" as const, url: image.url})),
    ...(!videoId && !(game.previewImages || []).some(image => image.url) && game.imageUrl ? [{kind: "image" as const, url: game.imageUrl}] : []),
  ], [game.previewImages, game.imageUrl, videoId]);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const selected = items[Math.min(active, items.length - 1)];

  useEffect(() => {
    if (items.length < 2 || playing) return;
    const timer = window.setTimeout(() => {setActive(index => (index + 1) % items.length); setPlaying(false);}, 5000);
    return () => window.clearTimeout(timer);
  }, [active, items.length, playing]);

  const select = (index: number) => {setActive(index); setPlaying(false);};
  const thumbnail = (item: MediaItem) => item.kind === "video" ? `https://img.youtube.com/vi/${item.id}/hqdefault.jpg` : projectAssetUrl(item.url);

  return <div className="project-library__detail-media">
    <div className="project-library__detail-image">
      {!selected ? <p className="project-library__media-empty">등록된 미리보기가 없습니다.</p> : selected.kind === "video" ? playing
        ? <iframe src={`https://www.youtube-nocookie.com/embed/${selected.id}?autoplay=1&rel=0`} title={`${game.title} 미리보기 영상`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        : <button type="button" className="project-library__video-poster" onClick={() => setPlaying(true)} aria-label={`${game.title} 미리보기 영상 재생`}><img src={thumbnail(selected)} alt="" /><span><FiPlay aria-hidden="true" /> 영상 재생</span></button>
        : <img src={thumbnail(selected)} alt={`${game.title} 미리보기 ${active + 1}`} />}
    </div>
    {items.length > 0 && <div className="project-library__detail-thumbnails" aria-label="미리보기 선택">
      {items.map((item, index) => <button key={item.kind === "video" ? `video-${item.id}` : `${item.url}-${index}`} type="button" className={index === active ? "is-active" : ""} aria-label={item.kind === "video" ? "영상 미리보기" : `이미지 미리보기 ${index + 1}`} aria-pressed={index === active} onClick={() => select(index)}><img src={thumbnail(item)} alt="" />{item.kind === "video" && <FiPlay aria-hidden="true" />}</button>)}
    </div>}
  </div>;
}
