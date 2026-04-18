export type TabId = "home" | "relations" | "case" | "social" | "profile";

export type CaseStatus = "invite" | "active" | "closed";

export type SkillKey = "deduction" | "charisma" | "forensics";

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
  skills: Record<SkillKey, number>;
}

export interface CharacterOption {
  id: string;
  name: string;
  mood: string;
  passive: string;
}
