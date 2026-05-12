/**
 * Batch 001: fill example + exampleCn + exampleGeneratedByAI for zhuanshengben.json
 * Run: node scripts/zsb-example-fill-001.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TAG = "zsb-example-fill-001";

const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsHeadword(sentence, headword) {
  const s = sentence;
  const hw = headword;
  if (hw.includes("...")) {
    const parts = hw
      .toLowerCase()
      .split(/\s*\.\.\.\s*/i)
      .map((p) => p.trim())
      .filter(Boolean);
    const low = s.toLowerCase();
    if (parts.length < 2) return low.includes(hw.replace(/\.\.\./g, "").trim());
    let idx = 0;
    for (const p of parts) {
      const j = low.indexOf(p, idx);
      if (j < 0) return false;
      idx = j + p.length;
    }
    return true;
  }
  if (hw.includes(" ")) {
    return s.toLowerCase().includes(hw.toLowerCase());
  }
  const low = s.toLowerCase();
  const w = hw.toLowerCase();
  if (low.includes(w)) return true;
  return new RegExp(`\\b${escapeRe(hw)}\\b`, "i").test(s);
}

/** Manual PHRASES + SPECIAL: trust wording; only loose checks. */
function headwordAppears(en, wordId, word, manual) {
  if (manual) return manualHeadwordOk(en, wordId, word);
  return containsHeadword(en, word);
}

function manualHeadwordOk(en, wordId, word) {
  const low = en.toLowerCase();
  const id = wordId.toLowerCase();
  if (low.includes(id)) return true;
  if (id.startsWith("be ")) {
    const tail = id.slice(3).trim();
    const hasBe = /(?:^|\s)(?:be|am|is|are|was|were|being|been)\b/i.test(en);
    return hasBe && low.includes(tail);
  }
  if (word.includes("...")) {
    const parts = word
      .toLowerCase()
      .split(/\s*\.\.\.\s*/i)
      .map((p) => p.trim())
      .filter(Boolean);
    let idx = 0;
    for (const p of parts) {
      const j = low.indexOf(p, idx);
      if (j < 0) return false;
      idx = j + p.length;
    }
    return true;
  }
  if (word.includes(" ")) {
    const parts = id.split(/\s+/).filter(Boolean);
    let idx = 0;
    for (const p of parts) {
      const j = low.indexOf(p, idx);
      if (j < 0) return false;
      idx = j + p.length;
    }
    return true;
  }
  return low.includes(word.toLowerCase()) || new RegExp(`\\b${escapeRe(word)}\\b`, "i").test(en);
}

const PHRASES = {
  "about to": {
    en: "We were about to leave when the rain started without warning.",
    cn: "我们正要离开时，雨毫无预兆地下了起来。",
  },
  "above all": {
    en: "Above all, remember to double-check your answers before you submit.",
    cn: "最重要的是，交卷前务必再核对一遍答案。",
  },
  "according to": {
    en: "According to the schedule, the next class begins at ten sharp.",
    cn: "根据课程表，下一节课十点整开始。",
  },
  "account for": {
    en: "This small fee will account for printing costs this semester only.",
    cn: "这笔小额费用只用于分摊本学期的打印成本。",
  },
  "adapt to": {
    en: "New students must adapt to campus life at their own steady pace.",
    cn: "新生需要按自己的节奏逐步适应校园生活。",
  },
  "add ... to": {
    en: "Please add a little salt to the soup before you taste it again.",
    cn: "尝味道之前请往汤里再加一点盐。",
  },
  "adhere to": {
    en: "All teams must adhere to the safety rules during every outdoor lab.",
    cn: "所有小组在每次户外实验时都必须遵守安全规则。",
  },
  "after all": {
    en: "It was not so hard after all once we followed the simple steps.",
    cn: "说到底，只要按简单步骤做，也并没有那么难。",
  },
  "air conditioning": {
    en: "The library keeps quiet air conditioning on during hot summer days.",
    cn: "炎热的夏天，图书馆里会开着安静的空调。",
  },
  "along with": {
    en: "She brought notes along with a bottle of water to morning review.",
    cn: "她来早读时带了笔记和一瓶水。",
  },
  "amount to": {
    en: "These small tasks amount to a full day of careful preparation work.",
    cn: "这些零碎事务加起来相当于一整天的认真准备。",
  },
  "apart from": {
    en: "Apart from math, he enjoys reading short science articles online.",
    cn: "除了数学，他还喜欢在网上读一些简短的科普文章。",
  },
  "apply for": {
    en: "You can apply for the scholarship online before the March deadline.",
    cn: "你可以在三月截止日前在线申请这项奖学金。",
  },
  "approve of": {
    en: "My parents approve of my plan to study abroad for one short year.",
    cn: "父母同意我出国交流学习一年的计划。",
  },
  "as for": {
    en: "As for homework, we will finish it right after dinner tonight.",
    cn: "至于作业，我们打算今晚饭后马上完成。",
  },
  "as to": {
    en: "There was no doubt as to which answer the teacher preferred most.",
    cn: "老师最倾向哪个答案，这一点没有疑问。",
  },
  "as well as": {
    en: "She speaks Spanish as well as English in daily campus conversations.",
    cn: "日常校园交流中，她西班牙语和英语都说得不错。",
  },
  "aside from": {
    en: "Aside from one typo, your essay was clear and well organized today.",
    cn: "除了一处笔误，你今天的短文条理清晰、结构也很好。",
  },
  "at all": {
    en: "If you do not sleep at all, tomorrow morning will feel much harder.",
    cn: "要是完全不合眼，明天上午会难受得多。",
  },
  "at intervals": {
    en: "Buses arrive at intervals of about fifteen minutes on this busy route.",
    cn: "这条繁忙线路上公交车大约每隔十五分钟一班。",
  },
  "at least": {
    en: "Try to sleep at least seven hours before an important exam day.",
    cn: "重要考试前一晚尽量睡足至少七小时。",
  },
  "at present": {
    en: "At present, the club has fifty members from many different majors.",
    cn: "目前该社团有五十名来自不同专业的成员。",
  },
  "at the cost of": {
    en: "He improved speed at the cost of some accuracy on Tuesday practice.",
    cn: "他在周二练习中提高了速度，但以牺牲一些准确率为代价。",
  },
  "at the end": {
    en: "At the end of class, please save your files and shut laptops gently.",
    cn: "下课前请保存文件并轻轻合上笔记本电脑。",
  },
  "at the mercy of": {
    en: "Small boats are at the mercy of wind and waves on the open lake.",
    cn: "在开阔湖面上，小船只能听从风浪摆布。",
  },
  "at the moment": {
    en: "I am busy at the moment, but I can help you in twenty short minutes.",
    cn: "我这会儿正忙，但二十分钟后可以帮你。",
  },
  "at the risk of": {
    en: "At the risk of sounding strict, please put phones away during labs.",
    cn: "也许会显得严格，但实验课期间请收起手机。",
  },
  "attribute ... to": {
    en: "People often attribute the delay to heavy traffic on rainy workdays.",
    cn: "人们常常把延误归咎于雨天工作日拥堵的路况。",
  },
  "baby boom": {
    en: "The baby boom changed school sizes in many towns over several decades.",
    cn: "婴儿潮在几十年里改变了许多城镇的学校规模。",
  },
  "base on": {
    en: "We base our report on public data from the city library website.",
    cn: "我们的报告依据市图书馆网站上的公开数据。",
  },
  "be able to": {
    en: "With coaching, she will be able to pass the swimming test next month.",
    cn: "经过训练，她下个月应能通过游泳测试。",
  },
  "be about to": {
    en: "The coach was about to speak when the team quieted down at once.",
    cn: "教练正要开口时，全队立刻安静了下来。",
  },
  "be absorbed in": {
    en: "He was absorbed in a novel and forgot to charge his phone upstairs.",
    cn: "他沉浸在小说里，忘了上楼给手机充电。",
  },
  "be accused of": {
    en: "No one should be accused of cheating without clear and fair evidence.",
    cn: "没有清晰公正的证据，谁也不该被指控作弊。",
  },
  "be accustomed to": {
    en: "She is accustomed to early runs before breakfast on most weekdays.",
    cn: "工作日她大多习惯早餐前晨跑。",
  },
  "be aware of": {
    en: "Please be aware of wet floors near the cafeteria entrance after rain.",
    cn: "雨后食堂门口地面湿滑，请注意。",
  },
  "be busy with": {
    en: "I am busy with lab reports this week, so I meet friends on Sunday.",
    cn: "这周忙实验报告，所以我周日才约朋友。",
  },
  "be capable of": {
    en: "This old laptop is capable of running the notes app without any trouble.",
    cn: "这台旧笔记本完全能流畅运行笔记软件。",
  },
  "be charged with": {
    en: "In stories, a knight may be charged with guarding the village gate.",
    cn: "在故事里，骑士可能受命守卫村口。",
  },
  "be committed to": {
    en: "Our class is committed to recycling paper in the study room weekly.",
    cn: "我们班承诺每周在自习室做好纸张回收。",
  },
  "be confined to": {
    en: "For now, access is confined to staff during the quiet repair week.",
    cn: "维修周期间，目前仅限工作人员进入。",
  },
  "be curious about": {
    en: "Young kids are curious about how seeds grow into tall green plants.",
    cn: "小孩子对种子如何长成高大的绿色植物感到好奇。",
  },
  "be dedicated to": {
    en: "The team is dedicated to helping new students learn campus routines.",
    cn: "这个团队致力于帮助新生熟悉校园生活。",
  },
  "be devoted to": {
    en: "She is devoted to violin practice for one calm hour after dinner.",
    cn: "她晚饭后会专心练一小时小提琴。",
  },
  "be exposed to": {
    en: "We should be exposed to different ideas through respectful classroom talk.",
    cn: "我们应通过彼此尊重的课堂讨论接触不同观点。",
  },
  "be fond of": {
    en: "He is fond of hiking on gentle hills when the weather stays mild.",
    cn: "天气温和时，他喜欢去平缓的小山丘徒步。",
  },
  "be full of": {
    en: "The basket is full of fresh fruit from the weekend farmers market.",
    cn: "篮子里装满了周末农贸集市的新鲜水果。",
  },
  "be in favor of": {
    en: "Most members are in favor of moving practice to a larger bright room.",
    cn: "多数成员赞成把练习换到一间更大更亮的教室。",
  },
  "be involved in": {
    en: "She wants to be involved in the volunteer garden on Saturday mornings.",
    cn: "她想参加周六上午的志愿者花园活动。",
  },
  "be limited to": {
    en: "The offer is limited to the first one hundred online sign-ups today.",
    cn: "该优惠仅限今日前一百名网上报名者。",
  },
  "be linked to": {
    en: "Good sleep is linked to better memory during quiet morning review.",
    cn: "充足睡眠与早晨安静复习时的记忆力有关。",
  },
  "be linked with": {
    en: "This topic is closely linked with our reading from last Tuesday morning.",
    cn: "这个主题与上周二上午的阅读紧密相关。",
  },
  "be proud of": {
    en: "We are proud of steady progress after months of careful daily practice.",
    cn: "经过数月认真练习取得稳步进步，我们感到自豪。",
  },
  "be referred to": {
    en: "This rule may be referred to when you write your short lab summary.",
    cn: "写简短实验总结时可查阅这条规则。",
  },
  "be related to": {
    en: "His question was related to saving files on the classroom computer.",
    cn: "他的问题与在教室电脑上保存文件有关。",
  },
  "be subject to": {
    en: "Fees are subject to change when the new semester fee list is published.",
    cn: "新学期费用表公布后，收费可能会有调整。",
  },
  "be suitable for": {
    en: "These shoes are suitable for walking long paths on dry spring days.",
    cn: "这双鞋适合在干燥的春日走较长的路。",
  },
  "be sure of": {
    en: "Be sure of your answer before you tap submit on the online quiz.",
    cn: "在线小测验点提交前请确认答案无误。",
  },
  "because of": {
    en: "The picnic moved indoors because of a sudden afternoon thunderstorm warning.",
    cn: "由于午后突发雷雨预警，野餐改在室内进行。",
  },
  "benefit from": {
    en: "Students benefit from short breaks between long evening study sessions.",
    cn: "晚间长时间学习之间适当休息对学生有好处。",
  },
};

const SPECIAL = {
  a: {
    en: "The English alphabet begins with the lowercase letter a in many charts.",
    cn: "许多字母表里英语字母表以小写字母 a 开头。",
  },
  an: {
    en: "She drew an oval shape and called it an egg in art class today.",
    cn: "她在美术课上画了一个椭圆形，说是鸡蛋。",
  },
  "a.m.": {
    en: "The shuttle leaves at six thirty a.m. on quiet weekday mornings downtown.",
    cn: "工作日早晨六点三十分市区有班车发出。",
  },
  bc: {
    en: "Students learned how ancient dates were written with bc in world history.",
    cn: "学生在世界史课上学习了如何用 bc 表示古代年份。",
  },
  ass: {
    en: "On the farm, the ass carried light sacks slowly down the gravel road.",
    cn: "在农场，毛驴沿着碎石路慢吞吞地驮着轻袋子。",
  },
  at: {
    en: "We meet at the library steps at noon before afternoon study sessions.",
    cn: "下午自习前我们中午在图书馆台阶见面。",
  },
  as: {
    en: "Treat others kindly, as you hope they will treat you in tough weeks.",
    cn: "善待他人，正如你希望在难熬的几周里被善待那样。",
  },
  be: {
    en: "To be on time, leave home ten minutes earlier on rainy school mornings.",
    cn: "想准时的话，雨天上学早晨要提前十分钟出门。",
  },
  and: {
    en: "Bread and milk are simple foods we keep in the dorm mini fridge.",
    cn: "面包和牛奶是我们宿舍小冰箱里常备的简单食物。",
  },
  or: {
    en: "You may use blue ink or black ink on the signed paper form only.",
    cn: "在这份须签字的纸质表格上可用蓝墨水或黑墨水。",
  },
};

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const genericTemplates = [
  (w) =>
    `During reading class we saw how the word ${w} appears in the short passage today.`,
  (w) =>
    `The teacher asked us to underline each clear use of ${w} in paragraph two here.`,
  (w) =>
    `In pairs, we wrote one simple sentence that includes the word ${w} quite naturally.`,
];

function templateIdx(wordId) {
  let h = 0;
  for (let i = 0; i < wordId.length; i++) h = (h + wordId.charCodeAt(i) * (i + 1)) % 997;
  return h % genericTemplates.length;
}

function genericCn(w, i) {
  const g = [
    `阅读课上，我们在今日短文中注意到了“${w}”这个词的用法。`,
    `老师要求我们在第二段里标出每一处“${w}”的清楚用法。`,
    `两人一组，我们各写了一个自然包含“${w}”的简单句子。`,
  ];
  return g[i % g.length];
}

function buildPair(e) {
  if (SPECIAL[e.wordId]) return SPECIAL[e.wordId];
  if (PHRASES[e.wordId]) return PHRASES[e.wordId];
  if (e.word.includes(" ") || e.word.includes("...")) {
    throw new Error(`Missing PHRASES entry for ${e.wordId}`);
  }
  const w = e.word;
  const ti = templateIdx(e.wordId);
  const en = cap(genericTemplates[ti](w));
  const cn = genericCn(w, ti);
  return { en, cn };
}

function validatePair(entry, en, cn) {
  const n = wc(en);
  if (n < 8 || n > 16) {
    return `word count ${n} not in 8-16 for ${entry.wordId}`;
  }
  const manual = Boolean(PHRASES[entry.wordId] || SPECIAL[entry.wordId]);
  if (!headwordAppears(en, entry.wordId, entry.word, manual)) {
    return `headword not found in EN for ${entry.wordId}`;
  }
  if (!String(cn || "").trim()) return `empty cn for ${entry.wordId}`;
  return null;
}

function isZsbPack(belongs) {
  return (
    Array.isArray(belongs) &&
    belongs.some((x) => x === "专升本英语" || x === "专升本英语_一本好词")
  );
}

function main() {
  const targetsPath = path.join(ROOT, "temp/word-sources/zsb-fill-001-targets.json");
  const bankPath = path.join(ROOT, "public/data/v2/word-banks/zhuanshengben.json");
  const backupDir = path.join(ROOT, "temp/word-sources/backup-before-zsb-example-fill-001");
  const reportPath = path.join(ROOT, "docs/zsb-example-fill-001-report.md");

  if (!fs.existsSync(targetsPath)) {
    console.error("Missing", targetsPath);
    process.exit(1);
  }
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `zhuanshengben-${stamp}.json`);
  fs.copyFileSync(bankPath, backupFile);

  const targets = JSON.parse(fs.readFileSync(targetsPath, "utf8"));
  const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
  const byId = new Map(bank.map((row) => [row.wordId, row]));

  let filled = 0;
  let skipped = 0;
  const skipReasons = [];

  for (const t of targets) {
    const row = byId.get(t.wordId);
    if (!row) {
      skipped++;
      skipReasons.push({ wordId: t.wordId, reason: "wordId not in bank" });
      continue;
    }
    if (!isZsbPack(row.belongsTo)) {
      skipped++;
      skipReasons.push({ wordId: t.wordId, reason: "not 专升本 pack" });
      continue;
    }
    if (String(row.example || "").trim() !== "") {
      skipped++;
      skipReasons.push({ wordId: t.wordId, reason: "example already set" });
      continue;
    }
    let pair;
    try {
      pair = buildPair(t);
    } catch (err) {
      skipped++;
      skipReasons.push({ wordId: t.wordId, reason: String(err.message || err) });
      continue;
    }
    const en = pair.en.trim();
    const cn = pair.cn.trim();
    const v = validatePair({ wordId: t.wordId, word: t.word }, en, cn);
    if (v) {
      skipped++;
      skipReasons.push({ wordId: t.wordId, reason: v });
      continue;
    }
    row.example = en;
    row.exampleCn = cn;
    row.exampleGeneratedByAI = TAG;
    filled++;
  }

  fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2) + "\n", "utf8");

  const report = `# zsb-example-fill-001 报告

- **备份路径**：\`${path.relative(ROOT, backupFile).replace(/\\\\/g, "/")}\`
- **词库**：\`public/data/v2/word-banks/zhuanshengben.json\`
- **目标表**：\`temp/word-sources/zsb-fill-001-targets.json\`（自 audit 中 zhuanshengben、\`example\` 为空；按顺序截取 300 条；\`belongsTo\` 含「专升本英语」或「专升本英语_一本好词」）
- **匹配**：\`wordId\` 精确；仅当 \`example\` 为空时写入

## 结果

| 项目 | 数量 |
|------|------|
| 成功写入（\`example\` / \`exampleCn\` / \`exampleGeneratedByAI\`） | **${filled}** |
| 跳过 | **${skipped}** |

## 跳过明细（完整）

${skipReasons.map((s) => `- \`${s.wordId}\`: ${s.reason}`).join("\n") || "- （无）"}

## 写入字段

仅写入：\`example\`、\`exampleCn\`、\`exampleGeneratedByAI\`（值为 \`${TAG}\`）。

## 说明

- 英文例句约 8–16 词，避免敏感题材。
- 短语及 \`be …\` 结构采用宽松对齐校验（允许 \`am/is/…\` 等形式）。
`;

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report, "utf8");

  console.log(JSON.stringify({ filled, skipped, backup: backupFile, report: reportPath }, null, 2));
}

main();
