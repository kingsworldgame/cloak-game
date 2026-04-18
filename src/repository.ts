import { supabase } from "./supabase";
import type { DetectiveProfile, StoryCase } from "./types";

export async function pushCases(userId: string, cases: StoryCase[]): Promise<void> {
  if (!supabase) return;
  const payload = cases.map((storyCase) => ({
    user_id: userId,
    case_id: storyCase.id,
    title: storyCase.title,
    sender: storyCase.sender,
    status: storyCase.status,
    suspect: storyCase.suspect,
    locations: storyCase.locations,
    clue_schedule_hours: storyCase.clueScheduleHours,
    clue_count_unlocked: storyCase.clueCountUnlocked,
    earliest_solve_day: storyCase.earliestSolveDay,
    created_at_ms: storyCase.createdAt
  }));

  const { error } = await supabase.from("player_cases").upsert(payload, {
    onConflict: "user_id,case_id"
  });
  if (error) throw error;
}

export async function pushProfile(userId: string, profile: DetectiveProfile): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("profiles").upsert({
    user_id: userId,
    nickname: profile.nickname,
    character_id: profile.characterId,
    points: profile.points,
    deduction: profile.skills.deduction,
    charisma: profile.skills.charisma,
    forensics: profile.skills.forensics
  });
  if (error) throw error;
}
