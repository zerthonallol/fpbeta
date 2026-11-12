// Voiced story content: intro cutscene + ghost caretaker dialogue. Audio lives in /public/voice/<lang>/<id>.wav
export type Lang = "ru" | "en";
type T = Record<Lang, string>;

export const CUTSCENE: { id: string; text: T }[] = [
  { id: "intro1", text: {
    ru: "Машина заглохла посреди леса. Ливень, на дороге ни души… и телефон не ловит. А за деревьями — огни.",
    en: "My car died in the middle of the woods. Pouring rain, not a soul on the road… and no signal. But past the trees — lights.",
  } },
  { id: "intro2", text: {
    ru: "Старый парк «Весёлые Горки». Закрыт с восемьдесят седьмого. Но кто-то включил там свет… Я просто хотел позвонить.",
    en: "The old Happy Hills amusement park. Closed since eighty-seven. But someone turned the lights on… I just wanted to make a call.",
  } },
  { id: "intro3", text: {
    ru: "Ворота захлопнулись за моей спиной. И тогда я увидел его. Один оранжевый глаз в темноте.",
    en: "The gate slammed shut behind me. And that's when I saw him. One orange eye in the dark.",
  } },
];

export type Speaker = "ghost" | "player";
export interface Line { id: string; who: Speaker; text: T }
export interface Choice { id: string; text: T; reply: Line; when?: "notes" | "gens"; action?: "release" | "keeper"; once?: boolean }

export const GHOST_HELLO: Line = { id: "g_hello", who: "ghost", text: {
  ru: "Ещё один… Не бойся меня, сынок. Бойся его. Я сторож этого парка. Был когда-то.",
  en: "Another one… Don't be afraid of me, kid. Be afraid of him. I'm the caretaker of this park. Used to be.",
} };

export const CHOICES: Choice[] = [
  { id: "p_who", text: { ru: "Кто ты такой?", en: "Who are you?" }, reply: { id: "g_who", who: "ghost", text: {
    ru: "Митч. Ночной сторож. Барни поймал меня в ту ночь, в восемьдесят седьмом. С тех пор я не могу уйти.",
    en: "Mitch. Night watchman. Barney got me that night, back in eighty-seven. I haven't been able to leave since.",
  } } },
  { id: "p_how", text: { ru: "Как отсюда выбраться?", en: "How do I get out of here?" }, reply: { id: "g_how", who: "ghost", text: {
    ru: "Три щитка. Предохранитель, шестерня и механический ключ. Запустишь все — ворота откроются. Но гул его разбудит.",
    en: "Three fuse boxes. A fuse, a cog and a wind-up key. Power them all and the gate opens. But the hum will wake him.",
  } } },
  { id: "p_bear", text: { ru: "Что не так с этим медведем?", en: "What's wrong with that bear?" }, reply: { id: "g_bear", who: "ghost", text: {
    ru: "Внутри Барни застрял мальчик. Томми. Найди все три записи и возвращайся. Я знаю, как его отпустить.",
    en: "There's a boy trapped inside Barney. Tommy. Find all three records and come back. I know how to set him free.",
  } } },
  { id: "p_notes", when: "notes", action: "release", text: { ru: "Я нашёл все записи.", en: "I found all the records." }, reply: { id: "g_release", who: "ghost", text: {
    ru: "Значит, ты знаешь правду. Когда он придёт — не беги. Не свети ему в глаз. Просто позволь подойти… и назови его имя.",
    en: "Then you know the truth. When he comes — don't run. Don't shine the light in his eye. Just let him come close… and say his name.",
  } } },
  { id: "p_keeper", when: "gens", action: "keeper", text: { ru: "Я останусь вместо тебя.", en: "I'll stay in your place." }, reply: { id: "g_keeper", who: "ghost", text: {
    ru: "Ты… правда? Сорок лет я ждал этих слов. Держи фонарь, сторож. Теперь это твой парк.",
    en: "You… really? Forty years I've waited to hear that. Take the lantern, watchman. This is your park now.",
  } } },
  { id: "p_bye", text: { ru: "Мне пора.", en: "I have to go." }, reply: { id: "g_bye", who: "ghost", text: {
    ru: "Держись подальше от света. Он идёт на свет.",
    en: "Stay out of the light. He follows the light.",
  } } },
];

export const voiceUrl = (lang: Lang, id: string) => `/voice/${lang}/${id}.wav`;
