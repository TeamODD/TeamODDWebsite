export function youtubeVideoId(raw?: string) {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    let id = "";
    if (host === "youtu.be" || host === "www.youtu.be") id = url.pathname.slice(1).split("/")[0];
    else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else if (/^\/(shorts|embed|live)\//.test(url.pathname)) id = url.pathname.split("/")[2] || "";
    }
    return /^https:$/.test(url.protocol) && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
  } catch { return ""; }
}
