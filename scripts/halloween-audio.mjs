// Baixa as gravações livres do Wikimedia Commons, recorta os trechos escolhidos, normaliza o pico e codifica
// em MP3 mono (public/halloween/audio). As fontes e licenças estão em docs/halloween-credits.md.
//   node scripts/halloween-audio.mjs        (precisa de ffmpeg no PATH e de rede)
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "halloween", "audio");
const TMP = join(tmpdir(), "milweb-halloween-audio");
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
const UA = { "User-Agent": "milweb-halloween/1.0 (rickjanuario0@gmail.com)" };

/** Cada saída: arquivo-fonte (título no Commons), trecho [início, duração] em s, ganho de pico alvo e fades. */
const CLIPS = [
  { out: "wind-loop", src: "Howling wind.ogg", from: 30, dur: 30, loop: 4, peak: -9, kbps: 56 },
  { out: "wolf-a", src: "Wolf howls.ogg", from: 1, dur: 9, peak: -8, fadeIn: 1.2, fadeOut: 2.5 },
  { out: "wolf-b", src: "Wolf howls.ogg", from: 15, dur: 8, peak: -8, fadeIn: 1.2, fadeOut: 2.5 },
  { out: "creak-door", src: "Door handle creaking.ogg", from: 0, dur: 2.6, peak: -5, fadeOut: 0.4 },
  { out: "creak-casket", src: "Creaky wooden casket.ogg", from: 0, dur: 1.4, peak: -5, fadeOut: 0.15 },
  { out: "creak-metal-a", src: "Metal cabinet door jarring.ogg", from: 0.5, dur: 3.5, peak: -7, fadeIn: 0.1, fadeOut: 0.5 },
  { out: "creak-metal-b", src: "Metal cabinet door jarring.ogg", from: 9, dur: 3.6, peak: -7, fadeIn: 0.1, fadeOut: 0.5 },
  { out: "creak-chair", src: "Assorted creaking noises of office chair.ogg", from: 10.2, dur: 2.6, peak: -7, fadeIn: 0.05, fadeOut: 0.4 },
  { out: "heartbeat", src: "Heartbeat mitral valve 150 bpm.ogg", from: 1, dur: 5, peak: -6, fadeIn: 0.05, fadeOut: 0.3 },
  { out: "thunder", src: "Nosferatu thunderclap - Richard Humphries.wav", from: 3.4, dur: 11, peak: -4, fadeIn: 0.02, fadeOut: 3 },
];

async function fetchSource(title) {
  const file = join(TMP, title.replace(/[^A-Za-z0-9.]+/g, "_"));
  if (existsSync(file) && statSync(file).size > 1000) return file;
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({ action: "query", titles: "File:" + title, prop: "imageinfo", iiprop: "url", format: "json" }).forEach(([k, v]) => u.searchParams.set(k, v));
  const j = await (await fetch(u, { headers: UA })).json();
  const url = Object.values(j.query.pages)[0].imageinfo[0].url;
  writeFileSync(file, Buffer.from(await (await fetch(url, { headers: UA })).arrayBuffer()));
  return file;
}

for (const c of CLIPS) {
  const src = await fetchSource(c.src);
  const base = c.loop
    ? // laço sem emenda: o fim (últimos `loop` s) se funde com o começo, em potência igual
      `[0:a]atrim=${c.from + c.loop}:${c.from + c.dur},asetpts=N/SR/TB[A];[0:a]atrim=${c.from}:${c.from + c.loop},asetpts=N/SR/TB[B];[A][B]acrossfade=d=${c.loop}:c1=qsin:c2=qsin,aformat=channel_layouts=mono`
    : `[0:a]atrim=${c.from}:${c.from + c.dur},asetpts=N/SR/TB,aformat=channel_layouts=mono` + (c.fadeIn ? `,afade=t=in:d=${c.fadeIn}` : "") + (c.fadeOut ? `,afade=t=out:st=${c.dur - c.fadeOut}:d=${c.fadeOut}` : "");
  // 1ª passada: mede o pico; 2ª: aplica o ganho até o pico alvo (dBFS), tira o ruído subgrave e codifica
  const probe = spawnSync("ffmpeg", ["-hide_banner", "-i", src, "-filter_complex", `${base},volumedetect[o]`, "-map", "[o]", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const mv = /max_volume:\s*(-?[\d.]+) dB/.exec(probe);
  const gain = mv ? c.peak - parseFloat(mv[1]) : 0;
  const file = join(OUT, c.out + ".mp3");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-filter_complex", `${base},highpass=f=35,volume=${gain.toFixed(2)}dB[o]`, "-map", "[o]", "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", `${c.kbps ?? 64}k`, file]);
  console.log(c.out.padEnd(14), `${(statSync(file).size / 1024).toFixed(0)} KB`, `ganho ${gain.toFixed(1)} dB`);
}
