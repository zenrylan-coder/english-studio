# V2 正式学习内容入库规范（词库字段说明）

本文档约定 **V2 正式单词库** 应如何整理与入库。**不包含**考纲权威性声明或真题统计表述；正式词库由维护者从教材、资料、错题等渠道 **自行整理** 后入库。

---

## 与当前代码中 seed 数据的关系

- **`src/data/v2/wordData.ts`** 中的 **`sampleWords` / `personalPackWords` 等** 仅为 **第一批 seed learning data**，用于页面演示与学习链路验证。
- **正式词库** 后续由你本人从教材、资料、错题中整理；可再映射到代码结构或单独的数据管线中落地。
- **AI**（如辅助工具）建议仅用于：**清洗、补字段、格式转换**，得到程序可用的结构化数据；**不应**替代你对来源与质量的最终确认。
- **禁止在对外文案或元数据中声称**：词库来自「官方考纲」「真题词频统计」等除非你有可追溯的授权与依据。

---

## 正式单词条目：推荐字段

正式词库建议每条 lemma（或学习单元）至少包含下表字段，便于与学习页、复习、标签筛选等能力对齐（字段名可按实现语言调整，含义保持一致即可）。

| 字段名 | 类型建议 | 说明 |
|--------|----------|------|
| `word` | string | 英文单词（或原形；派生词可单列一条） |
| `phonetic` | string | 音标（建议统一 IPA，并注明英/美若需要） |
| `partOfSpeech` | string | 词性，如 `n.` / `v.` / `adj.` 等 |
| `meaning` | string | 中文释义 |
| `example` | string | 英文例句 |
| `exampleCn` | string | 例句中文翻译 |
| `phrase` | string 或 string[] | 常见搭配（多搭可用数组或分号分隔，团队内统一即可） |
| `level` | string | 难度，如 `basic` / `intermediate`（可按团队枚举扩展） |
| `tags` | string[] | 标签，如 `专升本`、`四级`、`写作`、`阅读` |
| `sourceNote` | string | 来源备注，如 `教材整理`、`错题整理`、`自建词库` |
| `mastered` | boolean | 是否掌握（用户侧状态；也可与全局词条分离存储） |
| `reviewCount` | number | 复习次数 |

**可选扩展（按需，非必须）**：`id`、`packId`、`createdAt`、`updatedAt`、`notes`（内部备注）等。

---

## 正式词库以后应该怎么填（流程建议）

1. **来源**：从教材章节、讲义、错题本、自建讲义中 **人工** 选定词条与例句；`sourceNote` 写清大类即可。
2. **字段**：按上表补全；`phrase`、`tags`、`level` 可与教研约定枚举值，避免混乱。
3. **质检**：例句真实可读、翻译准确；**不将 AI 输出未校验条目直接标为「权威」**。
4. **导入**：清洗后转为 JSON/CSV 或你选定的存储；再与 V2 应用对接时，保持与实现层类型一致（当前 seed 使用缩写字段名时，仅作映射参考）。
5. **与 seed 分离**：正式库上线或替换前，**保留** 现有 `wordData.ts` seed 直至你有明确的迁移计划；避免在未备份前覆盖演示数据。

---

## 示例条目（表格示意，3～5 条）

以下为 **文档示例**，不修改仓库内 `wordData.ts`：

| word | phonetic | partOfSpeech | meaning | example | exampleCn | phrase | level | tags | sourceNote | mastered | reviewCount |
|------|----------|--------------|---------|---------|-----------|--------|-------|------|------------|----------|-------------|
| approach | /əˈproʊtʃ/ | v. / n. | 接近；处理 / 方法 | Try a practical approach when you revise grammar. | 复习语法时可以试试更务实的方法。 | approach a problem; practical approach | intermediate | 四级, 写作 | 教材整理 | false | 0 |
| environment | /ɪnˈvaɪrənmənt/ | n. | 环境 | A quiet environment helps me focus. | 安静的环境有助于我集中注意力。 | learning environment; protect the environment | basic | 专升本, 阅读 | 错题整理 | false | 2 |
| prepare | /prɪˈper/ | v. | 准备 | We should prepare key sentences before the mock interview. | 模拟面试前最好先准备几句关键表达。 | prepare for; be prepared to | basic | 专升本, 口语 | 自建词库 | false | 1 |
| benefit | /ˈbenɪfɪt/ | n. / v. | 好处；有益于 | Consistent practice benefits long-term memory. | 坚持练习有益于长期记忆。 | benefit from; mutual benefits | intermediate | 四级 | 教材整理 | false | 0 |

（上表 4 条仅为示意；你可按同一列扩展为完整词库。）

---

## 与现有 TypeScript 类型的说明

当前 **`src/types/v2.ts`** 中的 **`WordItem`** 等类型面向 **seed / 演示**，字段名为 `pos`、`cn` 等缩写。

正式词库采用本文 **`partOfSpeech`、`meaning`** 等命名时，属于 **规范层**；落地到代码时可：

- 在将来增加 `FormalWordEntry` 类型并与 `WordItem` 做映射；或  
- 在导入脚本中把正式字段转为页面当前结构。

**本批次不要求**修改 `wordData.ts` 或现有类型，仅以文档固定「正式库该怎么填」的约定。

---

## 修订记录

- **第五批**：新增本文档，定义正式词库字段与流程；**不替换** `wordData.ts` 内 seed 数据。
