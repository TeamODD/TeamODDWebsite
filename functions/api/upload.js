const OWNER = "TeamODD";
const REPO = "TeamODDWebsite";
const UPLOAD_BRANCH = "uploads";
const ADMIN_UID = "mh9sU0TjlbNNmlOeWlXJB59OUSh1";
const FIREBASE_API_KEY = "AIzaSyDen_kuwZqYXxlaeyzwt1Rb8S2ytpEA-nE";
const DATABASE_URL = "https://team-odd-default-rtdb.asia-southeast1.firebasedatabase.app";
const MAX_BYTES = 10 * 1024 * 1024;

const reply = (body, status) => Response.json(body, {status, headers: {"Cache-Control": "no-store"}});

async function getIdentity(idToken) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({idToken}),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.users?.[0] || null;
}

async function canEditProject(identity, idToken, projectKey) {
  const uid = identity.localId;
  if (uid === ADMIN_UID) return true;
  if (!identity.emailVerified) return false;
  if (!projectKey || !/^[a-zA-Z0-9_-]{1,100}$/.test(projectKey)) return false;
  const auth = `?auth=${encodeURIComponent(idToken)}`;
  const [roleResponse, memberResponse] = await Promise.all([
    fetch(`${DATABASE_URL}/roles/${encodeURIComponent(uid)}.json${auth}`),
    fetch(`${DATABASE_URL}/gameMembers/${encodeURIComponent(projectKey)}/${encodeURIComponent(uid)}.json${auth}`),
  ]);
  return roleResponse.ok && memberResponse.ok && await roleResponse.json() === "member" && await memberResponse.json() === true;
}

function toBase64(bytes) {
  let result = "";
  for (let index = 0; index < bytes.length; index += 8192) {
    result += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  return btoa(result);
}

async function ensureUploadBranch(headers) {
  const branch = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/ref/heads/${UPLOAD_BRANCH}`, {headers});
  if (branch.ok) return true;
  if (branch.status !== 404) return false;
  const source = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/ref/heads/main`, {headers});
  if (!source.ok) return false;
  const sha = (await source.json()).object?.sha;
  if (!sha) return false;
  const created = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs`, {
    method: "POST", headers, body: JSON.stringify({ref: `refs/heads/${UPLOAD_BRANCH}`, sha}),
  });
  return created.ok || created.status === 422;
}

export async function onRequestPost({request, env}) {
  if (!env.GITHUB_UPLOAD_TOKEN) return reply({error: "업로드 서버가 아직 설정되지 않았습니다."}, 503);
  const idToken = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!idToken) return reply({error: "로그인이 필요합니다."}, 401);
  const identity = await getIdentity(idToken);
  if (!identity?.localId) return reply({error: "로그인 정보를 확인하지 못했습니다."}, 401);
  const kind = request.headers.get("X-Upload-Kind");
  if (kind !== "avatar" && kind !== "project" && kind !== "project-cleanup") return reply({error: "업로드 종류가 올바르지 않습니다."}, 400);
  if (kind === "avatar" && (!identity.email || !identity.emailVerified)) return reply({error: "이메일 인증을 마친 계정만 프로필 이미지를 업로드할 수 있습니다."}, 403);
  const projectKey = request.headers.get("X-Project-Key");
  if ((kind === "project" || kind === "project-cleanup") && (!projectKey || !/^[a-zA-Z0-9_-]{1,100}$/.test(projectKey) || !(await canEditProject(identity, idToken, projectKey)))) {
    return reply({error: "이 프로젝트의 업로드 권한이 없습니다."}, 403);
  }
  const imageSlot = request.headers.get("X-Image-Slot");
  if (imageSlot && ((kind !== "project" && kind !== "project-cleanup") || !(["main", "icon", "cover"].includes(imageSlot) || /^preview-[a-f0-9]{12}$/.test(imageSlot)))) return reply({error: "이미지 종류가 올바르지 않습니다."}, 400);
  if (kind === "project-cleanup") {
    if (!imageSlot) return reply({error: "이미지 종류가 필요합니다."}, 400);
    let previousUrl = "";
    try { previousUrl = decodeURIComponent(request.headers.get("X-Previous-Url") || ""); } catch { return reply({error: "이전 파일 주소가 올바르지 않습니다."}, 400); }
    const previous = previousUrl.match(/^https:\/\/raw\.githubusercontent\.com\/TeamODD\/TeamODDWebsite\/uploads\/(public\/uploads\/projects\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)(?:\?v=[a-zA-Z0-9]+)?$/);
    if (!previous) return reply({skipped: true}, 200);
    const isPreview = imageSlot.startsWith("preview-");
    const field = isPreview ? "previewImages" : {main: "imageUrl", icon: "iconUrl", cover: "coverUrl"}[imageSlot];
    const saved = await fetch(`${DATABASE_URL}/games/${encodeURIComponent(projectKey)}/${field}.json?auth=${encodeURIComponent(idToken)}`);
    if (!saved.ok) return reply({error: "저장된 이미지를 확인하지 못했습니다."}, 502);
    const savedUrl = await saved.json();
    if (isPreview) {
      if ((savedUrl !== null && !Array.isArray(savedUrl)) || (savedUrl || []).some(item => item.url === previousUrl) || previous[1] !== `public/uploads/projects/${projectKey}/${imageSlot}.webp`) return reply({error: "새 이미지 목록이 저장된 뒤에 정리할 수 있습니다."}, 409);
    } else {
      if (savedUrl === previousUrl || (savedUrl !== null && savedUrl !== "" && !String(savedUrl).startsWith(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${UPLOAD_BRANCH}/public/uploads/projects/${projectKey}/${imageSlot}.webp?v=`)) || ((savedUrl === null || savedUrl === "") && imageSlot === "main")) return reply({error: "새 이미지가 저장된 뒤에 정리할 수 있습니다."}, 409);
      if (previous[1] === `public/uploads/projects/${projectKey}/${imageSlot}.webp`) return reply({skipped: true}, 200);
    }
    const allGames = await fetch(`${DATABASE_URL}/games.json?auth=${encodeURIComponent(idToken)}`);
    if (!allGames.ok) return reply({error: "이미지 사용 여부를 확인하지 못했습니다."}, 502);
    if (Object.values(await allGames.json() || {}).some(game => [game.imageUrl, game.iconUrl, game.coverUrl, ...(game.previewImages || []).map(image => image.url), ...(game.updates || []).map(update => update.imageUrl)].includes(previousUrl))) return reply({skipped: true}, 200);
    const headers = {Accept: "application/vnd.github+json", Authorization: `Bearer ${env.GITHUB_UPLOAD_TOKEN}`, "Content-Type": "application/json", "User-Agent": "TeamODD-Upload", "X-GitHub-Api-Version": "2022-11-28"};
    const endpoint = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${previous[1]}`;
    const existing = await fetch(`${endpoint}?ref=${UPLOAD_BRANCH}`, {headers});
    if (existing.status === 404) return reply({skipped: true}, 200);
    if (!existing.ok) return reply({error: "이전 파일을 확인하지 못했습니다."}, 502);
    const sha = (await existing.json()).sha;
    const removed = await fetch(endpoint, {method: "DELETE", headers, body: JSON.stringify({message: `Replace project ${imageSlot} for ${projectKey}`, branch: UPLOAD_BRANCH, sha})});
    if (!removed.ok) return reply({error: "이전 파일을 삭제하지 못했습니다."}, 502);
    return reply({removed: true}, 200);
  }
  const type = request.headers.get("Content-Type")?.split(";")[0] || "";
  if (kind === "avatar" && type !== "image/jpeg") return reply({error: "프로필 이미지는 JPG 형식이어야 합니다."}, 400);
  if (imageSlot && type !== "image/webp") return reply({error: "프로젝트 이미지는 WebP 형식이어야 합니다."}, 400);
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_BYTES) return reply({error: "파일 크기는 10MB 이하여야 합니다."}, 413);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES) return reply({error: "파일 크기는 10MB 이하여야 합니다."}, 413);
  if (kind === "avatar" && !(bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9)) return reply({error: "올바른 JPG 이미지가 아닙니다."}, 400);
  if (imageSlot && !(bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP")) return reply({error: "올바른 WebP 이미지가 아닙니다."}, 400);
  let name;
  try { name = decodeURIComponent(request.headers.get("X-File-Name") || "file"); }
  catch { return reply({error: "파일 이름이 올바르지 않습니다."}, 400); }
  name = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
  if (kind === "avatar") name = "avatar.jpg";
  const path = kind === "avatar"
    ? `public/uploads/avatars/${identity.localId}/${name}`
    : imageSlot ? `public/uploads/projects/${projectKey}/${imageSlot}.webp` : `public/uploads/projects/${identity.localId}/${crypto.randomUUID()}-${name}`;
  const endpoint = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const headers = {Accept: "application/vnd.github+json", Authorization: `Bearer ${env.GITHUB_UPLOAD_TOKEN}`, "Content-Type": "application/json", "User-Agent": "TeamODD-Upload", "X-GitHub-Api-Version": "2022-11-28"};
  if (!(await ensureUploadBranch(headers))) return reply({error: "GitHub 업로드 브랜치를 준비하지 못했습니다. 토큰 권한을 확인해 주세요."}, 502);
  let sha;
  if (kind === "avatar" || imageSlot) {
    const existing = await fetch(`${endpoint}?ref=${UPLOAD_BRANCH}`, {headers});
    if (existing.ok) sha = (await existing.json()).sha;
    else if (existing.status !== 404) return reply({error: "기존 파일을 확인하지 못했습니다."}, 502);
  }
  const uploaded = await fetch(endpoint, {method: "PUT", headers, body: JSON.stringify({message: `Upload ${kind} for ${identity.localId}`, branch: UPLOAD_BRANCH, content: toBase64(bytes), ...(sha ? {sha} : {})})});
  if (!uploaded.ok) return reply({error: `GitHub 업로드 실패 (${uploaded.status}). 토큰 권한을 확인해 주세요.`}, 502);
  const version = (await uploaded.json()).content?.sha?.slice(0, 12) || Date.now();
  return reply({url: `https://raw.githubusercontent.com/${OWNER}/${REPO}/${UPLOAD_BRANCH}/${path}?v=${version}`}, 200);
}
