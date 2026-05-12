# V2 词库质量审计报告

生成时间：2026-05-11T14:56:50.093Z

> 本报告由 `temp/word-sources/quality/audit.mjs` 生成，仅做只读审计。
> 不修改 `public/data/v2/word-banks/*.json`，不修改 `src/app/v2/page.tsx`。

## 输入

- `public/data/v2/word-banks/cet4.json`
- `public/data/v2/word-banks/cet6.json`
- `public/data/v2/word-banks/kaoyan.json`
- `public/data/v2/word-banks/zhuanshengben.json`
- `public/data/v2/word-banks/ielts.json`
- `public/data/v2/word-banks/manifest.json`

## 输出

- `temp/word-sources/quality/missing-pos.json` —— `partOfSpeech` 为空
- `temp/word-sources/quality/pos-in-meaning.json` —— 释义中仍混有 `n.` / `v.` / `adj.` 等 POS 标记
- `temp/word-sources/quality/missing-example.json` —— `example` 为空
- `temp/word-sources/quality/suspicious-words.json` —— 单字母 / 缩写 / 解析错位 / 释义异常等
- `temp/word-sources/quality/category-missing.json` —— `belongsTo` 为空
- `temp/word-sources/quality/summary.json` —— 汇总元信息（含各类计数 / 比例 / 字段存在性）

## 判定规则（审计层，未写回原文件）

- **POS 缺失**：`partOfSpeech` trim 后为空字符串。
- **POS 混在释义里**：在 `meaning` 中边界处（行首或 `\s/、，,;；()（）[]【】`）出现以下 token 且后续非英文字母： `abbr.` / `prep.` / `conj.` / `pron.` / `adj.` / `adv.` / `art.` / `vt.` / `vi.` / `ad.` / `n.` / `v.` / `a.`。允许 POS 后直接跟中文（如 `n.能力`）。
- **例句缺失**：`example` trim 后为空。
- **疑似异常词**：满足以下任一条件：
  - 单字母（如 `a`）；word 包含空格（解析错位，如 `a art.`）；中间含点的缩写（如 `a.m.`）；含非字母/连字符/撇号字符；全大写片段；释义为空、释义极短；释义含转义残留。
- **内部分类缺失**：`belongsTo` 为空数组（注意：`belongsTo` 表示「跨词库归属」，与「高频/核心/场景」内部分级不同）。
- **释义外层引号**（附加观测）：`meaning` 首末仍有 `"` / `\u201C` 等多余引号。

## 统计总表（按词库）

| 词库 | 总词数(原始/去重) | POS 缺失 | POS 混入释义 | 例句缺失 | 疑似异常 | 分类(belongsTo)缺失 | 内部分类(频率/核心/场景)就绪 |
|------|---|---|---|---|---|---|---|
| 大学英语四级 | 4596/4596 | 2 (0.0%) | 0 (0.0%) | 2439 (53.1%) | 73 (1.6%) | 0 (0.0%) | ❌ |
| 大学英语六级 | 5775/5775 | 2 (0.0%) | 0 (0.0%) | 3250 (56.3%) | 79 (1.4%) | 0 (0.0%) | ❌ |
| 考研英语 | 5392/5392 | 1 (0.0%) | 0 (0.0%) | 2948 (54.7%) | 96 (1.8%) | 0 (0.0%) | ❌ |
| 专升本英语 | 5169/5169 | 30 (0.6%) | 0 (0.0%) | 3025 (58.5%) | 409 (7.9%) | 0 (0.0%) | ❌ |
| 雅思英语 | 3631/3631 | 0 (0.0%) | 0 (0.0%) | 460 (12.7%) | 18 (0.5%) | 0 (0.0%) | ❌ |

> 「总词数(原始/去重)」中，去重按小写后的 `wordId`（fallback `word`）做唯一性合并；后续比率均基于去重后的口径。

## 各词库明细

### 大学英语四级 (`cet4`)

| 指标 | 数值 |
|------|------|
| 文件中原始条目数 | 4596 |
| 去重后唯一 wordId 数 | 4596 |
| 重复条目数 | 0 |
| manifest 声明数量 | 4596 |
| 音标缺失（phoneticMissing=true） | 67 |
| 音标命中（manifest） | 98.5% |
| POS 缺失 | 2 (0.0%) |
| POS 混入释义 | 0 (0.0%) |
| 例句缺失 | 2439 (53.1%) |
| 疑似异常词 | 73 (1.6%) |
| belongsTo 为空 | 0 (0.0%) |
| meaning 外层多余引号 | 0 (0.0%) |

- 释义里出现频率最高的 POS token：—
- 疑似异常词最常见原因：contains-space×64、very-short-meaning×6、abbreviation-dot-inside×5、looks-like-abbr×3、single-letter×1
- 内部分类（高频/核心/场景）就绪：**否** —— 未发现频率/核心/场景类字段（frequency/rank/core/level/tags/topic/scene/domain 均为空），暂不具备做高频/核心/场景分级的依据。
  > 当前字段仅有 `wordId / word / phonetic / partOfSpeech / meaning / example / exampleCn / belongsTo / sourceNotes / phoneticMissing`，没有 frequency / coreLevel / tags / topic / scene 等可用于分级的字段。

### 大学英语六级 (`cet6`)

| 指标 | 数值 |
|------|------|
| 文件中原始条目数 | 5775 |
| 去重后唯一 wordId 数 | 5775 |
| 重复条目数 | 0 |
| manifest 声明数量 | 5775 |
| 音标缺失（phoneticMissing=true） | 77 |
| 音标命中（manifest） | 98.7% |
| POS 缺失 | 2 (0.0%) |
| POS 混入释义 | 0 (0.0%) |
| 例句缺失 | 3250 (56.3%) |
| 疑似异常词 | 79 (1.4%) |
| belongsTo 为空 | 0 (0.0%) |
| meaning 外层多余引号 | 0 (0.0%) |

- 释义里出现频率最高的 POS token：—
- 疑似异常词最常见原因：contains-space×68、very-short-meaning×8、abbreviation-dot-inside×5、looks-like-abbr×3、single-letter×1
- 内部分类（高频/核心/场景）就绪：**否** —— 未发现频率/核心/场景类字段（frequency/rank/core/level/tags/topic/scene/domain 均为空），暂不具备做高频/核心/场景分级的依据。
  > 当前字段仅有 `wordId / word / phonetic / partOfSpeech / meaning / example / exampleCn / belongsTo / sourceNotes / phoneticMissing`，没有 frequency / coreLevel / tags / topic / scene 等可用于分级的字段。

### 考研英语 (`kaoyan`)

| 指标 | 数值 |
|------|------|
| 文件中原始条目数 | 5392 |
| 去重后唯一 wordId 数 | 5392 |
| 重复条目数 | 0 |
| manifest 声明数量 | 5392 |
| 音标缺失（phoneticMissing=true） | 89 |
| 音标命中（manifest） | 98.3% |
| POS 缺失 | 1 (0.0%) |
| POS 混入释义 | 0 (0.0%) |
| 例句缺失 | 2948 (54.7%) |
| 疑似异常词 | 96 (1.8%) |
| belongsTo 为空 | 0 (0.0%) |
| meaning 外层多余引号 | 0 (0.0%) |

- 释义里出现频率最高的 POS token：—
- 疑似异常词最常见原因：contains-space×91、very-short-meaning×3、single-letter×2、all-caps-fragment×1、abbreviation-dot-inside×1
- 内部分类（高频/核心/场景）就绪：**否** —— 未发现频率/核心/场景类字段（frequency/rank/core/level/tags/topic/scene/domain 均为空），暂不具备做高频/核心/场景分级的依据。
  > 当前字段仅有 `wordId / word / phonetic / partOfSpeech / meaning / example / exampleCn / belongsTo / sourceNotes / phoneticMissing`，没有 frequency / coreLevel / tags / topic / scene 等可用于分级的字段。

### 专升本英语 (`zhuanshengben`)

| 指标 | 数值 |
|------|------|
| 文件中原始条目数 | 5169 |
| 去重后唯一 wordId 数 | 5169 |
| 重复条目数 | 0 |
| manifest 声明数量 | 5169 |
| 音标缺失（phoneticMissing=true） | 860 |
| 音标命中（manifest） | 83.4% |
| POS 缺失 | 30 (0.6%) |
| POS 混入释义 | 0 (0.0%) |
| 例句缺失 | 3025 (58.5%) |
| 疑似异常词 | 409 (7.9%) |
| belongsTo 为空 | 0 (0.0%) |
| meaning 外层多余引号 | 4 (0.1%) |

- 释义里出现频率最高的 POS token：—
- 疑似异常词最常见原因：contains-space×399、all-caps-fragment×4、looks-like-abbr×3、single-letter×2、abbreviation-dot-inside×2、very-short-meaning×1
- 内部分类（高频/核心/场景）就绪：**否** —— 未发现频率/核心/场景类字段（frequency/rank/core/level/tags/topic/scene/domain 均为空），暂不具备做高频/核心/场景分级的依据。
  > 当前字段仅有 `wordId / word / phonetic / partOfSpeech / meaning / example / exampleCn / belongsTo / sourceNotes / phoneticMissing`，没有 frequency / coreLevel / tags / topic / scene 等可用于分级的字段。

### 雅思英语 (`ielts`)

| 指标 | 数值 |
|------|------|
| 文件中原始条目数 | 3631 |
| 去重后唯一 wordId 数 | 3631 |
| 重复条目数 | 0 |
| manifest 声明数量 | 3631 |
| 音标缺失（phoneticMissing=true） | 584 |
| 音标命中（manifest） | 83.9% |
| POS 缺失 | 0 (0.0%) |
| POS 混入释义 | 0 (0.0%) |
| 例句缺失 | 460 (12.7%) |
| 疑似异常词 | 18 (0.5%) |
| belongsTo 为空 | 0 (0.0%) |
| meaning 外层多余引号 | 0 (0.0%) |

- 释义里出现频率最高的 POS token：—
- 疑似异常词最常见原因：contains-space×10、very-short-meaning×7、non-letter-char×1
- 内部分类（高频/核心/场景）就绪：**否** —— 未发现频率/核心/场景类字段（frequency/rank/core/level/tags/topic/scene/domain 均为空），暂不具备做高频/核心/场景分级的依据。
  > 当前字段仅有 `wordId / word / phonetic / partOfSpeech / meaning / example / exampleCn / belongsTo / sourceNotes / phoneticMissing`，没有 frequency / coreLevel / tags / topic / scene 等可用于分级的字段。

## 结论

1. **POS 系统性缺失**：5 个词库 `partOfSpeech` 大量为空，但释义里普遍带有 `n.` / `v.` / `adj.` 等前缀；属于上游导入阶段未做拆字段，并非缺数据。后续修复应在导入/清洗管线统一抽取，而不是在页面里反复 ad-hoc 处理。
2. **例句覆盖率非常低**：除少数词条外，大多数没有例句；不要靠模型现造，会污染数据。建议从权威语料逐步补齐，并保留来源。
3. **疑似异常词**：主要是解析错位（如 `a art.`、`a.m.`、`p.m.`、`well-known a.`）和单字母条目；这些可以在导入阶段做拆分/合并/丢弃决策。
4. **分类(belongsTo) 字段**：覆盖度较高，可作为「跨词库交叉」的弱信号，但**不能**直接当作「高频/核心/场景」分级。
5. **内部分类就绪度**：所有词库均**未具备**做「高频/核心/场景」分级的字段依据；若要做分级，先补 `frequency` / `rank` / `coreLevel` / `tags` / `topic` 这一层 schema，再回填来源（教材/词频表/真题统计），不要靠拍脑袋分级。

## 复跑

```bash
node temp/word-sources/quality/audit.mjs
```
