import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, database } from "../firebase";
import { ADMIN_UID } from "./admin";
import { isVerifiedAccount } from "./isVerifiedAccount";

export type AccountRole = "guest" | "general" | "member" | "admin";

export function useMemberRole() {
  const [user, authLoading] = useAuthState(auth);
  const [approved, setApproved] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    setApproved(false);
    if (!user || !isVerifiedAccount(user) || user.uid === ADMIN_UID) return;
    setRoleLoading(true);
    return onValue(ref(database, `roles/${user.uid}`), snapshot => {
      setApproved(snapshot.val() === "member");
      setRoleLoading(false);
    }, () => setRoleLoading(false));
  }, [user]);

  const role: AccountRole = user?.uid === ADMIN_UID ? "admin" : !isVerifiedAccount(user) ? "guest" : approved ? "member" : "general";
  return { user, role, loading: authLoading || roleLoading };
}
