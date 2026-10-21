import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = join(root, "MaterialSite");
const out = join(root, "public", "images", "site");
await mkdir(out, { recursive: true });

const picks = [
  ["stalls-day", "fotobarraquinhas/WhatsApp Image 2026-10-20 at 19.43.07.jpeg"],
  ["stalls-row", "fotobarraquinhas/DD3A9D2D-22AF-4CAA-8590-88742352E056.JPG.jpeg"],
  ["stalls-indoor", "fotobarraquinhas/WhatsApp Image 2026-10-20 at 19.43.08.jpeg"],
  ["stalls-night", "fotobarraquinhas/WhatsApp Image 2026-10-20 at 19.43.07 (1).jpeg"],
  ["burgers-tower", "fotosEVENTOS/WhatsApp Image 2026-10-21 at 10.51.38.jpeg"],
  ["evento-festa", "fotosEVENTOS/WhatsApp Image 2026-10-21 at 10.51.39.jpeg"],
  ["evento-crepe", "fotosEVENTOS/WhatsApp Image 2026-10-21 at 10.55.58.jpeg"],
  ["mesa-buffet", "MesasDeComida/WhatsApp Image 2026-10-20 at 19.45.50 (1).jpeg"],
  ["mesa-salada", "MesasDeComida/WhatsApp Image 2026-10-20 at 19.45.49 (1).jpeg"],
  ["mesa-festa", "MesasDeComida/WhatsApp Image 2026-10-20 at 19.45.53.jpeg"],
  ["equipe-garcons", "EQUIPE/4171B2F5-C1B4-430C-A288-AFD8FD821D98.JPG.jpeg"],
  ["equipe-time", "EQUIPE/WhatsApp Image 2026-10-20 at 20.01.25.jpeg"],
  ["feedback-1", "FEEDBACK/WhatsApp Image 2026-10-20 at 19.51.56.jpeg"],
  ["feedback-2", "FEEDBACK/WhatsApp Image 2026-10-20 at 19.52.59.jpeg"],
  ["feedback-3", "FEEDBACK/WhatsApp Image 2026-10-20 at 19.51.56 (3).jpeg"],
];

for (const [name, rel] of picks) {
  const input = join(base, ...rel.split("/"));
  const buf = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  await writeFile(join(out, `${name}.jpg`), buf);
  console.log(name, `${(buf.length / 1024).toFixed(0)} KB`);
}
