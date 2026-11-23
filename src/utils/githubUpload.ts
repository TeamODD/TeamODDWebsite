import type { User } from "firebase/auth";

export async function uploadToGitHub(user: User, file: Blob, options: {kind: "avatar" | "project"; name: string; projectKey?: string; imageSlot?: "main" | "icon" | "cover" | `preview-${string}`; previousUrl?: string}) {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      "Content-Type": file.type || "application/octet-stream",
      "X-Upload-Kind": options.kind,
      "X-File-Name": encodeURIComponent(options.name),
      ...(options.projectKey ? {"X-Project-Key": options.projectKey} : {}),
      ...(options.imageSlot ? {"X-Image-Slot": options.imageSlot} : {}),
      ...(options.previousUrl ? {"X-Previous-Url": encodeURIComponent(options.previousUrl)} : {}),
    },
    body: file,
  });
  const result = await response.json().catch(() => ({})) as {url?: string; error?: string};
  if (!response.ok || !result.url) throw new Error(result.error || "업로드에 실패했습니다.");
  return result.url;
}

export async function cleanupReplacedProjectImage(user: User, projectKey: string, imageSlot: "main" | "icon" | "cover" | `preview-${string}`, previousUrl: string) {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      "X-Upload-Kind": "project-cleanup",
      "X-Project-Key": projectKey,
      "X-Image-Slot": imageSlot,
      "X-Previous-Url": encodeURIComponent(previousUrl),
    },
  });
  if (!response.ok) throw new Error("이전 이미지 파일을 정리하지 못했습니다.");
}
