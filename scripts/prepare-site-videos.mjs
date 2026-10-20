/**
 * Gera versões leves dos vídeos reais da Hora da Festa para o site.
 * Uso: node scripts/prepare-site-videos.mjs
 */
import { mkdir } from "fs/promises";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { statSync } from "fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "MaterialSite", "Fotos hora da festa");
const videoDir = join(root, "public", "videos", "site");
const posterDir = join(root, "public", "images", "site", "posters");

const picks = [
  ["algodao", "Comidas_/algodão doce/IMG_0135.MOV"],
  ["churros", "Comidas_/churros/IMG_7496.MOV"],
  ["hamburguer", "Comidas_/mini hamburguer_/IMG_2083.mov"],
  ["barraquinha", "barraquinhas/IMG_8549.MOV"],
  ["crepe", "Comidas_/crepe/VIDEO-2024-03-14-16-56-38.mp4"],
];

await mkdir(videoDir, { recursive: true });
await mkdir(posterDir, { recursive: true });

for (const [name, rel] of picks) {
  const input = join(srcRoot, ...rel.split("/"));
  const video = join(videoDir, `${name}.mp4`);
  const poster = join(posterDir, `${name}.jpg`);

  const encoded = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      input,
      "-t",
      "12",
      "-an",
      "-vf",
      "scale=720:-2:force_original_aspect_ratio=decrease,fps=30",
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "28",
      "-preset",
      "veryfast",
      "-movflags",
      "+faststart",
      video,
    ],
    { stdio: "ignore" }
  );
  if (encoded.status !== 0) {
    console.error("falhou", name);
    process.exit(encoded.status ?? 1);
  }

  spawnSync(
    "ffmpeg",
    ["-y", "-ss", "0.8", "-i", input, "-frames:v", "1", "-vf", "scale=720:-2", poster],
    { stdio: "ignore" }
  );

  const mb = (statSync(video).size / 1024 / 1024).toFixed(1);
  console.log(`${name}.mp4  ${mb} MB`);
}
