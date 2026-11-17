import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "../firebase";
import { activityScore, participatedEvents, type ScoredEvent } from "../utils/activityScore";

export function useActivityScore(uid?: string) {
  const [events, setEvents] = useState<Record<string, ScoredEvent>>({});
  const [participation, setParticipation] = useState<Record<string, boolean>>({});
  const [currentSemester, setCurrentSemester] = useState("");

  useEffect(() => {
    const unsubscribe = onValue(ref(database, "events"), snapshot => setEvents(snapshot.val() || {}));
    return unsubscribe;
  }, []);

  useEffect(() => onValue(ref(database, "siteSettings/currentSemester"), snapshot => setCurrentSemester(typeof snapshot.val() === "string" ? snapshot.val() : "")), []);

  useEffect(() => {
    setParticipation({});
    if (!uid) return;
    const unsubscribe = onValue(
      ref(database, `eventParticipation/${uid}`),
      snapshot => setParticipation(snapshot.val() || {}),
      () => setParticipation({}),
    );
    return unsubscribe;
  }, [uid]);

  return {
    score: activityScore(events, participation, currentSemester || undefined),
    totalScore: activityScore(events, participation),
    currentSemester,
    events: participatedEvents(events, participation),
  };
}
