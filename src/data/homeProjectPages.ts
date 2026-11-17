export type HomeProjectTile = {
  projectId: number;
  column: number;
  row: number;
  columnSpan?: number;
  rowSpan?: number;
  tag?: {
    label: string;
    color: "gold" | "silver" | "bronze" | "blue" | "purple";
  };
};

export type HomeProjectPage = {
  id: string;
  columns: number;
  rows: number;
  projects: HomeProjectTile[];
};

// 페이지별 프로젝트와 배치를 여기서 정합니다. column/row는 1부터 시작합니다.
// columnSpan/rowSpan을 생략하면 한 칸을 차지합니다.
export const homeProjectPages: HomeProjectPage[] = [
  {
    id: "page-1",
    columns: 3,
    rows: 2,
    projects: [
      { projectId: 1789056836891, column: 1, row: 1, rowSpan: 2, tag: { label: "금색 예시", color: "gold" } },
      { projectId: 1789054743727, column: 2, row: 1, rowSpan: 2, tag: { label: "은색 예시", color: "silver" } },
      { projectId: 1788713722086, column: 3, row: 1, tag: { label: "동색 예시", color: "bronze" } },
      { projectId: 1788712223257, column: 3, row: 2, tag: { label: "파란색 예시", color: "blue" } },
    ],
  },
  {
    id: "page-2",
    columns: 2,
    rows: 2,
    projects: [
      { projectId: 1788706218578, column: 1, row: 1, tag: { label: "보라색 예시", color: "purple" } },
      { projectId: 1788702799957, column: 2, row: 1 },
      { projectId: 1783760230567, column: 1, row: 2 },
      { projectId: 1783759539168, column: 2, row: 2 },
    ],
  },
];
