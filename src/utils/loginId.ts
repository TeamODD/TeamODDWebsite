export const normalizeLoginId = (value: string) => value.trim().toLowerCase();

export const isValidLoginId = (value: string) => /^[a-z0-9_-]{4,20}$/.test(value);

export const loginIdKey = (value: string) =>
  encodeURIComponent(normalizeLoginId(value)).replace(/\./g, "%2E");
