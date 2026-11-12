import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHOICES, GHOST_HELLO, type Lang, type Line } from "@/game/story";
import { availableStoryChoice } from "@/game/story-rules";
import { VoiceLine } from "./VoiceLine";

export function GhostDialog({ lang, notes, gens, onClose, onChoice }: { lang: Lang; notes: number; gens: number; onClose: () => void; onChoice: (id: string) => void }) {
  const [line, setLine] = useState<Line>(GHOST_HELLO);
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const done = () => {
    if (line.who === "player" && pending) {
      const c = CHOICES.find((c) => c.id === pending);
      if (c) setLine(c.reply);
    } else {
      setBusy(false);
      if (pending) {
        const c = CHOICES.find((c) => c.id === pending);
        onChoice(pending);
        setPending(null);
        if (c?.action || pending === "p_bye") onClose();
      }
    }
  };
  const finish = () => { if (pending) onChoice(pending); onClose(); };
  return <div className="absolute inset-0 flex items-end justify-center bg-background/60 p-4 md:p-8">
    <section className="game-dialog panel-glass w-full max-w-2xl rounded p-5">
      <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl text-truth">{line.who === "ghost" ? (lang === "ru" ? "Митч · Ночной сторож" : "Mitch · Night watchman") : (lang === "ru" ? "Вы" : "You")}</h2><Button variant="ghost" size="icon" aria-label={lang === "ru" ? "Закрыть" : "Close"} onClick={finish}><X /></Button></div>
      <VoiceLine key={line.id} lang={lang} id={line.id} text={line.text[lang]} onDone={done} />
      {busy ? <Button variant="link" className="mt-3" onClick={done}>{lang === "ru" ? "Продолжить" : "Continue"}</Button> : <div className="mt-4 grid gap-2 sm:grid-cols-2">{CHOICES.filter((c) => availableStoryChoice(c.when, notes, gens)).map((c) => <Button key={c.id} variant="outline" className="h-auto min-h-10 whitespace-normal justify-start text-left" onClick={() => { setPending(c.id); setBusy(true); setLine({ id: c.id, who: "player", text: c.text }); }}>{c.text[lang]}</Button>)}</div>}
    </section>
  </div>;
}