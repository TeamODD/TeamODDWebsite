import type { User } from "firebase/auth";
import { ADMIN_UID } from "./admin";

export const isVerifiedAccount = (user: User | null | undefined): user is User =>
  !!user && (user.emailVerified || user.uid === ADMIN_UID);
