import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: {sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void}) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { scriptPromise = null; reject(new Error("Turnstile unavailable")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function TurnstileChallenge({onToken}: {onToken: (token: string) => void}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let widgetId: string | undefined;
    const setup = async () => {
      try {
        const response = await fetch("/api/reviews", {cache: "no-store"});
        if (!response.ok) throw new Error("Turnstile config unavailable");
        const {siteKey} = await response.json() as {siteKey?: string};
        if (!siteKey) throw new Error("Turnstile site key missing");
        await loadScript();
        if (!active || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onToken,
          "expired-callback": () => onToken(""),
          "error-callback": () => { onToken(""); setError(true); },
        });
      } catch { if (active) setError(true); }
    };
    void setup();
    return () => { active = false; if (widgetId) window.turnstile?.remove(widgetId); onToken(""); };
  }, [onToken]);

  return <div className="project-review-turnstile"><div ref={containerRef} />{error && <p role="alert">자동 제출 방지 확인을 불러오지 못했습니다. 새로고침해 주세요.</p>}</div>;
}
