import type { DetectiveProfile, StoryCase } from "./types";
import type { SceneDefinition } from "./types";

const CASES_KEY = "cloak_cases";
const PROFILE_KEY = "cloak_profile";
const SCENES_KEY = "cloak_case_scenes";

export function saveCases(cases: StoryCase[]): void {
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}

export function loadCases(): StoryCase[] | null {
  const raw = localStorage.getItem(CASES_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoryCase[];
  } catch {
    return null;
  }
}

export function saveProfile(profile: DetectiveProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): DetectiveProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DetectiveProfile;
  } catch {
    return null;
  }
}

export function saveCaseScenes(sceneMap: Record<string, SceneDefinition[]>): void {
  localStorage.setItem(SCENES_KEY, JSON.stringify(sceneMap));
}

export function loadCaseScenes(): Record<string, SceneDefinition[]> | null {
  const raw = localStorage.getItem(SCENES_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, SceneDefinition[]>;
  } catch {
    return null;
  }
}
