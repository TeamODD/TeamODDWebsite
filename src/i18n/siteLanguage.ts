import { useEffect, useState } from "react";
export type SiteLanguage = "ko" | "en";
const current = (): SiteLanguage => localStorage.getItem("teamodd-language") === "en" ? "en" : "ko";
export function setSiteLanguage(language:SiteLanguage){localStorage.setItem("teamodd-language",language);document.documentElement.lang=language;window.dispatchEvent(new Event("teamodd-language-change"));}
export function useSiteLanguage(){const [language,setLanguage]=useState<SiteLanguage>(current);useEffect(()=>{document.documentElement.lang=language;const sync=()=>setLanguage(current());window.addEventListener("teamodd-language-change",sync);return()=>window.removeEventListener("teamodd-language-change",sync)},[language]);return language;}
export function tr(language:SiteLanguage, korean:string, english:string){return language==="en"?english:korean;}
