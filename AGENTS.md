<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Word Bank Pipeline Guardrails

For the English Studio word-bank completion pipeline:

- Only allowed to modify:
  - `public/data/v2/word-banks/*.json`
  - `scripts/word-patches/**`
  - `scripts/word-pipeline/**`
- Explicitly forbidden to modify:
  - `src/**`
  - `functions/**`
  - `next.config.ts`
  - `.gitignore`
  - any CloudBase / Vercel / voice / UI related file
- Audit / validation scripts must be read-only unless the user explicitly asks for patch generation or merge.
- `zhuanshengben.json` is excluded from the generic CET4/CET6/kaoyan/IELTS pipeline unless the user explicitly names it.
