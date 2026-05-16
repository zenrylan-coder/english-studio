import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CET4_PATH = path.join(ROOT, "public", "data", "v2", "word-banks", "cet4.json");
const BATCH_SIZE = 100;
const batchArg = String(process.argv[2] || "001").padStart(3, "0");
const PATCH_PATH = path.join(ROOT, "scripts", "word-patches", `patch-cet4-examplecn-batch-${batchArg}.json`);

const MODEL_BASE_URL = process.env.MODEL_BASE_URL;
const MODEL_API_KEY = process.env.MODEL_API_KEY;
const MODEL_NAME = process.env.MODEL_NAME;

if (!MODEL_BASE_URL || !MODEL_API_KEY || !MODEL_NAME) {
  console.error("Missing required env vars: MODEL_BASE_URL / MODEL_API_KEY / MODEL_NAME");
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function targetEntries(entries) {
  return entries.filter((entry) => {
    const example = String(entry?.example ?? "").trim();
    const exampleCn = String(entry?.exampleCn ?? "").trim();
    return example && !exampleCn;
  });
}

async function translateExample(word, example) {
  const system =
    "You translate English example sentences for Chinese English learners. Return only natural Simplified Chinese, no quotes, no markdown, no numbering, no explanations.";
  const user = [
    `Word: ${word}`,
    `English example: ${example}`,
    "Task: translate the example into natural Simplified Chinese for learners.",
    "Rules:",
    "- output only the Chinese translation",
    "- no quotes",
    "- no markdown",
    "- keep it natural and concise",
  ].join("\n");

  const res = await fetch(`${MODEL_BASE_URL.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MODEL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  const cn = String(text ?? "").trim().replace(/^["'“”]+|["'“”]+$/g, "");
  if (!cn) {
    throw new Error("Empty translation");
  }
  return cn;
}

function validatePatchEntry(entry, sourceMap) {
  const source = sourceMap.get(entry.wordId);
  if (!source) return "word_not_found";
  if (String(source.word ?? "") !== String(entry.word ?? "")) return "word_mismatch";
  if (String(source.example ?? "") !== String(entry.oldExample ?? "")) return "old_example_mismatch";
  if (!String(entry.newExampleCn ?? "").trim()) return "empty_newExampleCn";
  return null;
}

async function main() {
  const entries = readJson(CET4_PATH);
  const sourceMap = new Map(entries.map((item) => [item.wordId, item]));
  const targets = targetEntries(entries).slice(0, BATCH_SIZE);

  let processed = 0;
  let merged = 0;
  let failed = 0;
  const patch = [];

  for (const entry of targets) {
    processed += 1;
    try {
      const newExampleCn = await translateExample(entry.word, entry.example);
      const patchEntry = {
        wordId: entry.wordId,
        word: entry.word,
        oldExample: entry.example,
        newExampleCn,
      };
      const problem = validatePatchEntry(patchEntry, sourceMap);
      if (problem) {
        failed += 1;
        continue;
      }
      patch.push(patchEntry);
    } catch {
      failed += 1;
    }
  }

  writeJson(PATCH_PATH, patch);

  for (const item of patch) {
    const target = sourceMap.get(item.wordId);
    if (!target) {
      failed += 1;
      continue;
    }
    const problem = validatePatchEntry(item, sourceMap);
    if (problem) {
      failed += 1;
      continue;
    }
    target.exampleCn = item.newExampleCn;
    merged += 1;
  }

  writeJson(CET4_PATH, entries);

  const remaining = targetEntries(entries).length;
  console.log(
    JSON.stringify(
      {
        processed,
        merged,
        failed,
        remaining,
        patchFile: path.relative(ROOT, PATCH_PATH).replace(/\\/g, "/"),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
