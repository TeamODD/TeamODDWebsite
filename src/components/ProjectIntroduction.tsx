import { useLayoutEffect, useRef, useState } from "react";
import { FiFolder } from "react-icons/fi";

export default function ProjectIntroduction({text}: {text: string}) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const paragraph = textRef.current;
    const sidePanels = section?.closest(".project-library__detail")?.querySelector<HTMLElement>(".project-library__side-panels");
    const awards = sidePanels?.querySelector<HTMLElement>(".project-library__side-panel--awards");
    const reference = awards || sidePanels?.lastElementChild as HTMLElement | null;
    if (!section || !paragraph || !reference) return;

    const measure = () => {
      if (window.matchMedia("(max-width: 1100px)").matches) { setLimit(null); return; }
      const available = reference.getBoundingClientRect().bottom - section.getBoundingClientRect().top;
      const natural = paragraph.scrollHeight + 43 + 15 + 4;
      const overflow = natural - available;
      setLimit(overflow > (awards ? 120 : 220) ? Math.max(80, Math.floor(available - 43 - 15 - 4 - 48)) : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paragraph);
    observer.observe(reference);
    if (section.parentElement) observer.observe(section.parentElement);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [text]);

  const collapsed = limit !== null && !expanded;
  return <section ref={sectionRef} className={`project-library__detail-more${collapsed ? " project-library__detail-more--collapsed" : ""}`}>
    <h2><FiFolder aria-hidden="true" />프로젝트 소개</h2>
    <div className="project-library__intro-content" style={collapsed ? {maxHeight: limit} : undefined}><p ref={textRef}>{text}</p></div>
    {collapsed && <button className="project-library__intro-expand" type="button" onClick={() => setExpanded(true)}>프로젝트 소개 펼치기 <span aria-hidden="true">⌄</span></button>}
  </section>;
}
