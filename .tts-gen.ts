import { generateSpeech } from "@lovable.dev/ai-gateway";
import { CUTSCENE, GHOST_HELLO, CHOICES } from "/dev-server/src/game/story.ts";
import { mkdirSync, writeFileSync, existsSync } from "fs";
const VOICE = { narr: "Charon", player: "Puck", ghost: "Algenib" };
const STYLE = {
  narr: { ru: "Тихо, напряжённо, как рассказчик в фильме ужасов, говори:", en: "Say quietly and tensely, like a horror movie narrator:" },
  player: { ru: "Нервно, полушёпотом, испуганный молодой человек говорит:", en: "Nervously, half-whispering, a scared young man says:" },
  ghost: { ru: "Хриплым усталым голосом старика-призрака, медленно и зловеще скажи:", en: "In the hoarse, weary voice of an old ghost, slowly and eerily say:" },
};
const jobs: [string, string, keyof typeof VOICE, string][] = [];
for (const lang of ["ru", "en"] as const) {
  for (const c of CUTSCENE) jobs.push([lang, c.id, "narr", c.text[lang]]);
  jobs.push([lang, GHOST_HELLO.id, "ghost", GHOST_HELLO.text[lang]]);
  for (const c of CHOICES) { jobs.push([lang, c.id, "player", c.text[lang]]); jobs.push([lang, c.reply.id, "ghost", c.reply.text[lang]]); }
}
const only = process.argv[2];
for (const [lang, id, who, text] of jobs.filter(j => !only || j[1] === only)) {
  const dir = `/dev-server/public/voice/${lang}`; mkdirSync(dir, { recursive: true });
  const out = `${dir}/${id}.wav`; if (existsSync(out)) continue; await new Promise(r=>setTimeout(r,1500));
  let res: any; for (let a=0;a<15;a++){ try { res = await generateSpeech({ model: (["google/gemini-3.1-flash-tts-preview","google/gemini-2.5-pro-tts","google/gemini-2.5-flash-tts"])[a%3] as any, contents: [{ role: "user", parts: [{ text: `${STYLE[who][lang]} ${text}` }] }],
    generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE[who] } } } } } as any); break; } catch(e:any){ console.log("retry",id,e.httpStatus, e.retryAfter); await new Promise(r=>setTimeout(r,a%3==2 ? Math.min(e.retryAfter||20000, 40000) : 500)); } } if(!res) continue;
  const buf = new Uint8Array(await (await res.blob()).arrayBuffer());
  let data = buf;
  if (!res.contentType.includes("wav")) { // raw PCM 24k mono s16le -> wav
    const h = new ArrayBuffer(44), v = new DataView(h), n = buf.length;
    const w = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 24000, true); v.setUint32(28, 48000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n, true);
    data = new Uint8Array([...new Uint8Array(h), ...buf]);
  }
  writeFileSync(out, data); console.log(id, lang, res.contentType, data.length);
}
