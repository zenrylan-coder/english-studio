import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const WORD_BANK_DIR = path.join(ROOT, "public", "data", "v2", "word-banks");
const TARGET_BANKS = ["cet4", "cet6", "kaoyan", "ielts"];
const INVALID_PATTERNS = [/\*\*/, /<[^>]+>/i, /\[\[|\]\]/, /\bmark\b/i];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/…/g, " ")
    .replace(/[^\p{L}\p{N}\s'/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSingleWord(word) {
  if (typeof word !== "string") return false;
  return !word.includes(" ") && !word.includes("/") && !word.includes("-");
}

function containsWord(example, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(example);
}

function containsPhraseCore(example, phrase) {
  const source = normalizeText(example);
  const target = normalizeText(phrase)
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s*-\s*/g, " ");
  if (!source || !target) return false;
  if (source.includes(target)) return true;

  const tokens = target.split(" ").filter(Boolean);
  if (tokens.length === 0) return false;
  let cursor = 0;
  for (const token of tokens) {
    const idx = source.indexOf(token, cursor);
    if (idx < 0) return false;
    cursor = idx + token.length;
  }
  return true;
}

function validateEntry(entry) {
  const problems = [];
  const example = String(entry?.example ?? "");
  const exampleCn = String(entry?.exampleCn ?? "");
  const word = String(entry?.word ?? "");

  if (!example.trim()) problems.push("missing_example");
  if (!exampleCn.trim()) problems.push("missing_exampleCn");

  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(example)) {
      problems.push("invalid_example_markup");
      break;
    }
  }

  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(exampleCn)) {
      problems.push("invalid_exampleCn_markup");
      break;
    }
  }

  if (example.trim()) {
    const matchOk = isSingleWord(word)
      ? containsWord(example, word.toLowerCase())
      : containsPhraseCore(example, word);
    if (!matchOk) {
      problems.push(isSingleWord(word) ? "example_missing_word" : "example_missing_phrase_core");
    }
  }

  return problems;
}

function validateBank(bank) {
  const filePath = path.join(WORD_BANK_DIR, `${bank}.json`);
  const entries = readJson(filePath);
  const invalidEntries = [];
  let missingExample = 0;
  let missingExampleCn = 0;

  for (const entry of entries) {
    const problems = validateEntry(entry);
    if (problems.includes("missing_example")) missingExample += 1;
    if (problems.includes("missing_exampleCn")) missingExampleCn += 1;
    if (problems.length > 0) {
      invalidEntries.push({
        wordId: entry.wordId,
        word: entry.word,
        problems,
      });
    }
  }

  return {
    bank,
    total: entries.length,
    missingExample,
    missingExampleCn,
    invalidCount: invalidEntries.length,
    invalidEntries,
  };
}

function main() {
  const arg = process.argv[2];
  const banks = arg && arg !== "all" ? [arg] : TARGET_BANKS;

  for (const bank of banks) {
    if (!TARGET_BANKS.includes(bank)) {
      console.error(`Unsupported bank: ${bank}`);
      process.exit(1);
    }
  }

  const report = banks.map(validateBank);
  console.log(JSON.stringify(report, null, 2));
}

main();
