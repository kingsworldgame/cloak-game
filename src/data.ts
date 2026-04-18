import type { CharacterOption, DetectiveProfile, StoryCase } from "./types";

const now = Date.now();

export const characters: CharacterOption[] = [
  {
    id: "noir",
    name: "Noir Vesper",
    mood: "Analitico, silencioso",
    passive: "+1 forensics em escolhas de pista"
  },
  {
    id: "iris",
    name: "Iris Vale",
    mood: "Social e intuitiva",
    passive: "+1 charisma em negociações"
  },
  {
    id: "atlas",
    name: "Atlas Crow",
    mood: "Frio e obstinado",
    passive: "+1 deduction em confronto final"
  }
];

export const initialProfile: DetectiveProfile = {
  nickname: "Detetive Sem Nome",
  characterId: "noir",
  points: 3,
  skills: {
    deduction: 1,
    charisma: 1,
    forensics: 1
  }
};

export const initialCases: StoryCase[] = [
  {
    id: "glass-letter",
    title: "A Carta no Vidro",
    sender: "Antonia Merel",
    createdAt: now - 1000 * 60 * 60 * 20,
    status: "invite",
    suspect: "Desconhecido",
    locations: ["Arquivo Central", "Cais Velho", "Conservatorio"],
    clueScheduleHours: [6, 18, 30, 45, 68, 96, 120],
    clueCountUnlocked: 0,
    earliestSolveDay: 3
  },
  {
    id: "ash-corridor",
    title: "Corredor de Cinzas",
    sender: "Delegado Lucio Dorn",
    createdAt: now - 1000 * 60 * 60 * 55,
    status: "active",
    suspect: "M. Calder",
    locations: ["Hotel Aurora", "Bar Cobalto", "Galeria Subsolo"],
    clueScheduleHours: [4, 12, 24, 40, 60, 84, 112],
    clueCountUnlocked: 0,
    earliestSolveDay: 4
  }
];

export const relationNotes = [
  "NPCs do Bar Alibi definem o tipo de caso que chega primeiro.",
  "Conexoes altas com Jornalistas ampliam casos urbanos.",
  "Conexoes altas com Medicos abrem trilhas forenses cedo."
];
