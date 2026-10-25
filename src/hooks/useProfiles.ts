import { useSyncExternalStore } from "react";
import { getProfilesState, subscribeProfiles } from "../profiles";

export function useProfiles() {
  const { profiles, activeId } = useSyncExternalStore(subscribeProfiles, getProfilesState);
  const active = profiles.find((p) => p.id === activeId) ?? null;
  return { profiles, active, activeId };
}
