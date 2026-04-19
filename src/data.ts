import type {
  CharacterOption,
  DetectiveProfile,
  SceneDefinition,
  StoryCase,
  VirtueKey
} from "./types";

const now = Date.now();

export const CITY_SCENE_ID = "city-vertical";

export interface WorldPlace {
  id: string;
  name: string;
  faction: string;
  influence: number;
  risk: "baixo" | "medio" | "alto";
  aftermathHint: string;
  sceneBackgroundUrl: string;
  box: { x: number; y: number; width: number; height: number };
}

export const worldPlaces: WorldPlace[] = [
  {
    id: "farol-antigo",
    name: "Farol Antigo",
    faction: "Guardas Costeiros",
    influence: 62,
    risk: "medio",
    aftermathHint: "Neblina e holofote quebrado",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    box: { x: 490, y: 90, width: 220, height: 140 }
  },
  {
    id: "cemiterio-colina",
    name: "Cemiterio da Colina",
    faction: "Igreja Velha",
    influence: 51,
    risk: "medio",
    aftermathHint: "Flores queimadas e barro fresco",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1545156521-77bd85671d30?auto=format&fit=crop&w=1400&q=80",
    box: { x: 220, y: 250, width: 270, height: 130 }
  },
  {
    id: "hospital-santa-vela",
    name: "Hospital Santa Vela",
    faction: "Ordem Medica",
    influence: 68,
    risk: "baixo",
    aftermathHint: "Corredor isolado e faixa de pericia",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1400&q=80",
    box: { x: 780, y: 260, width: 300, height: 145 }
  },
  {
    id: "delegacia-central",
    name: "Delegacia Central",
    faction: "Policia Civil",
    influence: 74,
    risk: "baixo",
    aftermathHint: "Quadro de suspeitos atualizado",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1400&q=80",
    box: { x: 130, y: 470, width: 280, height: 145 }
  },
  {
    id: "forum-justica",
    name: "Forum da Justica",
    faction: "Magistratura",
    influence: 57,
    risk: "medio",
    aftermathHint: "Processo lacrado no arquivo",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=1400&q=80",
    box: { x: 470, y: 470, width: 300, height: 145 }
  },
  {
    id: "arquivo-municipal",
    name: "Arquivo Municipal",
    faction: "Funcionarios Publicos",
    influence: 46,
    risk: "baixo",
    aftermathHint: "Prateleira vazia e lacre rompido",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1400&q=80",
    box: { x: 840, y: 470, width: 240, height: 145 }
  },
  {
    id: "catedral-ruinas",
    name: "Catedral em Ruinas",
    faction: "Confraria dos Sinos",
    influence: 42,
    risk: "alto",
    aftermathHint: "Vitral partido e vela apagada",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?auto=format&fit=crop&w=1400&q=80",
    box: { x: 130, y: 700, width: 320, height: 155 }
  },
  {
    id: "hotel-aurora",
    name: "Hotel Aurora",
    faction: "Consorcio Hoteleiro",
    influence: 70,
    risk: "medio",
    aftermathHint: "Suite selada e camareira sumida",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
    box: { x: 520, y: 700, width: 260, height: 155 }
  },
  {
    id: "bar-alibi",
    name: "Bar Alibi",
    faction: "Informantes Livres",
    influence: 78,
    risk: "alto",
    aftermathHint: "Copos quebrados e jukebox muda",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1400&q=80",
    box: { x: 840, y: 700, width: 250, height: 155 }
  },
  {
    id: "mercado-noturno",
    name: "Mercado Noturno",
    faction: "Feirantes",
    influence: 55,
    risk: "alto",
    aftermathHint: "Bancas reviradas e luzes falhando",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=1400&q=80",
    box: { x: 150, y: 945, width: 300, height: 170 }
  },
  {
    id: "estacao-central",
    name: "Estacao Central",
    faction: "Companhia Ferroviaria",
    influence: 64,
    risk: "medio",
    aftermathHint: "Plataforma interditada",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1400&q=80",
    box: { x: 500, y: 955, width: 280, height: 170 }
  },
  {
    id: "galeria-subsolo",
    name: "Galeria Subsolo",
    faction: "Colecionadores",
    influence: 59,
    risk: "alto",
    aftermathHint: "Quadro trocado por falsificacao",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80",
    box: { x: 840, y: 955, width: 260, height: 170 }
  },
  {
    id: "docas-porto",
    name: "Docas do Porto",
    faction: "Sindicato Naval",
    influence: 66,
    risk: "alto",
    aftermathHint: "Container aberto e marcas de luta",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=1400&q=80",
    box: { x: 130, y: 1220, width: 320, height: 180 }
  },
  {
    id: "usina-desativada",
    name: "Usina Desativada",
    faction: "Catadores",
    influence: 40,
    risk: "alto",
    aftermathHint: "Sala de controle com circuito queimado",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1400&q=80",
    box: { x: 520, y: 1230, width: 290, height: 180 }
  },
  {
    id: "beco-lanternas",
    name: "Beco das Lanternas",
    faction: "Rede Sombria",
    influence: 72,
    risk: "alto",
    aftermathHint: "Lanternas apagadas em sequencia",
    sceneBackgroundUrl:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1400&q=80",
    box: { x: 860, y: 1230, width: 250, height: 180 }
  }
];

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
    passive: "+1 charisma em negociacoes"
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
  points: 4,
  virtues: {
    observation: 10,
    deduction: 10,
    charisma: 10,
    empathy: 10,
    forensics: 10,
    composure: 10,
    stealth: 10,
    intuition: 10
  }
};

export const virtueLabels: Record<VirtueKey, string> = {
  observation: "Observacao",
  deduction: "Deducao",
  charisma: "Labia",
  empathy: "Empatia",
  forensics: "Forense",
  composure: "Sangue-Frio",
  stealth: "Furtividade",
  intuition: "Intuicao"
};

export const characterVirtuePreset: Record<string, Partial<Record<VirtueKey, number>>> = {
  noir: { forensics: 11, deduction: 11, charisma: 9, empathy: 9 },
  iris: { charisma: 11, empathy: 11, stealth: 9, composure: 9 },
  atlas: { composure: 11, intuition: 11, charisma: 9, observation: 9 }
};

export const initialCases: StoryCase[] = [
  {
    id: "glass-letter",
    title: "A Carta no Vidro",
    sender: "Antonia Merel",
    createdAt: now - 1000 * 60 * 60 * 20,
    status: "invite",
    suspect: "Desconhecido",
    locations: ["Arquivo Municipal", "Hotel Aurora", "Docas do Porto"],
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
    locations: ["Bar Alibi", "Galeria Subsolo", "Beco das Lanternas"],
    clueScheduleHours: [4, 12, 24, 40, 60, 84, 112],
    clueCountUnlocked: 0,
    earliestSolveDay: 4
  }
];

export const relationNotes = [
  "As conexoes do Mundo alteram quais casos chegam na Home.",
  "Cada lugar da cidade pertence a uma faccao com nivel de influencia.",
  "Aftermath muda a imagem do lugar, nao o mapa base da cidade."
];

export const defaultCaseScenes: SceneDefinition[] = [
  {
    id: CITY_SCENE_ID,
    name: "Cidade Vertical",
    backgroundUrl:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80",
    width: 1200,
    height: 2200,
    hitboxes: worldPlaces.map((place) => ({
      id: `hb-city-${place.id}`,
      label: place.name,
      x: place.box.x,
      y: place.box.y,
      width: place.box.width,
      height: place.box.height,
      targetSceneId: place.id,
      interaction: "enter"
    }))
  },
  ...worldPlaces.map<SceneDefinition>((place) => ({
    id: place.id,
    name: place.name,
    backgroundUrl: place.sceneBackgroundUrl,
    width: 1600,
    height: 900,
    hitboxes: [
      {
        id: `hb-place-${place.id}-return`,
        label: "Voltar para Cidade",
        x: 50,
        y: 250,
        width: 220,
        height: 500,
        targetSceneId: CITY_SCENE_ID,
        interaction: "enter"
      },
      {
        id: `hb-place-${place.id}-aftermath`,
        label: `Aftermath: ${place.aftermathHint}`,
        x: 980,
        y: 220,
        width: 460,
        height: 280,
        interaction: "inspect"
      }
    ]
  }))
];
