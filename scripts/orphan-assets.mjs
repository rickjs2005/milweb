/**
 * Varredura de assets órfãos em public/.
 *
 * Para cada arquivo de public/, procura o nome dele em todo o código-fonte.
 * O casamento é pelo NOME do arquivo, não pelo caminho: é a checagem mais
 * conservadora possível, porque um caminho montado por template
 * (`/shots/${slug}.webp`) nunca apareceria numa busca por caminho literal e o
 * arquivo seria acusado de órfão sem ser.
 *
 * Uso: node scripts/orphan-assets.mjs .
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, basename, extname } from "node:path";

const ROOT = process.argv[2];
const PUBLIC = join(ROOT, "public");

/** Pastas que nunca contêm código que eu escrevi. */
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "public", ".vercel"]);
/** Só vale procurar referência dentro de texto. */
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".md", ".mdx", ".html", ".webmanifest"]);

/**
 * Arquivos que o navegador ou a plataforma buscam por convenção, sem ninguém
 * escrever o nome deles em lugar nenhum. Acusá-los de órfãos seria um falso
 * positivo perigoso.
 */
const CONVENTION = [
  /^favicon\.ico$/i,
  /^robots\.txt$/i,
  /^sitemap.*\.xml$/i,
  /^manifest\.(json|webmanifest)$/i,
  /^apple-(touch-)?icon.*$/i,
  /^(og|opengraph|twitter)-image.*$/i,
  /^browserconfig\.xml$/i,
  /^sw\.js$/i,
  /^\.well-known/i,
];

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

// 1. Junta todo o código num texto só.
const codeFiles = (await walk(ROOT)).filter((f) => TEXT_EXT.has(extname(f)));
let haystack = "";
for (const f of codeFiles) haystack += await readFile(f, "utf8");

// 2. Lista os assets.
const assets = await walk(PUBLIC, []);

const orphans = [];
let usedBytes = 0;
let orphanBytes = 0;

for (const file of assets) {
  const rel = relative(PUBLIC, file).replaceAll("\\", "/");
  const name = basename(file);
  const size = (await stat(file)).size;

  if (CONVENTION.some((re) => re.test(rel) || re.test(name))) {
    usedBytes += size;
    continue;
  }

  // Procura o nome com extensão e também o nome sem extensão (para caminhos
  // montados como `/shots/${slug}.webp`).
  const stem = name.slice(0, name.length - extname(name).length);
  const referenced = haystack.includes(name) || haystack.includes(stem);

  if (referenced) usedBytes += size;
  else {
    orphanBytes += size;
    orphans.push({ rel, kb: Math.round(size / 1024) });
  }
}

orphans.sort((a, b) => b.kb - a.kb);

console.log(`assets em public/: ${assets.length}`);
console.log(`referenciados: ${assets.length - orphans.length} (${(usedBytes / 1024 / 1024).toFixed(1)} MB)`);
console.log(`orfaos: ${orphans.length} (${(orphanBytes / 1024 / 1024).toFixed(1)} MB)\n`);
for (const o of orphans) console.log(`${String(o.kb).padStart(6)} KB  ${o.rel}`);
