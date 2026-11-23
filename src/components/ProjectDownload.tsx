import { FiChevronDown, FiDownload, FiExternalLink, FiPlay } from "react-icons/fi";
import type { Game } from "../types/game";
import { sortProjectVersions, versionActionLabel } from "../utils/projectVersions";

const isWebUrl = (value: string) => /^https?:\/\//i.test(value);

export default function ProjectDownload({ game }: { game: Game }) {
  const versions = sortProjectVersions((game.versions || []).filter(version => version.label.trim() && isWebUrl(version.url)));
  const choices: NonNullable<Game["versions"]> = versions.length ? versions : game.link && isWebUrl(game.link) ? [{ label: "기본 버전", url: game.link }] : [];
  const latest = choices[0];
  if (!latest) return null;

  return <section className="project-library__download">
    <div className="project-library__download-title"><FiDownload aria-hidden="true" /><div><span>PROJECT DOWNLOAD</span><h2>{game.title}</h2></div></div>
    <div className="project-library__download-actions">
      <a className="project-library__download-primary" href={latest.url} target="_blank" rel="noopener noreferrer">{latest.action === "store" ? <FiExternalLink aria-hidden="true" /> : latest.action === "play" ? <FiPlay aria-hidden="true" /> : <FiDownload aria-hidden="true" />} {versionActionLabel(latest.action)}</a>
      {choices.length > 1 && <details className="project-library__download-versions"><summary aria-label="버전 선택" title="버전 선택"><FiChevronDown aria-hidden="true" /></summary><div className="project-library__download-menu"><strong>버전 선택</strong>{choices.map((version, index) => <a href={version.url} target="_blank" rel="noopener noreferrer" key={`${version.label}-${index}`}><span>{version.label}<small>{versionActionLabel(version.action)}</small></span>{index === 0 && <small>최신</small>}</a>)}</div></details>}
    </div>
  </section>;
}
