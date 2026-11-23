export const MID_DESCRIPTION_MAX_LENGTH = 120;

export const normalizeProjectLineBreaks = (value: string) => value.replace(/\/n/g, "\n").replace(/\r\n?/g, "\n");
export const singleLineDescription = (value: string) => normalizeProjectLineBreaks(value).replace(/\s*\n\s*/g, " ").replace(/[\t ]+/g, " ").trim();

export const previewDescription = (value: string) => {
  const plainText = normalizeProjectLineBreaks(value).trim();
  return plainText.length > MID_DESCRIPTION_MAX_LENGTH
    ? `${plainText.slice(0, MID_DESCRIPTION_MAX_LENGTH).trimEnd()}…`
    : plainText;
};
