import { useEffect, useMemo, useState } from "react";
import { characters, initialCases, initialProfile, relationNotes } from "./data";
import { loadCases, loadProfile, saveCases, saveProfile } from "./storage";
import type { SkillKey, StoryCase, TabId } from "./types";

const tabLabel: Record<TabId, string> = {
  home: "Escritorio",
  relations: "Relacoes",
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

export function App() {
  const [tab, setTab] = useState<TabId>("home");
  const [cases, setCases] = useState<StoryCase[]>(() => loadCases() ?? initialCases);
  const [profile, setProfile] = useState(() => loadProfile() ?? initialProfile);
  const [focusCaseId, setFocusCaseId] = useState<string | null>(null);

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

  const activeCases = useMemo(() => cases.filter((c) => c.status === "active"), [cases]);
  const inviteCases = useMemo(() => cases.filter((c) => c.status === "invite"), [cases]);
  const closedCases = useMemo(() => cases.filter((c) => c.status === "closed"), [cases]);

  const focusCase = useMemo(
    () => activeCases.find((c) => c.id === focusCaseId) ?? activeCases[0] ?? null,
    [activeCases, focusCaseId]
  );

  function acceptCase(id: string) {
    buzz();
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "active", createdAt: Date.now() } : c))
    );
    setTab("case");
    setFocusCaseId(id);
  }

  function closeCase(id: string) {
    buzz(true);
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status: "closed" } : c)));
    setProfile((prev) => ({ ...prev, points: prev.points + 2 }));
  }

  function investPoint(skill: SkillKey) {
    if (profile.points <= 0) return;
    buzz();
    setProfile((prev) => ({
      ...prev,
      points: prev.points - 1,
      skills: { ...prev.skills, [skill]: prev.skills[skill] + 1 }
    }));
  }

  return (
    <div className="shell">
      <div className="ambient one" />
      <div className="ambient two" />
      <header className="top">
        <p className="sigil">Cloak</p>
        <h1>A cidade nao dorme, ela confessa em fragmentos.</h1>
      </header>

      <main className="panel">
        {tab === "home" && (
          <section className="stack">
            <article className="card desk">
              <h2>Mesa do Detetive</h2>
              <p>
                Convites chegam em silencio. Alguns te chamam por nome. Outros testam sua fome
                por verdade.
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
              <h2>Central de Relacoes</h2>
              <p>Bar Alibi: onde o crime vira rumor e rumor vira oportunidade.</p>
            </article>

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
                <p>Aceite um caso na Home para entrar na cena.</p>
              </article>
            )}

            {focusCase && (
              <>
                <article className="card full">
                  <h2>{focusCase.title}</h2>
                  <p>
                    Tempo real correndo: {daysSince(focusCase.createdAt)} dias desde a abertura.
                  </p>
                  <p>
                    Pistas liberadas: {focusCase.clueCountUnlocked}/{focusCase.clueScheduleHours.length}
                  </p>
                </article>

                <article className="card">
                  <h3>Slide de Decisao (RPG)</h3>
                  <div className="choiceGrid">
                    <button className="choice" onClick={() => buzz()}>
                      Revisar documentos (Deduction {profile.skills.deduction})
                    </button>
                    <button className="choice" onClick={() => buzz()}>
                      Interrogar contato (Charisma {profile.skills.charisma})
                    </button>
                    <button className="choice" onClick={() => buzz()}>
                      Examinar vestigios (Forensics {profile.skills.forensics})
                    </button>
                  </div>
                  <p className="tiny">
                    A implementacao narrativa detalhada de pistas/cena foi preservada para a proxima
                    fase, como combinado.
                  </p>
                </article>

                <article className="card">
                  <h3>Encerramento</h3>
                  <p>
                    O caso pode ser concluido a partir do dia {focusCase.earliestSolveDay}. Antes
                    disso, encerramento fica bloqueado.
                  </p>
                  <button
                    className="primary"
                    disabled={daysSince(focusCase.createdAt) < focusCase.earliestSolveDay}
                    onClick={() => closeCase(focusCase.id)}
                  >
                    Entregar Resultado (Delegacia/Carta)
                  </button>
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
                      setProfile((prev) => ({ ...prev, characterId: char.id }));
                    }}
                  >
                    <strong>{char.name}</strong>
                    <small>{char.mood}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className="card">
              <h3>Stats</h3>
              <div className="stats">
                <button className="stat" onClick={() => investPoint("deduction")}>
                  Deduction: {profile.skills.deduction}
                </button>
                <button className="stat" onClick={() => investPoint("charisma")}>
                  Charisma: {profile.skills.charisma}
                </button>
                <button className="stat" onClick={() => investPoint("forensics")}>
                  Forensics: {profile.skills.forensics}
                </button>
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
