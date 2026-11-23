export type ProjectApplication = {
  title: string;
  description: string;
  applicantName: string;
  createdAt: number;
};

export type ProjectApplications = Record<string, ProjectApplication>;
