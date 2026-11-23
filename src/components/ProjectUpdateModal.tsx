import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import type { Game } from "../types/game";
import type { ProjectUpdate } from "../utils/projectUpdates";
import { projectAssetUrl } from "../utils/projectAssetUrl";
import "../styles/ProjectUpdateModal.css";

export default function ProjectUpdateModal({updates, initialIndex, game, onClose}: {updates: ProjectUpdate[]; initialIndex: number; game: Game; onClose: () => void}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const active = updates[activeIndex];
  const moveTo = (index: number, behavior: ScrollBehavior = "smooth") => {
    const container = scrollRef.current;
    const target = itemRefs.current[index];
    if (!container || !target) return;
    setActiveIndex(index);
    container.scrollTo({top: target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop, behavior});
  };
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const mainPane = document.querySelector<HTMLElement>(".project-library__main");
    const previousMainOverflow = mainPane?.style.overflow;
    document.body.style.overflow = "hidden";
    if (mainPane) mainPane.style.overflow = "hidden";
    closeRef.current?.focus();
    const frame = requestAnimationFrame(() => moveTo(initialIndex, "auto"));
    return () => {cancelAnimationFrame(frame); document.body.style.overflow = previousOverflow; if (mainPane) mainPane.style.overflow = previousMainOverflow || "";};
  }, [initialIndex]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowUp" && activeIndex > 0) {event.preventDefault(); moveTo(activeIndex - 1);}
      if (event.key === "ArrowDown" && activeIndex < updates.length - 1) {event.preventDefault(); moveTo(activeIndex + 1);}
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, onClose, updates.length]);
  const syncActive = () => {
    const container = scrollRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    let nearest = 0;
    let distance = Infinity;
    itemRefs.current.forEach((item, index) => {
      if (!item) return;
      const nextDistance = Math.abs(item.getBoundingClientRect().top - top);
      if (nextDistance < distance) {distance = nextDistance; nearest = index;}
    });
    setActiveIndex(current => current === nearest ? current : nearest);
  };
  return createPortal(<div className="project-update-modal" onMouseDown={event => {if (event.target === event.currentTarget) onClose();}}>
    <div className="project-update-modal__layout">
      <div className="project-update-modal__controls" aria-label="업데이트 이동">
        <button type="button" ref={closeRef} onClick={onClose} aria-label="닫기"><FiX aria-hidden="true" /></button>
        <button type="button" onClick={() => moveTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="다음 최신 업데이트"><FiChevronUp aria-hidden="true" /></button>
        <button type="button" onClick={() => moveTo(activeIndex + 1)} disabled={activeIndex === updates.length - 1} aria-label="이전 업데이트"><FiChevronDown aria-hidden="true" /></button>
        <span>{activeIndex + 1} / {updates.length}</span>
      </div>
      <div className="project-update-modal__panel" role="dialog" aria-modal="true" aria-label={`${game.title} 업데이트 및 공지`}>
        <div className="project-update-modal__scroll" ref={scrollRef} onScroll={syncActive}>
          {updates.map((update, index) => <article className="project-update-modal__item" ref={element => {itemRefs.current[index] = element;}} key={`${update.date || ""}-${update.title}-${index}`}>
            <header><small>{game.title} · 업데이트 및 공지{update.date ? ` · ${update.date}` : ""}</small><h2>{update.title}</h2></header>
            <div className="project-update-modal__content"><img src={projectAssetUrl(update.imageUrl || game.imageUrl)} alt="업데이트 배너" /><p className="project-update-modal__summary">{update.summary || update.title}</p>{update.detail && <div className="project-update-modal__detail">{update.detail}</div>}</div>
          </article>)}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">{active?.title}</span>
    </div>
  </div>, document.body);
}
