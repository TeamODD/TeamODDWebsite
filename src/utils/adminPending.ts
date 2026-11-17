export type PendingPerson = {
  nickname?: string;
  realName?: string;
  loginId?: string;
  registrationIntent?: string;
  createdAt?: number;
};

export type PendingReview = {
  displayName: string;
  body: string;
  createdAt: number;
};

export type ReviewSubmissions = Record<string, Record<string, PendingReview>>;

export function getPendingCounts(
  reviews: ReviewSubmissions,
  users: Record<string, PendingPerson>,
  roles: Record<string, string>,
  applicationStatus: Record<string, string>,
) {
  const reviewCount = Object.values(reviews).reduce((total, entries) => total + Object.keys(entries || {}).length, 0);
  const memberCount = Object.entries(users).filter(([uid, person]) =>
    person.registrationIntent === "member" && roles[uid] !== "member" && !applicationStatus[uid],
  ).length;
  return { reviews: reviewCount, members: memberCount, total: reviewCount + memberCount };
}
