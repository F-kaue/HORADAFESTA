import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = join(root, "MaterialSite", "_novos");
const out = join(root, "public", "images", "site");
await mkdir(out, { recursive: true });

const picks = [
  // eventos
  ["evento-burgers", "WhatsApp Unknown 2026-10-21 at 14.05.27/WhatsApp Image 2026-10-21 at 10.51.38.jpeg"],
  ["evento-salao", "WhatsApp Unknown 2026-10-21 at 14.05.27/WhatsApp Image 2026-10-21 at 10.51.39.jpeg"],
  ["evento-convidados", "WhatsApp Unknown 2026-10-21 at 14.05.32/WhatsApp Image 2026-10-21 at 10.51.39 (1).jpeg"],
  ["evento-noite", "WhatsApp Unknown 2026-10-21 at 14.05.32/WhatsApp Image 2026-10-21 at 10.51.39 (2).jpeg"],
  ["evento-detalhe", "WhatsApp Unknown 2026-10-21 at 14.05.32/WhatsApp Image 2026-10-21 at 10.51.39 (3).jpeg"],
  ["evento-chapa", "WhatsApp Unknown 2026-10-21 at 14.05.32/WhatsApp Image 2026-10-21 at 10.51.39 (4).jpeg"],
  ["evento-fila", "WhatsApp Unknown 2026-10-21 at 14.05.32/WhatsApp Image 2026-10-21 at 10.51.39.jpeg"],
  ["evento-servindo", "WhatsApp Unknown 2026-10-21 at 14.05.32/WhatsApp Image 2026-10-21 at 10.51.40.jpeg"],
  ["evento-crepe-close", "WhatsApp Unknown 2026-10-21 at 14.05.32/WhatsApp Image 2026-10-21 at 10.55.58.jpeg"],
  // barraquinhas
  ["stalls-luz", "WhatsApp Unknown 2026-10-21 at 14.08.47/WhatsApp Image 2026-10-20 at 19.43.07 (1).jpeg"],
  ["stalls-dupla", "WhatsApp Unknown 2026-10-21 at 14.08.47/WhatsApp Image 2026-10-20 at 19.43.07 (2).jpeg"],
  ["stalls-jardim", "WhatsApp Unknown 2026-10-21 at 14.08.47/WhatsApp Image 2026-10-20 at 19.43.07.jpeg"],
  ["stalls-salao", "WhatsApp Unknown 2026-10-21 at 14.08.47/WhatsApp Image 2026-10-20 at 19.43.08.jpeg"],
  // mesas
  ["mesa-arroz", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.49 (1).jpeg"],
  ["mesa-carnes", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.49 (2).jpeg"],
  ["mesa-flores", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.49.jpeg"],
  ["mesa-completa", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.50 (1).jpeg"],
  ["mesa-saladas", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.50 (2).jpeg"],
  ["mesa-pratos", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.50 (3).jpeg"],
  ["mesa-buffet-2", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.50.jpeg"],
  ["mesa-doces-2", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.51.jpeg"],
  ["mesa-sobremesa", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.52.jpeg"],
  ["mesa-festa-2", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.45.53.jpeg"],
  ["mesa-close", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.46.00.jpeg"],
  ["mesa-final", "WhatsApp Unknown 2026-10-21 at 14.10.48/WhatsApp Image 2026-10-20 at 19.46.03.jpeg"],
  // feedback extras
  ["feedback-6", "WhatsApp Unknown 2026-10-21 at 14.12.12/WhatsApp Image 2026-10-20 at 19.51.56 (1).jpeg"],
  ["feedback-7", "WhatsApp Unknown 2026-10-21 at 14.12.12/WhatsApp Image 2026-10-20 at 19.51.56 (2).jpeg"],
  ["feedback-8", "WhatsApp Unknown 2026-10-21 at 14.12.12/WhatsApp Image 2026-10-20 at 19.51.56 (3).jpeg"],
  ["feedback-9", "WhatsApp Unknown 2026-10-21 at 14.12.12/WhatsApp Image 2026-10-20 at 19.51.56.jpeg"],
];

for (const [name, rel] of picks) {
  const input = join(base, ...rel.split("/"));
  try {
    const buf = await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
    await writeFile(join(out, `${name}.jpg`), buf);
    console.log(name, `${(buf.length / 1024).toFixed(0)} KB`);
  } catch (err) {
    console.error("FAIL", name, err.message);
  }
}
