import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceUrl, type Lang } from "@/game/story";

export function VoiceLine({ lang, id, text, onDone }: { lang: Lang; id: string; text: string; onDone?: () => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    setFailed(false); setBlocked(false);
    const a = audio.current;
    a?.load();
    a?.play().catch(() => setBlocked(true));
    return () => a?.pause();
  }, [id, lang]);
  return <div>
    <audio ref={audio} src={voiceUrl(lang, id)} onEnded={onDone} onError={() => { setFailed(true); onDone?.(); }} />
    <p className="leading-relaxed">{text}</p>
    {blocked && !failed && <Button variant="ghost" size="icon" aria-label={lang === "ru" ? "Включить голос" : "Play voice"} onClick={() => audio.current?.play()}><Volume2 /></Button>}
    {failed && <p className="mt-2 text-xs text-muted-foreground">{lang === "ru" ? "Голосовая запись недоступна" : "Voice recording unavailable"}</p>}
  </div>;
}