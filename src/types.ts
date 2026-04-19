export type TabId = "home" | "relations" | "case" | "social" | "profile";

export type CaseStatus = "invite" | "active" | "closed";

export type VirtueKey =
  | "observation"
  | "deduction"
  | "charisma"
  | "empathy"
  | "forensics"
  | "composure"
  | "stealth"
  | "intuition";

export interface StoryCase {
  id: string;
  title: string;
  sender: string;
  createdAt: number;
  status: CaseStatus;
  suspect: string;
  locations: string[];
  clueScheduleHours: number[];
  clueCountUnlocked: number;
  earliestSolveDay: number;
}

export interface DetectiveProfile {
  nickname: string;
  characterId: string;
  points: number;
  virtues: Record<VirtueKey, number>;
}

export interface CharacterOption {
  id: string;
  name: string;
  mood: string;
  passive: string;
}

export interface SceneHitbox {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetSceneId?: string;
  interaction?: "enter" | "inspect" | "talk";
}

export interface SceneDefinition {
  id: string;
  name: string;
  backgroundUrl: string;
  width: number;
  height: number;
  hitboxes: SceneHitbox[];
}
