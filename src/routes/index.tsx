import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Ending, EndStats, Game, Hud, Note, TokenColor } from "@/game/Game";
import type { MenuScene } from "@/game/MenuScene";
import { GFX, GFX_KEY, defaultGraphics, type Graphics } from "@/game/settings";
import { Button } from "@/components/ui/button";
import { Send, X, Backpack, Smartphone } from "lucide-react";
import { Intro } from "@/components/game/Intro";
import { GhostDialog } from "@/components/game/GhostDialog";
import { CONTROL_IMAGES, ITEM_IMAGES } from "@/components/game/media";
import { loadLang, setLang as saveLang, L } from "@/game/i18n";
import type { Lang } from "@/game/story";
import { SKINS, type SkinId } from "@/game/models";
import { TouchControls } from "@/components/game/TouchControls";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Забытый Парк — 3D хоррор" },
      { name: "description", content: "Хоррор от первого лица в заброшенном парке аттракционов под ночным дождём." },
      { property: "og:title", content: "Забытый Парк — 3D хоррор" },
      { property: "og:description", content: "Почините щитки и сбегите от аниматроника. Шесть концовок, озвученные диалоги и скины Барни." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const ENDINGS_RU: Record<Exclude<Ending, "release" | "keeper">, { title: string; tag: string; text: string; tone: string }> = {
  caught: {
    title: "ВАС ПОЙМАЛИ",
    tag: "Концовка 1 из 6 · Новый костюм",
    tone: "text-primary",
    text: "Зазывала Барни нежно поправил на вас соломенную шляпу. Утром охранник заметит у карусели второго аниматроника — новенького, с очень живыми глазами.",
  },
  dark: {
    title: "ТЬМА",
    tag: "Концовка 2 из 6 · Без света",
    tone: "text-muted-foreground",
    text: "Фонарик погас. Вы слышали только дождь и скрип сервоприводов — всё ближе. Последнее, что вы увидели, — один оранжевый глаз в темноте.",
  },
  escape: {
    title: "ВЫ СБЕЖАЛИ",
    tag: "Концовка 3 из 6 · Побег",
    tone: "text-accent",
    text: "Ворота с лязгом закрылись за спиной. Музыка карусели стихла под дождём. Но вы так и не узнали, что случилось в парке в 1987-м… Найдите все записи.",
  },
  truth: {
    title: "ПРАВДА",
    tag: "Концовка 4 из 6 · Истинная",
    tone: "text-truth",
    text: "Вы вынесли кассету и записки. Через неделю газеты пишут о закрытом деле 1987 года, а парк обесточивают навсегда. Последний щиток гаснет — и где-то внутри Барни наконец перестаёт улыбаться.",
  },
};
const RELEASE_RU = { title: "ОСВОБОЖДЕНИЕ", tag: "Концовка 5 из 6 · Томми", tone: "text-truth", text: "Томми. Услышав своё имя, Барни замирает. Оранжевый глаз гаснет, из сломанного костюма выходит мальчик. Митч открывает ворота. Эта ночь наконец закончилась." };
const KEEPER_RU = { title: "НОВЫЙ СТОРОЖ", tag: "Концовка 6 из 6 · Ваша смена", tone: "text-accent", text: "Вы берёте фонарь Митча. Старый сторож растворяется в дожде. Теперь это ваш парк. Вдалеке Барни поворачивается к свету. Начинается ваша первая смена." };
const ENDINGS_EN: Record<Ending, { title: string; tag: string; text: string; tone: string }> = {
  caught: { title: "CAUGHT", tag: "Ending 1 of 6 · A new suit", tone: "text-primary", text: "Barney gently adjusts your straw hat. Tomorrow, the guard will find a second animatronic by the carousel — with very living eyes." },
  dark: { title: "DARKNESS", tag: "Ending 2 of 6 · No light", tone: "text-muted-foreground", text: "Your flashlight died. Rain and servos were all you could hear, closer and closer. One orange eye was the last thing you saw." },
  escape: { title: "YOU ESCAPED", tag: "Ending 3 of 6 · Escape", tone: "text-accent", text: "The gates slam behind you. The carousel falls silent in the rain. But what happened here in 1987? Find all the records." },
  truth: { title: "THE TRUTH", tag: "Ending 4 of 6 · The truth", tone: "text-truth", text: "You brought out the tape and notes. The 1987 case is reopened, and the park loses power forever. Somewhere inside, Barney finally stops smiling." },
  release: { title: "SET FREE", tag: "Ending 5 of 6 · Tommy", tone: "text-truth", text: "Tommy. At his name, Barney stops. The orange eye goes dark; the little boy steps out of the broken suit. Mitch opens the gate. This night is finally over." },
  keeper: { title: "NIGHT WATCHMAN", tag: "Ending 6 of 6 · Your shift", tone: "text-accent", text: "You take Mitch’s lantern. The old watchman fades into the rain. The park is yours now. In the distance, Barney turns toward the light. Your first shift begins." },
};
const SEEN_KEY = "park-endings";
const TOKEN_CLS: Record<TokenColor, string> = { red: "bg-primary", blue: "bg-truth", yellow: "bg-accent" };

function Page() {
  const [lang, setLanguage] = useState<Lang>("ru");
  const ENDINGS = lang === "ru" ? { ...ENDINGS_RU, release: RELEASE_RU, keeper: KEEPER_RU } : ENDINGS_EN;
  const [skin, setSkin] = useState<SkinId>("classic");
  const [inventory, setInventory] = useState(false);
  const [ghost, setGhost] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [starting, setStarting] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menuBox = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const menu = useRef<MenuScene | null>(null);
  const [screen, setScreen] = useState<"menu" | "intro" | "play" | "end">("menu");
  const [panel, setPanel] = useState<"main" | "controls" | "endings" | "graphics" | "skins">("main");
  const [gfx, setGfx] = useState<Graphics>("medium");
  const [isTouch, setIsTouch] = useState(false);
  const [ending, setEnding] = useState<{ e: Ending; s: EndStats } | null>(null);
  const [seen, setSeen] = useState<Ending[]>([]);
  const [hud, setHud] = useState<Hud | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [arcade, setArcade] = useState<{ open: boolean; left: TokenColor[]; msg: string }>({ open: false, left: [], msg: "" });

  useEffect(() => {
    setLanguage(loadLang());
    const savedSkin = localStorage.getItem("park-skin");
    if (savedSkin && savedSkin in SKINS) setSkin(savedSkin as SkinId);
    const resize = () => setPortrait(window.matchMedia("(pointer: coarse)").matches && window.innerHeight > window.innerWidth);
    resize(); window.addEventListener("resize", resize);
    try { setSeen(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch { /* ignore */ }
    const saved = localStorage.getItem(GFX_KEY) as Graphics | null;
    setGfx(saved && saved in GFX ? saved : defaultGraphics());
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (screen === "play" || screen === "intro" || !menuBox.current) return;
    let alive = true;
    import("@/game/MenuScene").then(({ MenuScene }) => {
      if (alive && menuBox.current) { menu.current = new MenuScene(menuBox.current); menu.current.setSkin(skin); }
    });
    return () => { alive = false; menu.current?.dispose(); menu.current = null; };
  }, [screen]);

  useEffect(() => { menu.current?.setSkin(skin); }, [skin]);
  const openInventory = () => { if (!game.current || ghost || note || arcade.open) return; game.current.openModal(); setInventory(true); };
  const closeInventory = () => { setInventory(false); game.current?.closeModal(); };
  const startIntro = async () => {
    if (isTouch) {
      try { await document.documentElement.requestFullscreen(); } catch { /* unsupported */ }
      try { await (window.screen.orientation as ScreenOrientation & { lock?: (s: string) => Promise<void> }).lock?.("landscape"); } catch { /* rotate prompt remains available */ }
    }
    setNote(null); setInventory(false); setGhost(false); setArcade({ open: false, left: [], msg: "" }); setScreen("intro");
  };
  const start = async () => {
    if (starting || !box.current) return;
    setStarting(true);
    const { Game } = await import("@/game/Game");
    game.current?.dispose();
    setHud(null);
    setScreen("play");
    const container = box.current;
    if (!container) { setStarting(false); return; }
    game.current = new Game(container, {
      onHud: setHud,
      onNote: setNote,
      onArcade: () => setArcade({ open: true, left: [...(game.current?.tokens ?? [])], msg: L("Вставьте жетоны в правильном порядке", "Insert tokens in the right order") }),
      onInventory: () => { game.current?.openModal(); setInventory(true); },
      onGhost: () => setGhost(true),
      onEnd: (e, s) => {
        setEnding({ e, s });
        setSeen((prev) => {
          const next = prev.includes(e) ? prev : [...prev, e];
          localStorage.setItem(SEEN_KEY, JSON.stringify(next));
          return next;
        });
        setTimeout(() => { game.current?.dispose(); game.current = null; setScreen("end"); }, 50);
      },
    }, gfx, skin);
    setStarting(false);
    game.current.lock();
  };
  useEffect(() => () => game.current?.dispose(), []);

  const insert = (c: TokenColor) => {
    const g = game.current;
    if (!g) return;
    const r = g.insertToken(c);
    if (r === "wrong") setArcade({ open: true, left: [...g.tokens], msg: L("СИРЕНА! Неверный порядок — попробуйте ещё", "SIREN! Wrong order — try again") });
    else if (r === "solved") { setArcade({ open: false, left: [], msg: "" }); g.closeModal(); }
    else setArcade((a) => ({ ...a, left: a.left.filter((x, i) => i !== a.left.indexOf(c)), msg: L("Щёлк…", "Click…") }));
  };

  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 overflow-hidden bg-background font-sans text-foreground">
      <div ref={box} className="absolute inset-0" />

      {screen === "play" && hud && (
        <div className="pointer-events-none absolute inset-0 p-3 text-xs tracking-normal md:p-5 md:text-sm">
          <div className="panel-glass inline-flex flex-col gap-2 rounded px-4 py-3">
            <Bar label={L("Фонарик", "Flashlight")} v={hud.battery} cls="bg-accent" />
            <Bar label={L("Выносливость", "Stamina")} v={hud.stamina} cls="bg-truth" />
            <div className="text-muted-foreground">{L("Щитки", "Fuse boxes")} <span className="text-foreground">{hud.gens}/3</span> · {L("Записи", "Records")} <span className="text-foreground">{hud.notes.length}/3</span></div>
            {hud.slots.length > 0 && <div className="text-muted-foreground">{hud.slots.map((s) => `${s.label}×${s.count}`).join(" · ")}</div>}
          </div>
          {hud.chase && <div className="absolute inset-0 animate-pulse shadow-[inset_0_0_160px_var(--glow)]" />}
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/60" />
          {hud.prompt && <div className={`absolute left-0 w-full text-center text-lg ${isTouch ? "bottom-40" : "bottom-24"}`}><span className="panel-glass rounded px-3 py-1">{isTouch ? <img src={CONTROL_IMAGES.hand} alt="" className="inline-block h-7 w-7 object-contain" /> : "[E]"} {hud.prompt}</span></div>}
          {hud.message && <div className="absolute top-28 left-0 w-full px-6 text-center text-sm md:top-16 md:text-lg">{hud.message}</div>}
          {hud.paused && !isTouch && <div className="absolute inset-0 grid place-items-center bg-background/60 font-display text-2xl">{L("Кликните, чтобы продолжить", "Click to continue")}</div>}
        </div>
      )}

      {screen === "play" && hud && isTouch && !note && !arcade.open && !inventory && !ghost && (
        <TouchControls game={game} prompt={hud.prompt} flashlight={hud.flashlight} onInventory={openInventory} />
      )}

      {screen === "intro" && <Intro lang={lang} onFinish={start} />}
      {screen === "play" && !isTouch && !inventory && !ghost && <Button variant="outline" size="icon" className="absolute right-5 top-5" title={L("Инвентарь", "Inventory")} aria-label={L("Инвентарь", "Inventory")} onClick={openInventory}><Backpack /></Button>}
      {inventory && hud && <div className="absolute inset-0 grid place-items-center bg-background/80 p-4"><section className="game-dialog panel-glass w-full max-w-xl rounded p-5">
        <div className="flex justify-between items-center mb-4"><h2 className="font-display text-2xl">{L("Инвентарь", "Inventory")} · {hud.slots.length}/4</h2><Button variant="ghost" size="icon" aria-label={L("Закрыть", "Close")} onClick={closeInventory}><X /></Button></div>
        <div className="grid grid-cols-4 gap-2">{Array.from({ length: 4 }, (_, i) => { const item = hud.slots[i]; return <div key={i} className="min-w-0 border border-border p-2 text-center"><div className="aspect-square">{item && <img src={ITEM_IMAGES[item.id]} alt={item.label} className="h-full w-full object-contain" />}</div><p className="text-xs break-words">{item ? `${item.label} ×${item.count}` : "—"}</p></div>; })}</div>
        <h3 className="mt-5 mb-2 text-muted-foreground">{L("Записи", "Records")} · {hud.notes.length}/3</h3>{hud.notes.map((n, i) => <Button key={i} variant="link" className="block h-auto whitespace-normal text-left" onClick={() => { setInventory(false); setNote(n); }}>{n.title}</Button>)}
      </section></div>}
      {ghost && hud && <GhostDialog lang={lang} notes={hud.notes.length} gens={hud.gens} onClose={() => { setGhost(false); game.current?.closeModal(); }} onChoice={(id) => game.current?.completeStoryChoice(id)} />}
      {portrait && <div className="absolute inset-0 z-50 grid place-items-center bg-background/95 p-6 text-center"><div><Smartphone className="mx-auto mb-5 h-16 w-16 rotate-90 text-accent" /><h2 className="font-display text-2xl">{L("Поверните телефон", "Rotate your phone")}</h2><p className="mt-2 text-muted-foreground">{L("Горизонтальная ориентация", "Landscape orientation")}</p></div></div>}
      {note && (
        <div className="absolute inset-0 grid place-items-center bg-background/80 p-4">
          <div className="panel-glass fade-up max-w-md rounded p-6 whitespace-pre-line">
            <h2 className="mb-3 font-display text-xl">{note.title}</h2>
            {note.text}
            <Button variant="ghost" className="mt-5 block text-accent underline" onClick={() => { setNote(null); game.current?.closeModal(); }}>{L("Закрыть", "Close")}</Button>
          </div>
        </div>
      )}

      {arcade.open && (
        <div className="absolute inset-0 grid place-items-center bg-background/80 p-4">
          <div className="panel-glass fade-up w-full max-w-sm rounded p-6 text-center">
            <h2 className="font-display text-2xl">TOKEN TRIAL</h2>
            <p className="mt-2 text-muted-foreground">{arcade.msg}</p>
            <div className="mt-5 flex justify-center gap-4">
              {arcade.left.map((c, i) => (
                <Button variant="ghost" key={i} aria-label={`Жетон ${c}`} onClick={() => insert(c)} className={`h-14 w-14 rounded-full border-4 border-foreground/30 transition-transform hover:scale-110 ${TOKEN_CLS[c]}`} />
              ))}
            </div>
            <Button variant="ghost" className="mt-6 text-accent underline" onClick={() => { setArcade({ open: false, left: [], msg: "" }); game.current?.closeModal(); }}>{L("Отойти", "Leave")}</Button>
          </div>
        </div>
      )}

      {(screen === "menu" || screen === "end") && (
        <div className="absolute inset-0">
          <div ref={menuBox} className="absolute inset-0" />
          <div className="vignette pointer-events-none absolute inset-0" />
          <div className="menu-stage absolute inset-0 flex items-center px-6 md:px-16">
            <div className="menu-panel fade-up w-full max-w-md">
              {screen === "end" && ending ? (
                <>
                  <p className="text-sm uppercase tracking-normal text-muted-foreground">{ENDINGS[ending.e].tag}</p>
                  <h1 className={`title-3d mt-2 text-5xl md:text-6xl ${ENDINGS[ending.e].tone}`}>{ENDINGS[ending.e].title}</h1>
                  <p className="mt-5 text-lg leading-relaxed text-foreground/85">{ENDINGS[ending.e].text}</p>
                  <p className="mt-4 text-sm text-muted-foreground">{L("Время", "Time")} {fmt(ending.s.time)} · {L("Щитки", "Fuse boxes")} {ending.s.gens}/3 · {L("Записи", "Records")} {ending.s.notes}/{ending.s.notesTotal} · {L("Концовки", "Endings")} {seen.length}/6</p>
                  <nav className="mt-8">
                    <MenuItem onClick={startIntro} onHover={(v) => menu.current?.setFocus(v)}>{L("Ещё раз", "Try again")}</MenuItem>
                    <MenuItem onClick={() => { setScreen("menu"); setPanel("main"); }}>{L("В меню", "Main menu")}</MenuItem>
                  </nav>
                </>
              ) : (
                <>
                  <p className="text-sm uppercase tracking-normal text-muted-foreground">{L("Парк «Весёлые Горки» · 1987", "Happy Hills · 1987")}</p>
                  <h1 className="title-3d mt-3 text-6xl md:text-7xl">{lang === "ru" ? <>ЗАБЫТЫЙ<br />ПАРК</> : <>FORGOTTEN<br />PARK</>}</h1>
                  {panel === "main" && (
                    <nav className="mt-5">
                       <MenuItem onClick={() => setPanel("skins")}>{L("Скин Барни", "Barney skin")}: {SKINS[skin][lang]}</MenuItem>
                      <MenuItem onClick={startIntro} onHover={(v) => menu.current?.setFocus(v)}>{L("Играть", "Play")}</MenuItem>
                      <MenuItem onClick={() => setPanel("controls")}>{L("Управление", "Controls")}</MenuItem>
                      <MenuItem onClick={() => setPanel("graphics")}>{L("Графика", "Graphics")}: {lang === "ru" ? GFX[gfx].label : gfx}</MenuItem>
                      <MenuItem onClick={() => setPanel("endings")}>{L("Концовки", "Endings")} {seen.length}/6</MenuItem>
                    </nav>
                  )}
                  {panel === "main" && <div className="mt-4 flex items-center gap-3">
                    <div className="flex border border-border rounded" role="group" aria-label="Language">{(["ru", "en"] as const).map((l) => <Button key={l} variant={lang === l ? "secondary" : "ghost"} aria-pressed={lang === l} onClick={() => { saveLang(l); setLanguage(l); }}>{l.toUpperCase()}</Button>)}</div>
                    <Button variant="outline" asChild><a href="https://t.me/zerthonalgames" target="_blank" rel="noopener noreferrer"><Send />Telegram</a></Button>
                  </div>}
                  {panel === "skins" && <div className="mt-5">{(Object.keys(SKINS) as SkinId[]).map((id) => <Button key={id} variant="ghost" className="flex w-full justify-start text-lg" aria-pressed={skin === id} onClick={() => { setSkin(id); localStorage.setItem("park-skin", id); }}>{skin === id ? "●" : "○"} {SKINS[id][lang]}</Button>)}<MenuItem onClick={() => setPanel("main")}>{L("Назад", "Back")}</MenuItem></div>}
                  {panel === "controls" && (
                    <div className="mt-8 space-y-1 text-lg text-foreground/85">
                      {isTouch ? (<>
                        <p>{L("Левая часть экрана — джойстик", "Left side — movement")}</p>
                        <p>{L("Правая часть — свайп, чтобы осмотреться", "Right side — look around")}</p>
                        <div className="flex gap-3">{Object.values(CONTROL_IMAGES).map((img) => <img key={img} src={img} alt="" className="h-10 w-10 object-contain" />)}</div>
                      </>) : (<>
                        <p>{L("WASD — идти, Shift — бежать", "WASD — move, Shift — sprint")}</p>
                        <p>{L("Мышь — осмотреться, E / клик — действие", "Mouse — look, E / click — interact")}</p>
                        <p>{L("F — фонарик, Tab — инвентарь", "F — flashlight, Tab — inventory")}</p>
                      </>)}
                      <p className="pt-2 text-muted-foreground">{L("Почините 3 щитка и выберитесь через ворота. Свет и шум привлекают Зазывалу.", "Repair 3 fuse boxes and escape through the gate. Light and noise attract Barney.")}</p>
                      <MenuItem onClick={() => setPanel("main")}>{L("Назад", "Back")}</MenuItem>
                    </div>
                  )}
                  {panel === "graphics" && (
                    <div className="mt-8 space-y-3">
                      {(Object.keys(GFX) as Graphics[]).map((k) => (
                        <Button variant="ghost"
                          key={k}
                          onClick={() => { setGfx(k); localStorage.setItem(GFX_KEY, k); }}
                          className={`panel-glass block w-full rounded px-4 py-3 text-left transition-colors ${gfx === k ? "border border-accent text-accent" : "text-foreground/85"}`}
                        >
                          <div className="font-display text-lg">{lang === "ru" ? GFX[k].label : k}</div>
                          <div className="text-sm text-muted-foreground">
                            {k === "low" && L("Для слабых телефонов: без теней и тумана, меньше дождя", "Older phones: no shadows or ground fog, less rain")}
                            {k === "medium" && L("Баланс: туман, искры, чёткая картинка", "Balanced: fog, sparks, clear image")}
                            {k === "high" && L("Тени, сглаживание, плотный дождь, отражения", "Shadows, antialiasing, heavy rain, reflections")}
                          </div>
                        </Button>
                      ))}
                      <MenuItem onClick={() => setPanel("main")}>{L("Назад", "Back")}</MenuItem>
                    </div>
                  )}
                  {panel === "endings" && (
                    <div className="mt-8 space-y-3">
                      {(Object.keys(ENDINGS) as Ending[]).map((k) => (
                        <div key={k} className="panel-glass rounded px-4 py-2">
                          <div className={`font-display ${seen.includes(k) ? ENDINGS[k].tone : "text-muted-foreground"}`}>{seen.includes(k) ? ENDINGS[k].title : "???"}</div>
                          <div className="text-sm text-muted-foreground">{ENDINGS[k].tag}</div>
                        </div>
                      ))}
                      <MenuItem onClick={() => setPanel("main")}>{L("Назад", "Back")}</MenuItem>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, onHover }: { children: React.ReactNode; onClick: () => void; onHover?: (v: number) => void }) {
  return (
    <Button variant="ghost" className="menu-item h-auto whitespace-normal justify-start hover:bg-transparent" onClick={onClick} onMouseEnter={() => onHover?.(1)} onMouseLeave={() => onHover?.(0)} onFocus={() => onHover?.(1)} onBlur={() => onHover?.(0)}>
      {children}
    </Button>
  );
}

function Bar({ label, v, cls }: { label: string; v: number; cls: string }) {
  return (
    <div className="w-44">
      <div className="flex justify-between text-xs text-muted-foreground"><span>{label}</span><span>{v}%</span></div>
      <div className="mt-1 h-1.5 rounded bg-muted"><div className={`h-full rounded ${cls}`} style={{ width: `${v}%` }} /></div>
    </div>
  );
}
