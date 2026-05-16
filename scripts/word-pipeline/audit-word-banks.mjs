import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const WORD_BANK_DIR = path.join(ROOT, "public", "data", "v2", "word-banks");
const TARGET_BANKS = ["cet4", "cet6", "kaoyan", "ielts"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isSingleWord(word) {
  if (typeof word !== "string") return false;
  return !word.includes(" ") && !word.includes("/") && !word.includes("-");
}

function classifyEntry(entry) {
  return isSingleWord(entry?.word) ? "single_word" : "phrase_or_special";
}

function summarizeBank(entries) {
  let exampleEmpty = 0;
  let exampleCnEmpty = 0;
  let exampleOnlyMissingCn = 0;
  let singleWordCount = 0;
  let phraseOrSpecialCount = 0;

  for (const entry of entries) {
    const example = String(entry?.example ?? "").trim();
    const exampleCn = String(entry?.exampleCn ?? "").trim();
    const kind = classifyEntry(entry);

    if (kind === "single_word") singleWordCount += 1;
    else phraseOrSpecialCount += 1;

    if (!example) exampleEmpty += 1;
    if (!exampleCn) exampleCnEmpty += 1;
    if (example && !exampleCn) exampleOnlyMissingCn += 1;
  }

  return {
    total: entries.length,
    exampleEmpty,
    exampleCnEmpty,
    exampleOnlyMissingCn,
    singleWordCount,
    phraseOrSpecialCount,
  };
}

function main() {
  const report = {};

  for (const bank of TARGET_BANKS) {
    const filePath = path.join(WORD_BANK_DIR, `${bank}.json`);
    if (!fs.existsSync(filePath)) {
      report[bank] = { error: "missing file" };
      continue;
    }
    const entries = readJson(filePath);
    report[bank] = summarizeBank(entries);
  }

  console.log(JSON.stringify(report, null, 2));
}

main();
