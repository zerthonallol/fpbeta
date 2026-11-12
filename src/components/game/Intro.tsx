import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CUTSCENE, type Lang } from "@/game/story";
import { VoiceLine } from "./VoiceLine";
import scene1 from "@/assets/cutscene/scene1.jpg";
import scene2 from "@/assets/cutscene/scene2.jpg";
import scene3 from "@/assets/cutscene/scene3.jpg";
const frames = [scene1, scene2, scene3];
export function Intro({ lang, onFinish }: { lang: Lang; onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const line = CUTSCENE[index];
  if (!line) return null;
  const next = () => index === CUTSCENE.length - 1 ? onFinish() : setIndex(index + 1);
  return <div className="absolute inset-0 bg-background">
    <img src={frames[index]} alt={line.text[lang]} className="h-full w-full object-cover" />
    <div className="cutscene-caption absolute inset-x-0 bottom-0 px-6 pb-6 pt-16 md:px-16">
      <div className="mx-auto max-w-3xl text-lg"><VoiceLine lang={lang} id={line.id} text={line.text[lang]} />
      <div className="mt-4 flex items-center justify-between"><span className="text-xs text-muted-foreground">{index + 1} / 3</span><Button variant="outline" onClick={next}>{lang === "ru" ? "Далее" : "Continue"}<ArrowRight /></Button></div></div>
    </div>
    <Button className="absolute right-4 top-4" variant="ghost" onClick={onFinish}>{lang === "ru" ? "Пропустить" : "Skip"}</Button>
  </div>;
}