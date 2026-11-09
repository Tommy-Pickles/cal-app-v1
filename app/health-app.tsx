"use client";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  LayoutDashboard,
  Mic,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
  ChefHat,
  ArrowRight,
  Download,
} from "lucide-react";
import {
  categories,
  defaultProfile,
  emptyState,
  energy,
  localDate,
  proteinLevels,
  recipeItem,
  searchFoods,
  targetCalories,
  targets,
  total,
  validQuantity,
  portionLabel,
  type Item,
  type Meal,
  type Profile,
  type State,
} from "../lib/nutrition";
const uid = () => crypto.randomUUID();
const round = (v: number) => Math.round(v * 10) / 10;
async function api(path: string, options?: RequestInit) {
  const r = await fetch(path, options);
  const d: any = await r.json();
  if (!r.ok) throw Error(d.error || "Unable to connect. Please try again.");
  return d;
}
export default function HealthApp() {
  const [data, setData] = useState<State>(emptyState),
    [version, setVersion] = useState(0),
    [loaded, setLoaded] = useState(false),
    [aiReady, setAiReady] = useState(false),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [view, setView] = useState("Today"),
    [date, setDate] = useState(localDate()),
    [modal, setModal] = useState(""),
    [mode, setMode] = useState("type"),
    [toast, setToast] = useState("");
  const [pendingMeal, setPendingMeal] = useState<Meal | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    api("/api/state")
      .then((d) => {
        setData(d.state);
        setVersion(d.version);
        setAiReady(d.aiReady);
        if (!d.state.profile) setModal("profile");
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function commit(next: State) {
    if (lock.current) return false;
    lock.current = true;
    setSaving(true);
    setError("");
    try {
      const r = await api("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: next, version }),
      });
      setData(next);
      setVersion(r.version);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  function openFood(m = "type") {
    setMode(m);
    setModal("food");
  }
  const goal = data.profile ? targets(data.profile) : targets(defaultProfile);
  const entries = data.entries.filter((e) => e.date === date);
  const consumed = total(entries.flatMap((e) => e.items));
  const isToday = date === localDate();
  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const shortDate = new Date(date + "T12:00:00").toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  function changeDate(amount: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + amount);
    setDate(localDate(d));
  }
  async function addEntry(
    items: Item[],
    category: string,
    name: string,
    saveMeal: boolean,
  ) {
    const next = {
      ...data,
      entries: [...data.entries, { id: uid(), date, category, name, items }],
    };
    if (await commit(next)) {
      setModal("");
      setToast("Added to your diary");
      if (saveMeal) {
        setPendingMeal({ id: uid(), name, category, items });
        setModal("saveMeal");
      }
    }
  }
  const nav = [
    { name: "Today", icon: LayoutDashboard },
    { name: "My meals", icon: BookOpen },
    { name: "Recipes", icon: ChefHat },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          Hawkes<span>Health Helper</span>
        </a>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              key={n.name}
              aria-current={view === n.name ? "page" : undefined}
              className={view === n.name ? "nav-item selected" : "nav-item"}
              onClick={() => setView(n.name)}
            >
              <n.icon size={21} />
              <span>{n.name === "My meals" ? "Meals" : n.name}</span>
            </button>
          ))}
        </nav>
        <button
          className="mobile-add"
          disabled={!loaded}
          aria-label={view === "Recipes" ? "Create recipe" : "Add food"}
          onClick={() => (view === "Recipes" ? setModal("recipe") : openFood())}
        >
          <Plus size={26} />
        </button>
        <button
          className="desktop-settings nav-item"
          disabled={!loaded}
          onClick={() => setModal("settings")}
        >
          <Settings2 size={20} />
          <span>Settings</span>
        </button>
      </aside>
      <main>
        <header className="topbar">
          <span>Hawkes Health Helper</span>
          <button
            className="settings-button"
            disabled={!loaded}
            aria-label="Settings"
            onClick={() => setModal("settings")}
          >
            <Settings2 size={21} />
          </button>
        </header>
        <div className="main-content">
          {error && (
            <div className="error" role="alert">
              {error}
              {!loaded && (
                <button onClick={() => location.reload()}>Retry</button>
              )}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={18} />
              </button>
            </div>
          )}
          {!loaded ? (
            <div className="loading">Loading diary…</div>
          ) : (
            <>
              <div className="page-heading">
                <h1>
                  {view === "Today"
                    ? isToday
                      ? "Today"
                      : "Diary"
                    : view === "My meals"
                      ? "Meals"
                      : "Recipes"}
                </h1>
                <button
                  className="primary desktop-add"
                  onClick={() =>
                    view === "Recipes" ? setModal("recipe") : openFood()
                  }
                >
                  <Plus size={19} />
                  {view === "Recipes" ? "New recipe" : "Add food"}
                </button>
              </div>
              {view === "Today" ? (
                <>
                  <div className="day-row">
                    <div className="date-control">
                      <button
                        aria-label="Previous day"
                        onClick={() => changeDate(-1)}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <label>
                        <input
                          aria-label="Diary date"
                          type="date"
                          value={date}
                          max={localDate()}
                          onChange={(e) =>
                            e.target.value && setDate(e.target.value)
                          }
                        />
                        <span className="date-long">{displayDate}</span>
                        <span className="date-short">{shortDate}</span>
                      </label>
                      <button
                        aria-label="Next day"
                        disabled={isToday}
                        onClick={() => changeDate(1)}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <div className="unit-toggle" aria-label="Energy units">
                      {(["kcal", "kJ"] as const).map((u) => (
                        <button
                          aria-pressed={data.unit === u}
                          key={u}
                          className={data.unit === u ? "active" : ""}
                          disabled={saving}
                          onClick={() => commit({ ...data, unit: u })}
                        >
                          {u === "kcal" ? "cal" : u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <section className="overview" aria-label="Daily nutrition">
                    <div className="energy-top">
                      <div>
                        <span className="metric-label">Energy</span>
                        <div className="energy-value">
                          <strong>{energy(consumed.kcal, data.unit)}</strong>
                          <span>
                            / {energy(goal.kcal, data.unit)}{" "}
                            {data.unit === "kcal" ? "cal" : "kJ"}
                          </span>
                        </div>
                      </div>
                      <div className="energy-remaining">
                        <strong>
                          {energy(
                            Math.abs(goal.kcal - consumed.kcal),
                            data.unit,
                          )}
                        </strong>
                        <span>
                          {consumed.kcal > goal.kcal
                            ? "above goal"
                            : "remaining"}
                        </span>
                      </div>
                    </div>
                    <div
                      className="energy-progress"
                      role="progressbar"
                      aria-label="Energy consumed"
                      aria-valuenow={Math.round(consumed.kcal)}
                      aria-valuemax={Math.max(
                        goal.kcal,
                        Math.round(consumed.kcal),
                      )}
                      aria-valuemin={0}
                    >
                      <span
                        style={{
                          width: `${Math.min(100, (consumed.kcal / goal.kcal) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="macro-grid">
                      {(["protein", "carbs", "fat"] as const).map((key) => (
                        <div className="macro" key={key}>
                          <span className="metric-label">
                            {key === "carbs"
                              ? "Carbs"
                              : key[0].toUpperCase() + key.slice(1)}
                          </span>
                          <div className="macro-value">
                            <strong>{Math.round(consumed[key])}</strong>
                            <span>/ {goal[key]} g</span>
                          </div>
                          <div className="progress">
                            <span
                              style={{
                                width: `${Math.min(100, (consumed[key] / goal[key]) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="diary">
                    <div className="section-heading">
                      <h2>Food log</h2>
                      <span>
                        {entries.length}{" "}
                        {entries.length === 1 ? "entry" : "entries"}
                      </span>
                    </div>
                    <div className="meal-groups">
                      {categories.map((cat) => {
                        const rows = entries.filter((e) => e.category === cat);
                        return (
                          <section
                            className={
                              "meal-section " + (!rows.length ? "is-empty" : "")
                            }
                            key={cat}
                          >
                            <div className="meal-heading">
                              <h3>{cat}</h3>
                              <span>
                                {rows.length
                                  ? `${energy(total(rows.flatMap((r) => r.items)).kcal, data.unit)} ${data.unit === "kcal" ? "cal" : "kJ"}`
                                  : "No foods"}
                              </span>
                              <button
                                aria-label={`Add ${cat.toLowerCase()}`}
                                onClick={() => {
                                  setMode("type:" + cat);
                                  setModal("food");
                                }}
                              >
                                <Plus size={19} />
                              </button>
                            </div>
                            {rows.map((entry) => (
                              <div className="food-row" key={entry.id}>
                                <div className="food-detail">
                                  <strong>{entry.name}</strong>
                                  <small>
                                    {entry.items.map(portionLabel).join(" · ")}
                                  </small>
                                </div>
                                <strong className="food-energy">
                                  {energy(total(entry.items).kcal, data.unit)}
                                </strong>
                                <button
                                  className="icon-button delete"
                                  disabled={saving}
                                  aria-label={`Remove ${entry.name}`}
                                  onClick={async () => {
                                    if (
                                      await commit({
                                        ...data,
                                        entries: data.entries.filter(
                                          (e) => e.id !== entry.id,
                                        ),
                                      })
                                    )
                                      setToast("Food removed");
                                  }}
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            ))}
                          </section>
                        );
                      })}
                    </div>
                  </section>
                </>
              ) : (
                <section className="saved-grid">
                  {data.meals
                    .filter((m) =>
                      view === "Recipes" ? !!m.batchGrams : !m.batchGrams,
                    )
                    .map((meal) => (
                      <article className="saved-card" key={meal.id}>
                        <div className="saved-heading">
                          <div>
                            <span className="eyebrow">{meal.category}</span>
                            <h2>{meal.name}</h2>
                          </div>
                          <button
                            aria-label={`Delete ${meal.name}`}
                            className="icon-button"
                            disabled={saving}
                            onClick={() =>
                              commit({
                                ...data,
                                meals: data.meals.filter(
                                  (m) => m.id !== meal.id,
                                ),
                              })
                            }
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <p>{meal.items.map((i) => i.name).join(", ")}</p>
                        <div className="serving-note">
                          <span>
                            {meal.batchGrams
                              ? `1 serving = ${Math.round(meal.batchGrams / (meal.servings || 1))} g`
                              : "Saved portions"}
                          </span>
                          <strong>
                            {energy(
                              total(meal.items).kcal / (meal.servings || 1),
                              data.unit,
                            )}{" "}
                            {data.unit === "kcal" ? "cal" : "kJ"}
                          </strong>
                        </div>
                        <button
                          className="secondary"
                          onClick={() => {
                            setPendingMeal(meal);
                            setModal("portion");
                          }}
                        >
                          <Plus size={17} />
                          Add to diary
                        </button>
                      </article>
                    ))}
                  {!data.meals.some((m) =>
                    view === "Recipes" ? !!m.batchGrams : !m.batchGrams,
                  ) && (
                    <div className="empty-state">
                      <h2>
                        {view === "Recipes"
                          ? "No recipes yet"
                          : "No saved meals"}
                      </h2>
                      <p>
                        {view === "Recipes"
                          ? "Add ingredients and the finished batch weight to calculate portions."
                          : "Save a meal when logging multiple foods."}
                      </p>
                      <button
                        className="secondary"
                        onClick={() =>
                          view === "Recipes" ? setModal("recipe") : openFood()
                        }
                      >
                        <Plus size={18} />
                        {view === "Recipes" ? "Create recipe" : "Add food"}
                      </button>
                    </div>
                  )}
                </section>
              )}
              {saving && (
                <div className="save-status" role="status">
                  Saving…
                </div>
              )}
            </>
          )}
        </div>
      </main>
      {modal === "settings" && (
        <Modal error={error} title="Settings" close={() => setModal("")}>
          <div className="settings-list">
            <button onClick={() => setModal("profile")}>
              <span>Goals & profile</span>
              <ChevronRight size={18} />
            </button>
            <button onClick={() => setModal("about")}>
              <span>Data & nutrition information</span>
              <ChevronRight size={18} />
            </button>
            <a href="/signout-with-chatgpt?return_to=%2F" target="_top">
              Sign out
            </a>
          </div>
        </Modal>
      )}
      {modal === "profile" && (
        <Modal
          error={error}
          title={data.profile ? "Goals & profile" : "Set up your goals"}
          close={data.profile ? () => setModal("") : undefined}
        >
          <ProfileForm
            initial={data.profile || defaultProfile}
            saving={saving}
            onSave={async (p) => {
              if (await commit({ ...data, profile: p })) setModal("");
            }}
          />
        </Modal>
      )}
      {modal === "food" && (
        <Modal error={error} title="Add food" close={() => setModal("")}>
          <FoodForm
            mode={mode}
            aiReady={aiReady}
            unit={data.unit}
            saving={saving}
            onAdd={addEntry}
          />
        </Modal>
      )}
      {modal === "recipe" && (
        <Modal error={error} title="New recipe" close={() => setModal("")}>
          <RecipeForm
            unit={data.unit}
            saving={saving}
            onSave={async (m) => {
              if (await commit({ ...data, meals: [...data.meals, m] })) {
                setModal("");
                setView("Recipes");
                setToast("Recipe saved");
              }
            }}
          />
        </Modal>
      )}
      {modal === "saveMeal" && pendingMeal && (
        <Modal error={error} title="Save meal" close={() => setModal("")}>
          <SaveMealForm
            meal={pendingMeal}
            saving={saving}
            onSave={async (m) => {
              if (await commit({ ...data, meals: [...data.meals, m] })) {
                setModal("");
                setToast("Saved to My meals");
              }
            }}
          />
        </Modal>
      )}
      {modal === "portion" && pendingMeal && (
        <Modal
          error={error}
          title={pendingMeal.name}
          close={() => setModal("")}
        >
          <PortionForm
            meal={pendingMeal}
            unit={data.unit}
            saving={saving}
            onAdd={(items, category) =>
              addEntry(items, category, pendingMeal.name, false)
            }
          />
        </Modal>
      )}
      {modal === "about" && (
        <Modal
          error={error}
          title="Data & nutrition"
          close={() => setModal("")}
        >
          <div className="about">
            <p>
              Your diary, goals and saved meals are stored against your
              signed-in account. Photos are sent to OpenAI only when you choose
              “Estimate meal”; they aren’t saved in your diary.
            </p>
            <h3>Target calculation</h3>
            <p>
              Energy uses the Mifflin–St Jeor estimate, your activity level, and
              a 10% surplus or 15% deficit, with a 1,200 cal minimum for
              automatic targets. The “average” equation averages the two sex
              constants. Targets are intended for adults and can be adjusted.
            </p>
            <p>
              Protein options use 1.4, 1.8 or 2.2 g/kg, capped at 35% of energy.
              Fat is around 30%; carbohydrate fills the remainder. The high
              option is optional, not a promise of better results.
            </p>
            <h3>Food values are estimates</h3>
            <p>
              The starter food list uses typical nutrition values. Use your
              packaging for brand accuracy. AI estimates can miss oils,
              ingredients and portion sizes: review them before logging.
            </p>
            <a
              href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/"
              target="_blank"
              rel="noreferrer"
            >
              Read the protein evidence ↗
            </a>
            <button
              className="secondary"
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "hawkes-health-diary.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download size={16} /> Export my diary
            </button>
            <a href="/signout-with-chatgpt?return_to=%2F" target="_top">
              Sign out
            </a>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Modal({
  title,
  close,
  children,
  error,
}: {
  title: string;
  close?: () => void;
  children: React.ReactNode;
  error?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      aria-label={title}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close?.();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close?.();
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          {close && (
            <button
              className="icon-button"
              aria-label="Close dialog"
              onClick={close}
            >
              <X size={21} />
            </button>
          )}
          <h2>{title}</h2>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {children}
      </div>
    </dialog>
  );
}
function ProfileForm({
  initial,
  saving,
  onSave,
}: {
  initial: Profile;
  saving: boolean;
  onSave: (p: Profile) => void;
}) {
  const [p, setP] = useState(initial);
  const update = (key: keyof Profile, value: any) =>
    setP({ ...p, [key]: value });
  const t = targets(p);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (p.calories > 0 && p.calories < 1200) {
          e.currentTarget.reportValidity();
          return;
        }
        onSave(p);
      }}
    >
      <p className="intro">Set your daily energy and protein targets.</p>
      <label>
        Your name
        <input
          maxLength={80}
          value={p.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Name"
        />
      </label>
      <label>Goal</label>
      <div className="choice-row">
        {[
          {
            id: "gain",
            title: "Get big",
            sub: "Calorie surplus",
            icon: "💪",
          },
          {
            id: "lose",
            title: "Lose weight",
            sub: "Calorie deficit",
            icon: "🌱",
          },
        ].map((g) => (
          <button
            type="button"
            key={g.id}
            className={"choice " + (p.goal === g.id ? "chosen" : "")}
            onClick={() => update("goal", g.id)}
          >
            <strong>{g.title}</strong>
            <small>{g.sub}</small>
          </button>
        ))}
      </div>
      <div className="form-grid three">
        <label>
          Weight (kg)
          <input
            required
            type="number"
            min="35"
            max="300"
            step="0.1"
            value={p.weight}
            onChange={(e) => update("weight", +e.target.value)}
          />
        </label>
        <label>
          Height (cm)
          <input
            required
            type="number"
            min="120"
            max="230"
            value={p.height}
            onChange={(e) => update("height", +e.target.value)}
          />
        </label>
        <label>
          Age (18+)
          <input
            required
            type="number"
            min="18"
            max="100"
            value={p.age}
            onChange={(e) => update("age", +e.target.value)}
          />
        </label>
      </div>
      <div className="form-grid">
        <label>
          Activity level
          <select
            value={p.activity}
            onChange={(e) => update("activity", +e.target.value)}
          >
            <option value="1.2">Mostly sitting</option>
            <option value="1.375">Light · 1–3 active days/week</option>
            <option value="1.55">Moderate · 3–5 days/week</option>
            <option value="1.725">Very active · 6–7 days/week</option>
            <option value="1.9">Physical job + hard training</option>
          </select>
        </label>
        <label>
          Energy equation
          <select value={p.sex} onChange={(e) => update("sex", e.target.value)}>
            <option value="average">Average / prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
      </div>
      <label>Protein target</label>
      <div className="protein-choices">
        {proteinLevels.map((level, i) => (
          <button
            type="button"
            className={p.proteinLevel === i ? "chosen" : ""}
            key={level.name}
            onClick={() => update("proteinLevel", i)}
          >
            <span>
              <strong>{level.name}</strong>
              <small>{level.description}</small>
            </span>
            <b>
              {Math.round(
                Math.min(p.weight * level.factor, (t.kcal * 0.35) / 4),
              )}{" "}
              g<small>{level.factor} g/kg*</small>
            </b>
          </button>
        ))}
      </div>
      <p className="hint">
        *Capped at 35% of energy. More isn’t always better.
      </p>
      <div className="target-preview">
        <Flame size={21} />
        <div>
          <strong>{t.kcal.toLocaleString()} cal / day</strong>
          <small>
            {t.protein}g protein · {t.carbs}g carbs · {t.fat}g fat
          </small>
        </div>
      </div>
      <details>
        <summary>Adjust my calorie target</summary>
        <label>
          Custom calories (leave 0 to calculate)
          <input
            type="number"
            min="0"
            max="6000"
            step="10"
            value={p.calories}
            onChange={(e) => {
              e.target.setCustomValidity(
                +e.target.value > 0 && +e.target.value < 1200
                  ? "Enter 0 for automatic targets, or at least 1200 calories."
                  : "",
              );
              update("calories", +e.target.value);
            }}
          />
        </label>
        <p className="hint">
          Estimated target: {targetCalories(p)} cal. Adjust to your needs over
          time.
        </p>
      </details>
      <p className="hint">
        General adult estimates, not a personalised medical plan. For pregnancy
        or health conditions, use a clinician’s targets.
      </p>
      <button className="primary full" disabled={saving}>
        {saving ? "Saving…" : "Save goals"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
function FoodPicker({
  onPick,
  unit,
}: {
  onPick: (f: Item) => void;
  unit: string;
}) {
  const [query, setQuery] = useState("");
  const searchQuery = query.trim();
  const list = searchQuery ? searchFoods(searchQuery) : [];
  return (
    <div className="food-picker">
      <div className="search-input">
        <Search size={18} />
        <input
          aria-label="Search foods"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search foods"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {searchQuery && (
        <div className="suggestions">
          {list.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => {
                onPick({ ...f, id: uid(), quantity: 1 });
                setQuery("");
              }}
            >
              <span>
                <strong>{f.name}</strong>
                <small>
                  {f.serving} · {energy(f.kcal, unit)}{" "}
                  {unit === "kcal" ? "cal" : "kJ"}
                </small>
              </span>
              <Plus size={17} />
            </button>
          ))}
          {!list.length && (
            <p className="hint">
              No foods found. Enter nutrition manually below.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
function ItemEditor({
  items,
  setItems,
  unit,
}: {
  items: Item[];
  setItems: (i: Item[]) => void;
  unit: string;
}) {
  return (
    <div className="item-list">
      {items.map((f, index) => (
        <div className="edit-item" key={f.id}>
          <div>
            <strong>{f.name}</strong>
            <small>
              {f.serving} · {f.grams}g per portion
            </small>
          </div>
          <label>
            Portions
            <input
              aria-label={`Portions of ${f.name}`}
              type="number"
              min="0.000001"
              max="10000"
              step="any"
              value={Number(f.quantity.toFixed(4))}
              onChange={(e) =>
                setItems(
                  items.map((x, i) =>
                    i === index ? { ...x, quantity: +e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <span>
            {energy(f.kcal * f.quantity, unit)}
            <small>{unit === "kcal" ? "cal" : "kJ"}</small>
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label={`Remove ingredient ${f.name}`}
            onClick={() => setItems(items.filter((_, i) => i !== index))}
          >
            <X size={16} />
          </button>
          <div className="portion-shortcuts">
            <span>Or weigh it:</span>
            <input
              disabled={f.grams <= 0}
              aria-label={`Grams of ${f.name}`}
              type="number"
              min="0.1"
              step="0.1"
              value={round(f.grams * f.quantity)}
              onChange={(e) => {
                if (f.grams > 0)
                  setItems(
                    items.map((x, i) =>
                      i === index
                        ? { ...x, quantity: +e.target.value / f.grams }
                        : x,
                    ),
                  );
              }}
            />
            <span>g</span>
            {/([0-9.]+)\s*ml/.test(f.serving) && (
              <>
                <span>or</span>
                <input
                  aria-label={`Millilitres of ${f.name}`}
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={round(
                    Number(f.serving.match(/([0-9.]+)\s*ml/)?.[1]) * f.quantity,
                  )}
                  onChange={(e) =>
                    setItems(
                      items.map((x, i) =>
                        i === index
                          ? {
                              ...x,
                              quantity:
                                +e.target.value /
                                Number(f.serving.match(/([0-9.]+)\s*ml/)?.[1]),
                            }
                          : x,
                      ),
                    )
                  }
                />
                <span>ml</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
function CustomFood({ onPick }: { onPick: (f: Item) => void }) {
  const [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [grams, setGrams] = useState("100"),
    [values, setValues] = useState(["", "", "", ""]);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Add food from a nutrition label</summary>
      <div className="custom-food">
        <label>
          Food name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My favourite yoghurt"
          />
        </label>
        <label>
          Values are for this portion (grams)
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </label>
        <div className="form-grid four">
          {["Calories", "Protein (g)", "Carbs (g)", "Fat (g)"].map((n, i) => (
            <label key={n}>
              {n}
              <input
                type="number"
                min="0"
                step="0.1"
                value={values[i]}
                onChange={(e) =>
                  setValues(
                    values.map((v, j) => (i === j ? e.target.value : v)),
                  )
                }
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          className="secondary"
          disabled={
            !name.trim() ||
            name.trim().length > 200 ||
            !Number.isFinite(+grams) ||
            +grams <= 0 ||
            +grams > 100000 ||
            values.some(
              (v) => v === "" || !Number.isFinite(+v) || +v < 0 || +v > 100000,
            )
          }
          onClick={() => {
            onPick({
              id: uid(),
              name: name.trim(),
              grams: +grams,
              serving: `${grams} g`,
              kcal: +values[0],
              protein: +values[1],
              carbs: +values[2],
              fat: +values[3],
              emoji: "🍽️",
              quantity: 1,
            });
            setName("");
            setValues(["", "", "", ""]);
            setOpen(false);
          }}
        >
          Add ingredient
        </button>
      </div>
    </details>
  );
}
function FoodForm({
  mode,
  unit,
  aiReady,
  saving,
  onAdd,
}: {
  mode: string;
  unit: string;
  aiReady: boolean;
  saving: boolean;
  onAdd: (i: Item[], c: string, n: string, s: boolean) => void;
}) {
  const [tab, setTab] = useState(mode.split(":")[0]),
    [items, setItems] = useState<Item[]>([]),
    [category, setCategory] = useState(mode.split(":")[1] || "Breakfast"),
    [text, setText] = useState(""),
    [image, setImage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [questions, setQuestions] = useState<string[]>([]),
    [answer, setAnswer] = useState(""),
    [saveMeal, setSaveMeal] = useState(true),
    [listening, setListening] = useState(false),
    [adding, setAdding] = useState(false);
  const showEntry = items.length === 0 || adding;
  function pickFood(food: Item) {
    setItems((current) => [...current, food]);
    setAdding(false);
  }
  const speech = useRef<any>(null);
  useEffect(() => () => speech.current?.abort(), []);
  async function analyse() {
    setBusy(true);
    setError("");
    try {
      const r = await api("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: answer
            ? `${text}\nPrevious estimate: ${JSON.stringify(items)}\nClarification: ${answer}`
            : text,
          image: image || undefined,
        }),
      });
      if (r.items.length) {
        setItems((current) =>
          adding && !answer.trim() ? [...current, ...r.items] : r.items,
        );
        setAdding(false);
      }
      setNote(r.note);
      setQuestions(
        r.items.filter((i: any) => i.question).map((i: any) => i.question),
      );
      setAnswer("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function record() {
    if (listening) {
      speech.current?.stop();
      return;
    }
    const Speech =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Speech) {
      setError(
        "Voice dictation is not supported in this browser. Try Chrome or use your keyboard microphone in the description box.",
      );
      return;
    }
    const r = new Speech();
    speech.current = r;
    r.lang = "en-AU";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e: any) => {
      let words = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        words += e.results[i][0].transcript + " ";
      setText((t) => t + " " + words);
    };
    r.onerror = () => {
      setError(
        "Microphone unavailable. Check permission, or type your meal below.",
      );
      setListening(false);
    };
    r.onend = () => setListening(false);
    try {
      r.start();
      setListening(true);
    } catch {
      setError("Could not start the microphone. Try again or type your meal.");
      setListening(false);
    }
  }
  return (
    <div>
      {showEntry && (
        <>
          <div className="tabs">
            {[
              { id: "type", icon: Search, label: "Type" },
              { id: "photo", icon: Camera, label: "Photo" },
              { id: "voice", icon: Mic, label: "Voice" },
            ].map((t) => (
              <button
                aria-pressed={tab === t.id}
                key={t.id}
                className={tab === t.id ? "active" : ""}
                onClick={() => {
                  speech.current?.stop();
                  setTab(t.id);
                }}
              >
                <t.icon size={17} />
                {t.label}
              </button>
            ))}
          </div>
          {tab === "type" ? (
            <>
              <FoodPicker unit={unit} onPick={pickFood} />
              <details>
                <summary>Describe a whole meal with AI</summary>
                <textarea
                  aria-label="Meal description"
                  placeholder="Muesli, apple, banana, yoghurt and honey…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  className="secondary"
                  disabled={!text.trim() || busy}
                  onClick={analyse}
                >
                  <Sparkles size={16} />
                  {busy ? "Thinking…" : "Suggest portions"}
                </button>
              </details>
            </>
          ) : (
            <>
              <div className="capture-area">
                {tab === "photo" ? (
                  <>
                    <Camera size={32} />
                    <h3>Meal photo</h3>
                    <p>
                      We’ll estimate the ingredients and portions.
                      <br />
                      You’ll check everything before it’s logged.
                    </p>
                    <input
                      aria-label="Choose meal photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setImage("");
                        setError("");
                        if (
                          !["image/jpeg", "image/png", "image/webp"].includes(
                            f.type,
                          )
                        ) {
                          setError("Choose a JPEG, PNG or WebP photo.");
                          return;
                        }
                        if (f.size > 5000000) {
                          setError("Please choose a photo under 5 MB.");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => setImage(reader.result as string);
                        reader.onerror = () =>
                          setError(
                            "Could not read this photo. Choose another image.",
                          );
                        reader.readAsDataURL(f);
                      }}
                    />
                    {image && (
                      <img
                        className="photo-preview"
                        src={image}
                        alt="Your meal to review"
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Mic size={32} />
                    <h3>Dictate a meal</h3>
                    <p>“I had a banana, some yoghurt and honey.”</p>
                    <button
                      className={listening ? "primary recording" : "primary"}
                      onClick={record}
                    >
                      <Mic size={17} />
                      {listening ? "Stop recording" : "Start recording"}
                    </button>
                    <p className="hint">
                      Your browser handles dictation; review the text below.
                    </p>
                  </>
                )}
              </div>
              <textarea
                aria-label="Meal description"
                placeholder={
                  tab === "photo"
                    ? "Any extras? Oils, sauces, ingredients or portion clues…"
                    : "Your spoken words will appear here. You can edit them."
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                className="secondary full"
                disabled={busy || (!image && !text.trim())}
                onClick={analyse}
              >
                <Sparkles size={17} />
                {busy ? "Estimating your meal…" : "Estimate meal"}
              </button>
              {!aiReady && (
                <p className="hint">
                  AI needs an OpenAI connection. You can use food search now.
                </p>
              )}
            </>
          )}
          <CustomFood onPick={pickFood} />
          {items.length > 0 && (
            <button className="secondary full" onClick={() => setAdding(false)}>
              Back to portions
            </button>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {note && (
        <p className="ai-note">
          <Sparkles size={16} />
          {note}
        </p>
      )}
      {questions.length > 0 && (
        <div className="clarify">
          <strong>A couple of portion details</strong>
          {questions.map((q, i) => (
            <p key={i}>{q}</p>
          ))}
          <input
            aria-label="Portion clarification"
            placeholder="e.g. a small banana and 150g yoghurt"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button
            className="secondary"
            disabled={!answer.trim() || busy}
            onClick={analyse}
          >
            Update estimate
          </button>
          <small>Or adjust the grams and portions below.</small>
        </div>
      )}
      {items.length > 0 && !showEntry && (
        <>
          <h3 className="review-heading">Review portions</h3>
          <ItemEditor items={items} setItems={setItems} unit={unit} />
          <NutritionSummary items={items} unit={unit} />
        </>
      )}
      {items.length > 0 && !showEntry && (
        <button
          className="text-button add-another"
          onClick={() => setAdding(true)}
        >
          <Plus size={17} />
          Add another food
        </button>
      )}
      {items.length > 0 && !showEntry && (
        <>
          <label>
            Add to
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {items.length > 1 && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={saveMeal}
                onChange={(e) => setSaveMeal(e.target.checked)}
              />{" "}
              Ask me to save this as a favourite meal
            </label>
          )}
          <button
            className="primary full"
            disabled={
              !items.length ||
              items.some((f) => !validQuantity(f.quantity)) ||
              saving ||
              busy
            }
            onClick={() =>
              onAdd(
                items,
                category,
                items.length === 1
                  ? items[0].name
                  : items
                      .map((i) => i.name)
                      .join(", ")
                      .slice(0, 200),
                items.length > 1 && saveMeal,
              )
            }
          >
            <Check size={17} />
            {saving ? "Saving…" : "Add to diary"}
          </button>
        </>
      )}
    </div>
  );
}
function NutritionSummary({ items, unit }: { items: Item[]; unit: string }) {
  const t = total(items);
  return (
    <div className="nutrition-summary">
      <strong>
        {energy(t.kcal, unit)} <small>{unit === "kcal" ? "cal" : "kJ"}</small>
      </strong>
      <span>
        <b>{round(t.protein)}g</b> protein
      </span>
      <span>
        <b>{round(t.carbs)}g</b> carbs
      </span>
      <span>
        <b>{round(t.fat)}g</b> fat
      </span>
    </div>
  );
}
function RecipeForm({
  unit,
  saving,
  onSave,
}: {
  unit: string;
  saving: boolean;
  onSave: (m: Meal) => void;
}) {
  const [items, setItems] = useState<Item[]>([]),
    [name, setName] = useState(""),
    [category, setCategory] = useState("Dinner"),
    [weight, setWeight] = useState(""),
    [servings, setServings] = useState("4");
  const meal: Meal = {
    id: uid(),
    name,
    category,
    items,
    batchGrams: +weight,
    servings: +servings,
  };
  const valid =
    !!name.trim() &&
    items.length > 0 &&
    items.every((i) => validQuantity(i.quantity)) &&
    +weight > 0 &&
    +servings > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(meal);
      }}
    >
      <p className="intro">
        Add everything that went in, including oils and sauces. Weigh the
        finished food without the container.
      </p>
      <label>
        Recipe name
        <input
          required
          maxLength={200}
          placeholder="e.g. Sunday chicken curry"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <FoodPicker unit={unit} onPick={(f) => setItems([...items, f])} />
      <CustomFood onPick={(f) => setItems([...items, f])} />
      <ItemEditor items={items} setItems={setItems} unit={unit} />
      <div className="form-grid">
        <label>
          Finished batch weight (g)
          <input
            required
            type="number"
            min="1"
            max="100000"
            placeholder="e.g. 1200"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </label>
        <label>
          Number of servings
          <input
            required
            type="number"
            min="0.1"
            max="1000"
            step="0.1"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </label>
      </div>
      <p className="hint">
        Use the cooked weight: cooking can add or remove water.
      </p>
      <label>
        Meal type
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      {valid && (
        <div className="recipe-calculation">
          <h3>One serving = {Math.round(+weight / +servings)} g</h3>
          <NutritionSummary
            items={[recipeItem(meal, 1, "serving")]}
            unit={unit}
          />
          <p>
            A 300 g portion ={" "}
            <strong>
              {energy(recipeItem(meal, 300, "grams").kcal, unit)}{" "}
              {unit === "kcal" ? "cal" : "kJ"}
            </strong>
          </p>
        </div>
      )}
      <button className="primary full" disabled={!valid || saving}>
        <BookOpen size={17} />
        {saving ? "Saving…" : "Save recipe"}
      </button>
    </form>
  );
}
function SaveMealForm({
  meal,
  saving,
  onSave,
}: {
  meal: Meal;
  saving: boolean;
  onSave: (m: Meal) => void;
}) {
  const [name, setName] = useState(meal.name),
    [category, setCategory] = useState(meal.category);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...meal, name: name.trim(), category });
      }}
    >
      <p className="intro">Save these portions to reuse later.</p>
      <label>
        Meal name
        <input
          required
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Meal type
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <button className="primary full" disabled={saving || !name.trim()}>
        Save to My meals
      </button>
    </form>
  );
}
function PortionForm({
  meal,
  unit,
  saving,
  onAdd,
}: {
  meal: Meal;
  unit: string;
  saving: boolean;
  onAdd: (i: Item[], c: string) => void;
}) {
  const [mode, setMode] = useState<"serving" | "grams">("serving"),
    [amount, setAmount] = useState(1),
    [category, setCategory] = useState(meal.category);
  const items = meal.batchGrams
    ? [recipeItem(meal, amount, mode)]
    : meal.items.map((i) => ({ ...i, quantity: i.quantity * amount }));
  return (
    <div>
      <p className="intro">
        {meal.batchGrams
          ? `One serving is ${Math.round(meal.batchGrams / (meal.servings || 1))} g of the finished recipe.`
          : "One meal uses your saved ingredient portions."}
      </p>
      <div className="form-grid">
        <label>
          Amount
          <input
            type="number"
            min="0.01"
            max="10000"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(+e.target.value)}
          />
        </label>
        <label>
          Measure
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as "serving" | "grams");
              setAmount(e.target.value === "grams" ? 300 : 1);
            }}
          >
            <option value="serving">
              {meal.batchGrams ? "Servings" : "Meals"}
            </option>
            {meal.batchGrams && <option value="grams">Grams</option>}
          </select>
        </label>
      </div>
      <NutritionSummary items={items} unit={unit} />
      <label>
        Add to
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <button
        className="primary full"
        disabled={
          !validQuantity(amount) ||
          items.some((i) => !validQuantity(i.quantity)) ||
          saving
        }
        onClick={() => onAdd(items, category)}
      >
        <Plus size={17} /> Add this portion to diary
      </button>
    </div>
  );
}
