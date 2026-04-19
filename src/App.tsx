import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  characterVirtuePreset,
  characters,
  CITY_SCENE_ID,
  defaultCaseScenes,
  initialCases,
  initialProfile,
  relationNotes,
  virtueLabels,
  worldPlaces
} from "./data";
import {
  loadCaseScenes,
  loadCases,
  loadProfile,
  saveCaseScenes,
  saveCases,
  saveProfile
} from "./storage";
import type { DetectiveProfile, SceneDefinition, SceneHitbox, StoryCase, TabId, VirtueKey } from "./types";
import logoImage from "./assets/logo.png";

const tabLabel: Record<TabId, string> = {
  home: "Escritorio",
  relations: "Mundo",
  case: "Cena",
  social: "Social",
  profile: "Perfil"
};

function buzz(strong = false): void {
  if (navigator.vibrate) navigator.vibrate(strong ? [24, 60, 24] : 14);
}

function hoursSince(ts: number): number {
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60));
}

function daysSince(ts: number): number {
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

function withUnlockedClues(storyCase: StoryCase): StoryCase {
  const elapsed = hoursSince(storyCase.createdAt);
  const unlocked = storyCase.clueScheduleHours.filter((h) => elapsed >= h).length;
  return { ...storyCase, clueCountUnlocked: unlocked };
}

function cloneScenes(): SceneDefinition[] {
  return defaultCaseScenes.map((scene) => ({
    ...scene,
    hitboxes: scene.hitboxes.map((hitbox) => ({ ...hitbox }))
  }));
}

function initialSceneMap(cases: StoryCase[]): Record<string, SceneDefinition[]> {
  return cases.reduce<Record<string, SceneDefinition[]>>((acc, storyCase) => {
    acc[storyCase.id] = cloneScenes();
    return acc;
  }, {});
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function d20Modifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function pointCostForVirtue(score: number): number {
  if (score >= 14) return 3;
  if (score >= 12) return 2;
  return 1;
}

function ensureProfile(raw: DetectiveProfile | null): DetectiveProfile {
  if (!raw) return initialProfile;
  if ("virtues" in raw && raw.virtues) return raw;
  const legacySkills = (raw as DetectiveProfile & { skills?: Partial<Record<VirtueKey, number>> }).skills;
  return {
    nickname: raw.nickname ?? initialProfile.nickname,
    characterId: raw.characterId ?? initialProfile.characterId,
    points: raw.points ?? initialProfile.points,
    virtues: {
      ...initialProfile.virtues,
      deduction: legacySkills?.deduction ?? initialProfile.virtues.deduction,
      charisma: legacySkills?.charisma ?? initialProfile.virtues.charisma,
      forensics: legacySkills?.forensics ?? initialProfile.virtues.forensics
    }
  };
}

const finalDecisionOptions = [
  { id: "delegacia", label: "Encaminhar para Delegacia", virtue: "deduction" as VirtueKey, dc: 13 },
  { id: "carta", label: "Enviar Carta Anonima", virtue: "stealth" as VirtueKey, dc: 14 },
  { id: "confronto", label: "Confronto Final Direto", virtue: "composure" as VirtueKey, dc: 15 },
  { id: "imprensa", label: "Vazar dossie para Imprensa", virtue: "charisma" as VirtueKey, dc: 13 }
];

export function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [tab, setTab] = useState<TabId>("home");
  const [cases, setCases] = useState<StoryCase[]>(() => loadCases() ?? initialCases);
  const [profile, setProfile] = useState(() => ensureProfile(loadProfile()));
  const [focusCaseId, setFocusCaseId] = useState<string | null>(null);
  const [caseScenes, setCaseScenes] = useState<Record<string, SceneDefinition[]>>(
    () => loadCaseScenes() ?? initialSceneMap(loadCases() ?? initialCases)
  );
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(CITY_SCENE_ID);
  const [sceneDevMode, setSceneDevMode] = useState(false);
  const [selectedHitboxId, setSelectedHitboxId] = useState<string | null>(null);
  const [sceneJsonDraft, setSceneJsonDraft] = useState("");
  const [sceneNotice, setSceneNotice] = useState("");
  const [cityZoom, setCityZoom] = useState(1.35);
  const [worldZoom, setWorldZoom] = useState(1.2);
  const [worldSelectedHitboxId, setWorldSelectedHitboxId] = useState<string | null>(null);
  const [caseResolutionChoice, setCaseResolutionChoice] = useState<Record<string, string>>({});
  const [caseResolutionRoll, setCaseResolutionRoll] = useState<Record<string, string>>({});

  useEffect(() => {
    const bootTimer = setTimeout(() => setIsBooting(false), 1200);
    return () => clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCases((prev) => prev.map(withUnlockedClues));
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCases((prev) => prev.map(withUnlockedClues));
  }, []);

  useEffect(() => saveCases(cases), [cases]);
  useEffect(() => saveProfile(profile), [profile]);
  useEffect(() => saveCaseScenes(caseScenes), [caseScenes]);

  useEffect(() => {
    setCaseScenes((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const storyCase of cases) {
        if (!next[storyCase.id]) {
          next[storyCase.id] = cloneScenes();
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cases]);

  const activeCases = useMemo(() => cases.filter((c) => c.status === "active"), [cases]);
  const inviteCases = useMemo(() => cases.filter((c) => c.status === "invite"), [cases]);
  const closedCases = useMemo(() => cases.filter((c) => c.status === "closed"), [cases]);

  const focusCase = useMemo(
    () => activeCases.find((c) => c.id === focusCaseId) ?? activeCases[0] ?? null,
    [activeCases, focusCaseId]
  );

  const scenes = useMemo(() => (focusCase ? caseScenes[focusCase.id] ?? [] : []), [caseScenes, focusCase]);
  const activeScene = useMemo(
    () => scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0] ?? null,
    [scenes, selectedSceneId]
  );
  const worldCityScene = useMemo(
    () => defaultCaseScenes.find((scene) => scene.id === CITY_SCENE_ID) ?? null,
    []
  );
  const selectedHitbox = useMemo(
    () => activeScene?.hitboxes.find((hitbox) => hitbox.id === selectedHitboxId) ?? null,
    [activeScene, selectedHitboxId]
  );

  useEffect(() => {
    if (!focusCase) {
      setSelectedSceneId(CITY_SCENE_ID);
      return;
    }
    setSelectedSceneId(CITY_SCENE_ID);
  }, [focusCase?.id]);

  useEffect(() => {
    if (!activeScene || !activeScene.hitboxes.some((hitbox) => hitbox.id === selectedHitboxId)) {
      setSelectedHitboxId(activeScene?.hitboxes[0]?.id ?? null);
    }
  }, [activeScene, selectedHitboxId]);

  function acceptCase(id: string) {
    buzz();
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "active", createdAt: Date.now() } : c))
    );
    setTab("case");
    setFocusCaseId(id);
    setSelectedSceneId(CITY_SCENE_ID);
  }

  function closeCase(id: string) {
    buzz(true);
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status: "closed" } : c)));
    setProfile((prev) => ({ ...prev, points: prev.points + 2 }));
  }

  function investPoint(virtue: VirtueKey) {
    const current = profile.virtues[virtue];
    const cost = pointCostForVirtue(current);
    if (profile.points < cost) return;
    buzz();
    setProfile((prev) => ({
      ...prev,
      points: prev.points - cost,
      virtues: { ...prev.virtues, [virtue]: prev.virtues[virtue] + 1 }
    }));
  }

  function runFinalDecisionRoll(caseId: string) {
    const decisionId = caseResolutionChoice[caseId];
    const decision = finalDecisionOptions.find((item) => item.id === decisionId);
    if (!decision) return;
    const die = Math.floor(Math.random() * 20) + 1;
    const mod = d20Modifier(profile.virtues[decision.virtue]);
    const total = die + mod;
    const result = total >= decision.dc ? "Sucesso no fechamento" : "Fechamento tenso";
    setCaseResolutionRoll((prev) => ({
      ...prev,
      [caseId]: `${decision.label}: d20(${die}) + mod(${mod}) = ${total} vs DC ${decision.dc} -> ${result}`
    }));
    buzz(total < decision.dc);
  }

  function updateActiveScene(updater: (scene: SceneDefinition) => SceneDefinition) {
    if (!focusCase || !activeScene) return;
    setCaseScenes((prev) => {
      const list = prev[focusCase.id] ?? [];
      const nextList = list.map((scene) => (scene.id === activeScene.id ? updater(scene) : scene));
      return { ...prev, [focusCase.id]: nextList };
    });
  }

  function updateHitbox(hitboxId: string, updater: (hitbox: SceneHitbox) => SceneHitbox) {
    updateActiveScene((scene) => ({
      ...scene,
      hitboxes: scene.hitboxes.map((hitbox) => (hitbox.id === hitboxId ? updater(hitbox) : hitbox))
    }));
  }

  function createHitbox() {
    if (!activeScene) return;
    const id = `hb-${Math.random().toString(36).slice(2, 8)}`;
    const newHitbox: SceneHitbox = {
      id,
      label: "Nova Interacao",
      x: Math.round(activeScene.width * 0.35),
      y: Math.round(activeScene.height * 0.35),
      width: Math.round(activeScene.width * 0.2),
      height: Math.round(activeScene.height * 0.2),
      interaction: "inspect"
    };
    updateActiveScene((scene) => ({ ...scene, hitboxes: [...scene.hitboxes, newHitbox] }));
    setSelectedHitboxId(id);
    buzz();
  }

  function removeSelectedHitbox() {
    if (!activeScene || !selectedHitbox) return;
    updateActiveScene((scene) => ({
      ...scene,
      hitboxes: scene.hitboxes.filter((hitbox) => hitbox.id !== selectedHitbox.id)
    }));
    setSelectedHitboxId(null);
    buzz();
  }

  async function copySceneJson() {
    if (!activeScene) return;
    const json = JSON.stringify(activeScene, null, 2);
    await navigator.clipboard.writeText(json);
    setSceneNotice("JSON da cena copiado.");
  }

  async function copyCityHitboxesJson() {
    if (!focusCase) return;
    const cityScene = (caseScenes[focusCase.id] ?? []).find((scene) => scene.id === CITY_SCENE_ID);
    if (!cityScene) return;
    const placesById = new Map(worldPlaces.map((place) => [place.id, place]));
    const classifyLayer = (yCenter: number): "upper" | "mid" | "lower" => {
      const ratio = yCenter / cityScene.height;
      if (ratio < 0.34) return "upper";
      if (ratio < 0.68) return "mid";
      return "lower";
    };

    const hitboxes = cityScene.hitboxes.map((hitbox) => {
      const place = hitbox.targetSceneId ? placesById.get(hitbox.targetSceneId) : undefined;
      const yCenter = hitbox.y + hitbox.height / 2;
      return {
        id: hitbox.id,
        label: hitbox.label,
        x: hitbox.x,
        y: hitbox.y,
        width: hitbox.width,
        height: hitbox.height,
        targetSceneId: hitbox.targetSceneId,
        layer: classifyLayer(yCenter),
        place: place
          ? {
              id: place.id,
              name: place.name,
              faction: place.faction,
              influence: place.influence,
              risk: place.risk,
              aftermathHint: place.aftermathHint
            }
          : null
      };
    });

    const payload = {
      version: "2.0.0",
      cityName: "Cloak - Cidade Vertical",
      exportedAt: new Date().toISOString(),
      scene: {
        id: cityScene.id,
        width: cityScene.width,
        height: cityScene.height,
        backgroundUrl: cityScene.backgroundUrl
      },
      layers: {
        upper: hitboxes.filter((hitbox) => hitbox.layer === "upper"),
        mid: hitboxes.filter((hitbox) => hitbox.layer === "mid"),
        lower: hitboxes.filter((hitbox) => hitbox.layer === "lower")
      },
      hitboxes
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setSceneNotice("JSON v2 da cidade copiado (com layers e metadados).");
  }

  function applySceneJson() {
    if (!activeScene || !focusCase || !sceneJsonDraft.trim()) return;
    try {
      const parsed = JSON.parse(sceneJsonDraft) as SceneDefinition;
      if (!parsed.id || !Array.isArray(parsed.hitboxes)) {
        setSceneNotice("JSON invalido.");
        return;
      }
      setCaseScenes((prev) => {
        const list = prev[focusCase.id] ?? [];
        const nextList = list.map((scene) => (scene.id === activeScene.id ? parsed : scene));
        return { ...prev, [focusCase.id]: nextList };
      });
      setSceneNotice("JSON aplicado.");
      setSelectedSceneId(parsed.id);
      setSceneJsonDraft("");
    } catch {
      setSceneNotice("JSON invalido.");
    }
  }

  function onHitboxPlay(hitbox: SceneHitbox) {
    if (sceneDevMode) return;
    if (hitbox.targetSceneId) {
      setSelectedSceneId(hitbox.targetSceneId);
      setSceneNotice(`Entrada: ${hitbox.label}.`);
      return;
    }
    setSceneNotice(`Interacao: ${hitbox.label}.`);
  }

  return (
    <div className="shell">
      {isBooting && (
        <div className="bootSplash">
          <img src={logoImage} alt="Cloak" className="bootLogo" />
          <p>Cloak</p>
        </div>
      )}
      <div className="ambient one" />
      <div className="ambient two" />
      <header className="top">
        <p className="sigil">
          <img src={logoImage} alt="Cloak logo" className="sigilLogo" />
          <span>Cloak</span>
        </p>
        <h1>A cidade nao dorme, ela confessa em fragmentos.</h1>
      </header>

      <main className="panel">
        {tab === "home" && (
          <section className="stack">
            <article className="card desk">
              <h2>Mesa do Detetive</h2>
              <img src={logoImage} alt="Cloak logo" className="homeLogo" />
              <p>
                Convites chegam em silencio. Aceite casos e navegue pela cidade vertical para abrir
                cada ambiente.
              </p>
            </article>

            <article className="card">
              <h3>Novos Convites</h3>
              {inviteCases.length === 0 && <p>Nenhum convite novo.</p>}
              {inviteCases.map((storyCase) => (
                <button key={storyCase.id} className="rowButton" onClick={() => acceptCase(storyCase.id)}>
                  <span>
                    <strong>{storyCase.title}</strong>
                    <small>{storyCase.sender}</small>
                  </span>
                  <em>Aceitar</em>
                </button>
              ))}
            </article>

            <article className="card">
              <h3>Casos Ativos</h3>
              {activeCases.length === 0 && <p>Voce ainda nao aceitou nenhum caso.</p>}
              {activeCases.map((storyCase) => (
                <button
                  key={storyCase.id}
                  className="rowButton"
                  onClick={() => {
                    buzz();
                    setFocusCaseId(storyCase.id);
                    setTab("case");
                    setSelectedSceneId(CITY_SCENE_ID);
                  }}
                >
                  <span>
                    <strong>{storyCase.title}</strong>
                    <small>{storyCase.clueCountUnlocked} pistas liberadas</small>
                  </span>
                  <em>Entrar</em>
                </button>
              ))}
            </article>

            <article className="card">
              <h3>Casos Encerrados</h3>
              <p>{closedCases.length} resolvidos. Pontos ganhos ecoam no seu perfil.</p>
            </article>
          </section>
        )}

        {tab === "relations" && (
          <section className="stack">
            <article className="card">
              <h2>Mundo e Conexoes</h2>
              <p>
                Mapa oficial da cidade: moldura como borda fixa e mapa dentro, com zoom e arraste
                interno.
              </p>
            </article>

            {worldCityScene && (
              <article className="card">
                <label className="field">
                  Zoom do mapa ({worldZoom.toFixed(2)}x)
                  <input
                    type="range"
                    min={1}
                    max={2.2}
                    step={0.05}
                    value={worldZoom}
                    onChange={(e) => setWorldZoom(Number(e.target.value))}
                  />
                </label>

                <SceneStage
                  scene={worldCityScene}
                  devMode={false}
                  selectedHitboxId={worldSelectedHitboxId}
                  onSelectHitbox={setWorldSelectedHitboxId}
                  onHitboxPlay={(hitbox) => {
                    if (!hitbox.targetSceneId) return;
                    setTab("case");
                    setSelectedSceneId(hitbox.targetSceneId);
                    if (!focusCase && activeCases[0]) setFocusCaseId(activeCases[0].id);
                  }}
                  onUpdateHitbox={() => {}}
                  zoom={worldZoom}
                />
              </article>
            )}

            {relationNotes.map((note) => (
              <article key={note} className="card muted">
                <p>{note}</p>
              </article>
            ))}
          </section>
        )}

        {tab === "case" && (
          <section className="stack">
            {!focusCase && (
              <article className="card">
                <h2>Cena do Caso</h2>
                <p>Aceite um caso na Home para entrar na cidade.</p>
              </article>
            )}

            {focusCase && (
              <>
                <article className="card full">
                  <h2>{focusCase.title}</h2>
                  <p>Tempo real: {daysSince(focusCase.createdAt)} dias desde a abertura.</p>
                  <p>
                    Pistas liberadas: {focusCase.clueCountUnlocked}/{focusCase.clueScheduleHours.length}
                  </p>
                </article>

                <article className="card">
                  <h3>Cidade e Ambientes</h3>
                  <div className="sceneTopbar">
                    <div className="pillRow">
                      <button className="miniPill" onClick={() => setSelectedSceneId(CITY_SCENE_ID)}>
                        Voltar para Cidade
                      </button>
                      <span className="sceneTag">{activeScene?.name}</span>
                    </div>
                    <button
                      className={`miniPill ${sceneDevMode ? "active" : ""}`}
                      onClick={() => setSceneDevMode((prev) => !prev)}
                    >
                      Modo Dev {sceneDevMode ? "ON" : "OFF"}
                    </button>
                  </div>

                  {activeScene?.id === CITY_SCENE_ID && (
                    <label className="field">
                      Zoom da cidade ({cityZoom.toFixed(2)}x)
                      <input
                        type="range"
                        min={1}
                        max={2.2}
                        step={0.05}
                        value={cityZoom}
                        onChange={(e) => setCityZoom(Number(e.target.value))}
                      />
                    </label>
                  )}

                  {activeScene && (
                    <SceneStage
                      scene={activeScene}
                      devMode={sceneDevMode}
                      selectedHitboxId={selectedHitboxId}
                      onSelectHitbox={setSelectedHitboxId}
                      onHitboxPlay={onHitboxPlay}
                      onUpdateHitbox={(id, patch) => {
                        updateHitbox(id, (previous) => ({ ...previous, ...patch }));
                      }}
                      zoom={activeScene.id === CITY_SCENE_ID ? cityZoom : 1}
                    />
                  )}
                  {sceneNotice && <p className="tiny">{sceneNotice}</p>}
                </article>

                {sceneDevMode && activeScene && (
                  <article className="card">
                    <h3>Editor de Hitbox (px)</h3>
                    <label className="field">
                      Background PNG/JPG URL
                      <input
                        value={activeScene.backgroundUrl}
                        onChange={(e) => {
                          const nextUrl = e.target.value;
                          updateActiveScene((scene) => ({ ...scene, backgroundUrl: nextUrl }));
                        }}
                        placeholder="https://..."
                      />
                    </label>
                    <div className="editorRow">
                      <button className="miniPill" onClick={createHitbox}>
                        + Hitbox
                      </button>
                      <button className="miniPill danger" onClick={removeSelectedHitbox}>
                        - Hitbox Selecionada
                      </button>
                      <button className="miniPill" onClick={copySceneJson}>
                        Copiar JSON
                      </button>
                      {activeScene.id === CITY_SCENE_ID && (
                        <button className="miniPill" onClick={copyCityHitboxesJson}>
                          Exportar JSON Hitboxes Cidade
                        </button>
                      )}
                    </div>

                    {selectedHitbox && (
                      <div className="hitboxForm">
                        <label className="field">
                          Label
                          <input
                            value={selectedHitbox.label}
                            onChange={(e) => {
                              const label = e.target.value;
                              updateHitbox(selectedHitbox.id, (hitbox) => ({ ...hitbox, label }));
                            }}
                          />
                        </label>
                        <label className="field">
                          Ir para cena (id opcional)
                          <input
                            value={selectedHitbox.targetSceneId ?? ""}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              updateHitbox(selectedHitbox.id, (hitbox) => ({
                                ...hitbox,
                                targetSceneId: value || undefined
                              }));
                            }}
                            placeholder="hotel-aurora"
                          />
                        </label>
                        <div className="coordGrid">
                          {(["x", "y", "width", "height"] as const).map((field) => (
                            <label key={field} className="field">
                              {field}
                              <input
                                type="number"
                                value={selectedHitbox[field]}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  updateHitbox(selectedHitbox.id, (hitbox) => ({
                                    ...hitbox,
                                    [field]: Number.isFinite(value) ? value : 0
                                  }));
                                }}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <label className="field">
                      Colar JSON da cena para aplicar
                      <textarea
                        className="jsonArea"
                        value={sceneJsonDraft}
                        onChange={(e) => setSceneJsonDraft(e.target.value)}
                      />
                    </label>
                    <button className="miniPill" onClick={applySceneJson}>
                      Aplicar JSON
                    </button>
                  </article>
                )}

                <article className="card">
                  <h3>Conclusao do Caso (decisoes finais)</h3>
                  <p>
                    Decisoes aparecem apenas no fechamento. O caso pode encerrar a partir do dia{" "}
                    {focusCase.earliestSolveDay}.
                  </p>
                  <div className="choiceGrid">
                    {finalDecisionOptions.map((option) => (
                      <button
                        key={option.id}
                        className={`choice ${caseResolutionChoice[focusCase.id] === option.id ? "active" : ""}`}
                        onClick={() =>
                          setCaseResolutionChoice((prev) => ({
                            ...prev,
                            [focusCase.id]: option.id
                          }))
                        }
                      >
                        {option.label} ({virtueLabels[option.virtue]} | DC {option.dc})
                      </button>
                    ))}
                  </div>
                  <div className="editorRow">
                    <button
                      className="miniPill"
                      disabled={!caseResolutionChoice[focusCase.id]}
                      onClick={() => runFinalDecisionRoll(focusCase.id)}
                    >
                      Rolar d20 da conclusao
                    </button>
                    <button
                      className="primary"
                      disabled={
                        daysSince(focusCase.createdAt) < focusCase.earliestSolveDay ||
                        !caseResolutionChoice[focusCase.id]
                      }
                      onClick={() => closeCase(focusCase.id)}
                    >
                      Encerrar Caso
                    </button>
                  </div>
                  {caseResolutionRoll[focusCase.id] && <p className="tiny">{caseResolutionRoll[focusCase.id]}</p>}
                </article>
              </>
            )}
          </section>
        )}

        {tab === "social" && (
          <section className="stack">
            <article className="card">
              <h2>Social</h2>
              <p>Placeholder ativo. Mantido para futura expansao comunitaria.</p>
            </article>
          </section>
        )}

        {tab === "profile" && (
          <section className="stack">
            <article className="card">
              <h2>Perfil do Detetive</h2>
              <label className="field">
                Nickname
                <input
                  value={profile.nickname}
                  onChange={(e) => setProfile((prev) => ({ ...prev, nickname: e.target.value }))}
                />
              </label>
              <p>Pontos disponiveis: {profile.points}</p>
            </article>

            <article className="card">
              <h3>Personagens</h3>
              <div className="choiceGrid">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    className={`choice ${profile.characterId === char.id ? "active" : ""}`}
                    onClick={() => {
                      buzz();
                      setProfile((prev) => ({
                        ...prev,
                        characterId: char.id,
                        virtues: {
                          ...initialProfile.virtues,
                          ...characterVirtuePreset[char.id]
                        }
                      }));
                    }}
                  >
                    <strong>{char.name}</strong>
                    <small>{char.mood}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className="card">
              <h3>Virtudes (escala d20)</h3>
              <div className="stats">
                {(Object.keys(profile.virtues) as VirtueKey[]).map((virtue) => {
                  const score = profile.virtues[virtue];
                  const mod = d20Modifier(score);
                  const cost = pointCostForVirtue(score);
                  return (
                    <button key={virtue} className="stat" onClick={() => investPoint(virtue)}>
                      {virtueLabels[virtue]}: {score} (mod {mod >= 0 ? `+${mod}` : mod}) | custo {cost}
                    </button>
                  );
                })}
              </div>
            </article>
          </section>
        )}
      </main>

      <nav className="tabs">
        {(["home", "relations", "case", "social", "profile"] as TabId[]).map((id) => (
          <button
            key={id}
            className={tab === id ? "tab active" : "tab"}
            onClick={() => {
              buzz();
              setTab(id);
            }}
          >
            {tabLabel[id]}
          </button>
        ))}
      </nav>
    </div>
  );
}

interface SceneStageProps {
  scene: SceneDefinition;
  devMode: boolean;
  selectedHitboxId: string | null;
  onSelectHitbox: (id: string) => void;
  onHitboxPlay: (hitbox: SceneHitbox) => void;
  onUpdateHitbox: (id: string, patch: Partial<SceneHitbox>) => void;
  zoom: number;
}

interface DragState {
  hitboxId: string;
  mode: "move" | "resize";
  pointerId: number;
  startSceneX: number;
  startSceneY: number;
  origin: SceneHitbox;
}

function SceneStage({
  scene,
  devMode,
  selectedHitboxId,
  onSelectHitbox,
  onHitboxPlay,
  onUpdateHitbox,
  zoom
}: SceneStageProps) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const frameViewportRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pan, setPan] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (!drag || !areaRef.current) return;
      const areaRect = areaRef.current.getBoundingClientRect();
      const sceneX = ((event.clientX - areaRect.left) / areaRect.width) * scene.width;
      const sceneY = ((event.clientY - areaRect.top) / areaRect.height) * scene.height;
      const dx = sceneX - drag.startSceneX;
      const dy = sceneY - drag.startSceneY;

      if (drag.mode === "move") {
        const x = clamp(drag.origin.x + dx, 0, scene.width - drag.origin.width);
        const y = clamp(drag.origin.y + dy, 0, scene.height - drag.origin.height);
        onUpdateHitbox(drag.hitboxId, { x: Math.round(x), y: Math.round(y) });
        return;
      }

      const width = clamp(drag.origin.width + dx, 24, scene.width - drag.origin.x);
      const height = clamp(drag.origin.height + dy, 24, scene.height - drag.origin.y);
      onUpdateHitbox(drag.hitboxId, { width: Math.round(width), height: Math.round(height) });
    }

    function onPointerUp(event: PointerEvent) {
      if (drag && event.pointerId === drag.pointerId) {
        setDrag(null);
      }
      if (pan && event.pointerId === pan.pointerId) {
        setPan(null);
      }
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, onUpdateHitbox, pan, scene.height, scene.width]);

  function startDrag(event: ReactPointerEvent, hitbox: SceneHitbox, mode: "move" | "resize") {
    if (!devMode || !areaRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const areaRect = areaRef.current.getBoundingClientRect();
    const sceneX = ((event.clientX - areaRect.left) / areaRect.width) * scene.width;
    const sceneY = ((event.clientY - areaRect.top) / areaRect.height) * scene.height;
    setDrag({
      hitboxId: hitbox.id,
      mode,
      pointerId: event.pointerId,
      startSceneX: sceneX,
      startSceneY: sceneY,
      origin: { ...hitbox }
    });
    onSelectHitbox(hitbox.id);
  }

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (!scene.frameUrl || zoom <= 1) return;
    if (!frameViewportRef.current) return;
    const target = event.target as HTMLElement;
    if (target.closest(".hitbox")) return;
    event.preventDefault();
    setPan({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: frameViewportRef.current.scrollLeft,
      startScrollTop: frameViewportRef.current.scrollTop
    });
  }

  function movePan(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pan || !frameViewportRef.current || event.pointerId !== pan.pointerId) return;
    const dx = event.clientX - pan.startX;
    const dy = event.clientY - pan.startY;
    frameViewportRef.current.scrollLeft = pan.startScrollLeft - dx;
    frameViewportRef.current.scrollTop = pan.startScrollTop - dy;
  }

  const canvas = (
    <div
      ref={areaRef}
      className={scene.frameUrl ? "sceneArea framedMap" : "sceneArea"}
      style={{
        aspectRatio: `${scene.width} / ${scene.height}`,
        backgroundImage: `linear-gradient(rgba(8, 8, 8, 0.3), rgba(8, 8, 8, 0.45)), url(${scene.backgroundUrl})`,
        transform: `scale(${zoom})`,
        transformOrigin: "top center"
      }}
    >
      {scene.hitboxes.map((hitbox) => {
        const isSelected = selectedHitboxId === hitbox.id;
        return (
          <button
            key={hitbox.id}
            className={`hitbox ${isSelected ? "selected" : ""} ${devMode ? "dev" : ""}`}
            style={{
              left: `${(hitbox.x / scene.width) * 100}%`,
              top: `${(hitbox.y / scene.height) * 100}%`,
              width: `${(hitbox.width / scene.width) * 100}%`,
              height: `${(hitbox.height / scene.height) * 100}%`
            }}
            onPointerDown={(event) => startDrag(event, hitbox, "move")}
            onClick={() => {
              onSelectHitbox(hitbox.id);
              onHitboxPlay(hitbox);
            }}
          >
            <span>{hitbox.label}</span>
            {devMode && (
              <i
                className="resizeKnob"
                onPointerDown={(event) => startDrag(event, hitbox, "resize")}
              />
            )}
          </button>
        );
      })}
    </div>
  );

  if (!scene.frameUrl) {
    return <div className={zoom > 1 ? "sceneScroll" : ""}>{canvas}</div>;
  }

  return (
    <div className={zoom > 1 ? "sceneScroll" : ""}>
      <div className="frameShell" style={{ backgroundImage: `url(${scene.frameUrl})` }}>
        <div
          ref={frameViewportRef}
          className={pan ? "frameViewport panning" : "frameViewport"}
          onPointerDown={startPan}
          onPointerMove={movePan}
          onPointerUp={() => setPan(null)}
          onPointerLeave={() => setPan(null)}
        >
          {canvas}
        </div>
      </div>
    </div>
  );
}
