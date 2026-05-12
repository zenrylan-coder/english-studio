# zsb-example-fill-001 报告

- **备份路径**：`temp/word-sources/backup-before-zsb-example-fill-001/zhuanshengben-2026-05-12T05-58-05-062Z.json`
- **生成脚本**：`scripts/zsb-example-fill-001.mjs`
- **词库**：`public/data/v2/word-banks/zhuanshengben.json`
- **目标表**：`temp/word-sources/zsb-fill-001-targets.json`（自 audit 中 zhuanshengben、`example` 为空；按顺序截取 300 条；`belongsTo` 含「专升本英语」或「专升本英语_一本好词」）
- **匹配**：`wordId` 精确；仅当 `example` 为空时写入

| `npm run build`（Next.js 生产构建） | **通过**（2026-05-12） |

## 结果

| 项目 | 数量 |
|------|------|
| 成功写入（`example` / `exampleCn` / `exampleGeneratedByAI`） | **300** |
| 跳过 | **0** |

## 跳过明细（完整）

- （无）

## 写入字段

仅写入：`example`、`exampleCn`、`exampleGeneratedByAI`（值为 `zsb-example-fill-001`）。

## 说明

- 英文例句约 8–16 词，避免敏感题材。
- 短语及 `be …` 结构采用宽松对齐校验（允许 `am/is/…` 等形式）。
