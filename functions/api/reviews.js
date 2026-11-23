const FIREBASE_API_KEY = "AIzaSyDen_kuwZqYXxlaeyzwt1Rb8S2ytpEA-nE";
const DATABASE_URL = "https://team-odd-default-rtdb.asia-southeast1.firebasedatabase.app";
const encoder = new TextEncoder();
let cachedToken;

const respond = (body, status = 200) => Response.json(body, {status, headers: {"Cache-Control": "no-store"}});
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function getIdentity(idToken) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({idToken}),
  });
  if (!response.ok) return null;
  return (await response.json()).users?.[0] || null;
}

async function getDatabaseToken(secret) {
  if (cachedToken?.expiresAt > Date.now() + 60000) return cachedToken.value;
  const account = JSON.parse(secret);
  if (!account.client_email || !account.private_key || account.project_id !== "team-odd") throw new Error("Invalid database service account");
  const pem = account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const keyBytes = Uint8Array.from(atob(pem), character => character.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", keyBytes, {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"}, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(encoder.encode(JSON.stringify({alg: "RS256", typ: "JWT"})));
  const payload = base64url(encoder.encode(JSON.stringify({iss: account.client_email, scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.database", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600})));
  const unsigned = `${header}.${payload}`;
  const signature = base64url(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(unsigned))));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}`}),
  });
  if (!response.ok) throw new Error("Database authentication failed");
  const result = await response.json();
  cachedToken = {value: result.access_token, expiresAt: Date.now() + Math.min(result.expires_in || 3600, 3600) * 1000};
  return cachedToken.value;
}

async function databaseRequest(path, accessToken, options = {}) {
  return fetch(`${DATABASE_URL}/${path}.json`, {...options, headers: {Authorization: `Bearer ${accessToken}`, ...options.headers}});
}

async function verifyTurnstile(token, secret, request) {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({secret, response: token, remoteip: request.headers.get("CF-Connecting-IP") || ""}),
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && result.hostname === new URL(request.url).hostname;
}

async function ipHash(ip, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), "HMAC", false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(ip)));
  return Array.from(signature, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function takeAnonymousQuota(ip, gameKey, secret, accessToken) {
  if (!ip) return false;
  const path = `reviewRateLimits/${await ipHash(ip, secret)}`;
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await databaseRequest(path, accessToken, {headers: {"X-Firebase-ETag": "true"}});
    if (!current.ok) throw new Error("Rate limit read failed");
    const etag = current.headers.get("ETag");
    if (!etag) throw new Error("Rate limit ETag missing");
    const previous = await current.json() || {};
    const sameDay = previous.day === day;
    const total = sameDay ? Number(previous.total) || 0 : 0;
    const projectCounts = sameDay && previous.projectCounts && typeof previous.projectCounts === "object" ? previous.projectCounts : {};
    const projectCount = Number(projectCounts[gameKey]) || 0;
    if (total >= 10 || projectCount >= 3 || (sameDay && now - (Number(previous.lastAt) || 0) < 60000)) return false;
    const next = {day, total: total + 1, lastAt: now, projectCounts: {...projectCounts, [gameKey]: projectCount + 1}};
    const written = await databaseRequest(path, accessToken, {method: "PUT", headers: {"Content-Type": "application/json", "if-match": etag}, body: JSON.stringify(next)});
    if (written.ok) return true;
    if (written.status !== 412) throw new Error("Rate limit write failed");
  }
  return false;
}

export function onRequestGet({env}) {
  return respond({siteKey: env.TURNSTILE_SITE_KEY || ""});
}

export async function onRequestPost({request, env}) {
  if (!env.TURNSTILE_SECRET_KEY || !env.REVIEW_FIREBASE_SERVICE_ACCOUNT) return respond({error: "평가 접수가 준비되지 않았습니다."}, 503);
  const idToken = request.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!idToken) return respond({error: "로그인이 필요합니다."}, 401);
  const identity = await getIdentity(idToken);
  if (!identity?.localId) return respond({error: "로그인 정보를 확인하지 못했습니다."}, 401);
  let input;
  try {
    const text = await request.text();
    if (text.length > 8192) return respond({error: "평가 내용이 너무 깁니다."}, 413);
    input = JSON.parse(text);
  } catch { return respond({error: "요청 형식이 올바르지 않습니다."}, 400); }
  const gameKey = input?.gameKey;
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (typeof gameKey !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(gameKey) || body.length < 5 || body.length > 1000) return respond({error: "평가 내용을 확인해 주세요."}, 400);
  const anonymous = !identity.emailVerified;
  if (anonymous && !(await verifyTurnstile(input.turnstileToken, env.TURNSTILE_SECRET_KEY, request))) return respond({error: "자동 제출 방지 확인에 실패했습니다. 다시 시도해 주세요."}, 403);
  try {
    const accessToken = await getDatabaseToken(env.REVIEW_FIREBASE_SERVICE_ACCOUNT);
    const [policyResponse, roleResponse, nicknameResponse] = await Promise.all([
      databaseRequest(`games/${gameKey}/reviewPolicy`, accessToken),
      databaseRequest(`roles/${identity.localId}`, accessToken),
      databaseRequest(`users/${identity.localId}/nickname`, accessToken),
    ]);
    if (!policyResponse.ok || !roleResponse.ok || !nicknameResponse.ok) throw new Error("Review policy lookup failed");
    const policy = await policyResponse.json();
    const role = await roleResponse.json();
    const nickname = await nicknameResponse.json();
    const allowed = policy === "everyone" || (identity.emailVerified && (policy === "account" || (policy === "member" && (role === "member" || identity.localId === "mh9sU0TjlbNNmlOeWlXJB59OUSh1"))));
    if (!allowed) return respond({error: "이 프로젝트의 평가 작성 권한이 없습니다."}, 403);
    if (anonymous && !(await takeAnonymousQuota(request.headers.get("CF-Connecting-IP"), gameKey, env.TURNSTILE_SECRET_KEY, accessToken))) return respond({error: "익명 평가 요청이 많습니다. 잠시 후 다시 시도해 주세요."}, 429);
    const displayName = typeof nickname === "string" && nickname.trim() ? nickname.trim() : "익명";
    const saved = await databaseRequest(`reviewSubmissions/${gameKey}/${identity.localId}`, accessToken, {
      method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({displayName, body, createdAt: Date.now()}),
    });
    if (!saved.ok) throw new Error("Review write failed");
    return respond({ok: true});
  } catch {
    return respond({error: "평가를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요."}, 502);
  }
}
