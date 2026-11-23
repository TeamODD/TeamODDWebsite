const FLAGS: Record<string, string> = {
  "한국어": "kr", "영어": "us", "일본어": "jp", "중국어": "cn", "중국어 간체": "cn", "중국어 번체": "tw",
  "프랑스어": "fr", "독일어": "de", "스페인어": "es", "포르투갈어": "pt", "브라질 포르투갈어": "br",
  "러시아어": "ru", "이탈리아어": "it", "아랍어": "sa", "힌디어": "in", "태국어": "th", "베트남어": "vn",
  "인도네시아어": "id", "튀르키예어": "tr", "터키어": "tr", "네덜란드어": "nl", "폴란드어": "pl",
  "스웨덴어": "se", "노르웨이어": "no", "덴마크어": "dk", "핀란드어": "fi", "우크라이나어": "ua",
};

export const languageFlag = (language: string) => FLAGS[language.trim()] || "";
