/**
 * Gera versões leves das fotos reais da Hora da Festa para o site.
 * Uso: node scripts/prepare-site-photos.mjs
 */
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "MaterialSite", "Fotos hora da festa");
const outDir = join(root, "public", "images", "site");

const picks = [
  ["hero", "barraquinhas/ACD0FDAC-720C-4042-AE2E-FBF91046020B.JPG"],
  ["stalls", "barraquinhas/13BB364F-7F24-4512-87DA-D9A173A722F9.JPG"],
  ["stalls-night", "barraquinhas/IMG_7441.JPG"],
  ["burgers", "Comidas_/mini hamburguer_/IMG_0523.JPG"],
  ["crepe", "Comidas_/crepe/8770DC32-0269-4901-B9C1-C19DD23BD07A.JPG"],
  ["churros", "Comidas_/churros/6D45A246-BE97-4403-8D78-485F3904C3E4.JPG"],
  ["pipoca", "Comidas_/pipoca/IMG_0531.JPG"],
  ["pizza", "Comidas_/mini pizza/929377CB-C051-4AC2-A786-A8DEE2BD3F5F.JPG"],
  ["buffet", "Comidas_/buffet completo/2E05AB8A-5A79-4BB6-8406-E31A2A335D74.JPG"],
  ["buffet-2", "Comidas_/buffet completo/A32CBAF5-7BB9-46B9-965E-797DC6DF2BDF.JPG"],
  ["mesa", "Mesa Posta/963B388B-EA1F-40A6-9835-0665EFFC82F4.JPG"],
  ["mesa-2", "Mesa Posta/0AB99031-5C1B-414D-9134-F7C2CAC4042C.JPG"],
  ["doces", "Mesa Posta/Canudinho.jpg"],
  ["refeicao", "Comidas_/buffet completo/IMG_1327.JPG"],
  ["equipe", "Equipe/IMG_3634.JPG"],
  ["festa", "Clientes/IMG_5557.jpeg"],
  ["abril", "Fotos novas/abril/IMG_4313.JPG"],
];

await mkdir(outDir, { recursive: true });

for (const [name, rel] of picks) {
  const input = join(srcRoot, ...rel.split("/"));
  const out = join(outDir, `${name}.jpg`);
  const buf = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 74, mozjpeg: true })
    .toBuffer();
  await writeFile(out, buf);
  console.log(`${name}.jpg  ${(buf.length / 1024).toFixed(0)} KB`);
}

console.log("ok", outDir);
