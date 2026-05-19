import type { WordConfusable } from "@/types/v2";

/** 侧载扩展：不修改 public word-banks JSON，仅按 lemma（wordId）合并到 WordItem */
export type WordItemExtras = {
  collocations?: string[];
  confusables?: WordConfusable[];
  pitfalls?: string[];
};

/**
 * CET4 等小批示范：key 与词库 `wordId` 一致（通常为 lemma 小写）。
 * 可按需增量追加，无条目的词在 UI 中不显示三块区域。
 */
export const WORD_ITEM_EXTRAS_BY_LEMMA = {
  abandon: {
    collocations: ["abandon hope", "abandon ship", "abandon a plan", "abandon the idea"],
    confusables: [
      { word: "desert", note: "多指背弃责任/离开岗位，语气更「抛弃」；abandon 可作「放弃念头」更常见。" },
      { word: "quit", note: "口语里常接动名词：quit smoking；abandon 多以名词作宾语。" },
    ],
    pitfalls: [
      "多为及物：abandon sth，少用 abandon doing（更常说 give up doing）。",
      "不要把 abandoned 误拼为 abondoned。",
    ],
  },
  ability: {
    collocations: ["the ability to do sth", "have the ability", "natural ability", "to the best of one's ability"],
    confusables: [
      { word: "capability", note: "常指「具备完成某事的能力」，略正式、偏可拆分评估。" },
      { word: "capacity", note: "capacity 可指容积/容纳量，也可指「承受能力」。" },
    ],
    pitfalls: [
      "说「做某事的能力」用不定式：ability to explain，不说 ability of explaining。",
      "复数 abilities 表多种才能；单数 ability 常表一项能力。",
    ],
  },
  abstract: {
    collocations: ["abstract concept", "abstract noun", "in the abstract"],
    confusables: [
      { word: "extract", note: "动词「提取」；（论文）摘要有时用 abstract 作名词。" },
      { word: "contract", note: "作形容词读 /ˈkɒntrækt/ 表「收缩的」义项，与 abstract 无关易混在拼读上。" },
    ],
    pitfalls: [
      "与 concrete（具体的）相对：写作里 arguments 不要过 abstract 空泛。",
      "美音 /ˈæbstrækt/，重音在首；注意音节 abs-tract 分界。",
    ],
  },
  absolute: {
    collocations: ["absolute beginner", "absolute silence", "absolute necessity"],
    confusables: [
      { word: "relative", note: "absolute 强调「毫无保留/相对」，与 relative 成对考点。" },
      { word: "complete", note: "complete success 语感接近 absolute success，侧重「完整无缺」。" },
    ],
    pitfalls: [
      "副词多为 absolutely（完全地），别把 absolute 当副词用。",
      "数学/物理里 absolute zero 等固定写法首字母不必大写。",
    ],
  },
  accept: {
    collocations: ["accept an offer", "accept responsibility", "accept the fact"],
    confusables: [
      { word: "except", note: "介词「除了」，拼写与 accept 只差首字母。" },
      { word: "expect", note: "expect 表示「期待、预料」，前缀 ex- 与 accept 元音写法易混拼。" },
      { word: "receive", note: "receive 只表「收到」；accept 含「认可和接受」。" },
    ],
    pitfalls: ["accept doing / accept that 从句都常见；少用 accept for 这类搭配。"],
  },
  access: {
    collocations: ["have access to sth", "gain access", "internet access", "easy access"],
    confusables: [
      { word: "excess", note: "过量、过度：in excess of；拼写 ae / xe 易混。" },
      { word: "assess", note: "动词「评估」，重音在后 /əˈses/。" },
    ],
    pitfalls: [
      "access to 固定：students have access to the lab。",
      "写法别写成 acess；access to 为固定搭配。",
    ],
  },
  accurate: {
    collocations: ["accurate description", "accurate information", "highly accurate"],
    confusables: [
      { word: "precise", note: "更强调界线清晰、分寸丝毫不差。" },
      { word: "exact", note: "exact number 常与 accurate 类比考核。" },
    ],
    pitfalls: ["名词 accuracy 勿拼成 accurasy；形容词 -ate 结尾。" ],
  },
  acquire: {
    collocations: ["acquire skills", "acquire knowledge", "acquire a taste for"],
    confusables: [
      { word: "require", note: "需要；前缀 re- vs ac-。" },
      { word: "inquire", note: "询问；三词 acquire / require / inquire 常与拼写题同现。" },
    ],
    pitfalls: ["acquisition 名词冗长，注意 acquisitions 在商业语境表「并购」义项。" ],
  },
  address: {
    collocations: ["address an issue", "address the audience", "email address"],
    confusables: [
      { word: "speech", note: "address 可作名词表「演说」：deliver an address。" },
      { word: "dress", note: "形近仅差首字母，易在速读中看错。" },
    ],
    pitfalls: [
      "作动词「论述/处理」常与 issue / problem 搭配：address the problem。",
      "address sb 仍可表「称呼」义项，阅读和翻译别一律译成住址。",
    ],
  },
  admit: {
    collocations: ["admit guilt", "admit defeat", "admit doing / admit that"],
    confusables: [
      { word: "submit", note: "提交；前缀 sub-；" },
      { word: "permit", note: "允许；-mit 动词族辨析。" },
    ],
    pitfalls: [
      "admit to doing 与 admit doing 在非正式语体里都见，勿按中文硬套时态。",
    ],
  },
  affect: {
    collocations: ["affect deeply", "affect one's health", "affect the outcome"],
    confusables: [
      { word: "effect", note: "affect v. / effect n. 黄金易混对；effect 偶作动词表「使发生」。" },
    ],
    pitfalls: [
      "几乎总为及物动词；不要写作 affect on，「对…有影响」用 affect sth 或 have an effect on。",
    ],
  },
  afford: {
    collocations: ["can't afford to do", "afford the time", "afford an apartment"],
    confusables: [
      { word: "effort", note: "effort 名词「努力」，拼写别混。" },
    ],
    pitfalls: [
      "常接 can't afford to do；afford 表「承担得起」多指金钱或后果。",
    ],
  },
  achieve: {
    collocations: ["achieve a goal", "achieve success", "achieve a balance", "achieve one's potential"],
    confusables: [
      { word: "accomplish", note: "侧重「完成具体任务」，achieve 强调通过努力达成目标。" },
      { word: "reach", note: "可作「达到」标准/水平，但缺少 achieve 的「主动努力」语义。" },
    ],
    pitfalls: [
      "几乎只作及物动词：achieve + 名词，不要说 achieve to do sth。",
      "拼写：i 在 e 前 → achieved，不要写成 acheived。",
    ],
  },
  adapt: {
    collocations: ["adapt to sth", "adapt oneself to", "adapt for / from", "adapt quickly"],
    confusables: [
      { word: "adopt", note: "采纳；收养：adopt a plan / adopt a child，意思完全不同。" },
      { word: "adept", note: "形容词「擅长的」：be adept at doing sth，词性也不同。" },
    ],
    pitfalls: [
      "搭配是 adapt to，不是 adapt with / adapt for sb。",
      "和 adopt 拼写只差一个字母 a/o，是高频混淆考点。",
    ],
  },
  approach: {
    collocations: ["approach the problem", "a new approach to", "approach sb about sth"],
    confusables: [
      { word: "approximate", note: "大约的；词形更长，别与 approach 混义。" },
      { word: "reproach", note: "责备；前缀 re- 改变语义。" },
    ],
    pitfalls: [
      "名词 approach to 后接名词/动名词：approach to learning。",
      "作动词「接近」及物：approach the station。",
    ],
  },
  benefit: {
    collocations: ["benefit from sth", "for your benefit", "mutual benefits", "health benefits"],
    confusables: [
      { word: "profit", note: "profit 多指金钱利润；benefit 可指抽象好处。" },
      { word: "merit", note: "优点、价值，偏正式。" },
    ],
    pitfalls: [
      "动词 benefit 不及物常接 from：benefit from practice。",
      "beneficial 形容词接 to：beneficial to students。",
    ],
  },
  challenge: {
    collocations: ["face a challenge", "rise to the challenge", "pose a challenge"],
    confusables: [
      { word: "difficulty", note: "difficulty 更中性；challenge 常含「可克服的刺激」。" },
      { word: "obstacle", note: "障碍，偏外在阻挡。" },
    ],
    pitfalls: [
      "challenge sb to do sth 固定；不要写成 challenge sb doing。",
      "形容词 challenging：a challenging exam。",
    ],
  },
  communicate: {
    collocations: ["communicate with sb", "communicate effectively", "communicate ideas / feelings", "communication skills"],
    confusables: [
      { word: "convey", note: "传达（信息/感受），偏单向输出，不强调互动。" },
      { word: "deliver", note: "可作「发表（演讲）」：deliver a speech，不等于双向沟通。" },
    ],
    pitfalls: [
      "「和某人沟通」要带介词 with：communicate with sb，不是 communicate to sb。",
      "重音在第二音节 mu-：/kəˈmjuːnɪkeɪt/，别读成错拍。",
      "派生词 communication 注意双 m 与 -tion 结尾，常拼错成 communiction。",
    ],
  },
  effort: {
    collocations: ["make an effort", "put effort into", "with great effort", "joint efforts"],
    confusables: [
      { word: "endeavor", note: "更正式的「努力 / 尝试」，常出现在书面英语里。" },
      { word: "attempt", note: "侧重「尝试」本身，未必强调努力程度。" },
    ],
    pitfalls: [
      "搭配动词是 make / put，不说 do an effort。",
      "「合力」用复数：joint efforts；指一次具体努力时用单数：a great effort。",
    ],
  },
  environment: {
    collocations: ["learning environment", "working environment", "natural environment", "protect the environment"],
    confusables: [
      { word: "atmosphere", note: "氛围；大气层。learning atmosphere 偏「感觉氛围」。" },
      { word: "surroundings", note: "周围环境（具体空间），常用复数：beautiful surroundings。" },
    ],
    pitfalls: [
      "拼写中间的 n 不要漏：envi-ron-ment，常被错写成 enviroment。",
      "泛指「自然环境」时前面带 the：protect the environment。",
    ],
  },
  focus: {
    collocations: ["focus on sth", "the focus of attention", "lose focus", "stay focused"],
    confusables: [
      { word: "concentrate", note: "concentrate on sth：意思相近，更强调「集中精力」做某事。" },
      { word: "emphasize", note: "「强调」，是讲话/写作中突出某点，不等于关注。" },
    ],
    pitfalls: [
      "焦点用介词 on，不是 to：focus on the topic。",
      "过去式两种皆可：美式偏 focused，英式可见 focussed，统一用一种即可。",
    ],
  },
  able: {
    collocations: ["be able to do", "the best we're able", "financially able", "legally able"],
    confusables: [
      { word: "capable", note: "常作形容词：capable of；able 多与不定式连用。" },
      { word: "enable", note: "动词「使能够」，别与形容词 able 混用词性。" },
    ],
    pitfalls: [
      "be able to 后可接原形动词；少用 be able of doing（不自然）。",
      "比较级可说 abler/more able，写作中多用 more able 更得体。",
    ],
  },
  abnormal: {
    collocations: ["abnormal behaviour", "abnormal levels", "abnormal psychology"],
    confusables: [
      { word: "normal", note: "反义词；前缀 ab- 表「偏离」。" },
      { word: "irregular", note: "多指不守规则，未必到「病态」语感。" },
    ],
    pitfalls: [
      "形容词 abnormal：第二音节 -nor-；不要写成 abonormal 等常见错拼。",
      "日常口语慎用形容人 abnormal，宜用 unusual 更委婉。",
    ],
  },
  aboard: {
    collocations: ["welcome aboard", "go aboard", "all aboard"],
    confusables: [
      { word: "board", note: "登船/机舱板；aboard 为副词/介词 onboard 近义。" },
      { word: "abroad", note: "出国；只差一个字母 o/r，阅读和拼写高频混。" },
    ],
    pitfalls: [
      "aboard the ship/plane：介词短语常见，不说 aboard of。",
      "勿与 abroad 混淆：welcome aboard≠study abroad。",
    ],
  },
  about: {
    collocations: ["talk about", "worry about", "about ten", "bring about"],
    confusables: [
      { word: "around", note: "about 亦可表「大约」；around 多表周围/大概。" },
      { word: "on", note: "「关于议题」也可用 on，语气更书面。" },
    ],
    pitfalls: [
      "\"What about …?\" 常用于提议或换话题；be about to 表「即将」。" ,
      "表「关于」时口语用 about 最多；极正式语体才偏 on / regarding。" ,
    ],
  },
  above: {
    collocations: ["above all", "above average", "above zero", "rise above"],
    confusables: [
      { word: "over", note: "above 多指纵向高度；over 还可表覆盖/越过。" },
      { word: "beyond", note: "beyond 常有「超出界限」含义。" },
    ],
    pitfalls: [
      "above 作介词：above the clouds；别与介词 about 混拼。" ,
      "above all 表「最重要的是」，写作常用连接。" ,
    ],
  },
  abroad: {
    collocations: ["study abroad", "go abroad", "from abroad", "live abroad"],
    confusables: [
      { word: "aboard", note: "登机/上船；字母 r 位置不同。" },
      { word: "overseas", note: "副词/形容词「在海外」，语气常更正式。" },
    ],
    pitfalls: [
      "\"去国外\"可说 go abroad，不说 go to abroad（缺 to 时 abroad 作副词）。" ,
    ],
  },
  absence: {
    collocations: ["in the absence of", "absence from school", "leave of absence"],
    confusables: [
      { word: "presence", note: "反义：presence 表在场。" },
      { word: "lack", note: "lack 可作名词表「缺乏」，语感更偏「没有某物」。" },
    ],
    pitfalls: [
      "in the absence of sb 为书面固定搭配，注意介词 of。" ,
    ],
  },
  absent: {
    collocations: ["absent from class", "absent-minded", "long absent"],
    confusables: [
      { word: "present", note: "反义：出勤/在场。" },
      { word: "vacant", note: "「空缺的」职位用 vacant，不用 absent。" },
    ],
    pitfalls: [
      "形容词「缺席」搭配 from：absent from the meeting。" ,
    ],
  },
  absolutely: {
    collocations: ["absolutely necessary", "absolutely agree", "not absolutely"],
    confusables: [
      { word: "definitely", note: "definitely 表肯定；absolutely 语气常更强。" },
      { word: "completely", note: "修饰形容词时常与 absolutely 互换。" },
    ],
    pitfalls: [
      "口语 Absolutely! 单独成句表示强烈同意。" ,
      "别与 absolute（形容词）词性混淆。" ,
    ],
  },
  absorb: {
    collocations: ["absorb information", "absorb sunlight", "be absorbed in"],
    confusables: [
      { word: "adsorb", note: "化学「吸附」，考试阅读偶见——别看错。" },
      { word: "digest", note: "digest 多用于消化信息比喻。" },
    ],
    pitfalls: [
      "be absorbed in 表「全神贯注于」，介词用 in。" ,
    ],
  },
  abundant: {
    collocations: ["abundant rainfall", "abundant evidence", "in abundant supply"],
    confusables: [
      { word: "plentiful", note: "表「充裕」常与 abundant 类比。" },
      { word: "sufficient", note: "够用未必「丰富」。" },
    ],
    pitfalls: [
      "搭配：abundant + 可数/不可数皆可；少用 abundantly redundant 冗余表达。" ,
    ],
  },
  abuse: {
    collocations: ["drug abuse", "abuse of power", "verbal abuse", "child abuse"],
    confusables: [
      { word: "misuse", note: "误用较轻；abuse 可含故意伤害。" },
      { word: "accuse", note: "形近 accus- / abuse-。" },
    ],
    pitfalls: [
      "读本族词 /əˈbjuːz/ vs 名词重音可作 /ˈæbjuːs/，读音题易混。" ,
    ],
  },
  academic: {
    collocations: ["academic achievement", "academic calendar", "academic research"],
    confusables: [
      { word: "academy", note: "academy 为名词「学会、专科院校」，词性不同于 academic。" },
      { word: "scholarly", note: "更强调「治学态度」形容词。" },
    ],
    pitfalls: [
      "\"学术的\"义项与「不切实际的」（academic point）义项需看语境。" ,
    ],
  },
  academy: {
    collocations: ["military academy", "academy of sciences", "academy award"],
    confusables: [
      { word: "school", note: "academy 多指专科学校/研究机构。" },
      { word: "university", note: "university 常指综合性大学。" },
    ],
    pitfalls: [
      "the Academy Awards 专有名词写法首字母大小写需注意。" ,
    ],
  },
  accelerate: {
    collocations: ["accelerate growth", "accelerate the pace", "accelerating inflation"],
    confusables: [
      { word: "accelerator", note: "名词「油门」；词根 accel- 同源。" },
      { word: "hurry", note: "hurry up 口语；accelerate 更书面。" },
    ],
    pitfalls: [
      "及物动词：accelerate development；少用 accelerate to speed 冗余。" ,
    ],
  },
  acceleration: {
    collocations: ["rapid acceleration", "economic acceleration"],
    confusables: [
      { word: "velocity", note: "物理语境下「速度」常与 acceleration 辨析。" },
      { word: "accelerator", note: "汽车油门与物理量 acceleration 勿混义。" },
    ],
    pitfalls: [
      "物理上下文 acceleration 常为不可数或与 a 连用视语境而定。" ,
    ],
  },
  accent: {
    collocations: ["foreign accent", "put the accent on", "regional accent"],
    confusables: [
      { word: "dialect", note: "dialect 偏重词汇语法系统；accent 偏重发音。" },
      { word: "intonation", note: "语调与口音不同层面。" },
    ],
    pitfalls: [
      "\"重音」在专业语境里常与 word stress / stress pattern 一起讨论。" ,
    ],
  },
  acceptable: {
    collocations: ["socially acceptable", "acceptable behaviour", "mutually acceptable"],
    confusables: [
      { word: "unacceptable", note: "反义形容词；acceptable 前常加 socially / morally 等。" },
      { word: "accepted", note: "accepted 为过去分词/形容词「被接受的」，与「可接受的」不同。" },
    ],
    pitfalls: [
      "acceptable than 少用；比较可说 more socially acceptable。" ,
    ],
  },
  acceptance: {
    collocations: ["gain acceptance", "universal acceptance", "letter of acceptance"],
    confusables: [
      { word: "admission", note: "admission 多指「录取、入场许可」；acceptance 偏「被接纳/认可」。" },
      { word: "rejection", note: "反义：拒绝录用或拒绝观点。" },
    ],
    pitfalls: [
      "\"接纳」与「认可」义项：social acceptance vs accept a proposal。" ,
    ],
  },
  accessory: {
    collocations: ["car accessories", "fashion accessories", "computer accessories"],
    confusables: [
      { word: "accomplice", note: "法律「共犯」与 accessory to a crime 常一起考辨析。" },
      { word: "supplement", note: "补充件；语感更中性。" },
    ],
    pitfalls: [
      "复数 accessories；注意双 s 读音与 spelling。" ,
    ],
  },
  accident: {
    collocations: ["car accident", "by accident", "accident report", "traffic accident"],
    confusables: [
      { word: "incident", note: "incident 泛指事件，未必造成伤害。" },
      { word: "incidence", note: "发生率，统计用词。" },
    ],
    pitfalls: [
      "\"偶然」短语 by accident 更标准；" ,
    ],
  },
  accidental: {
    collocations: ["accidental death", "accidental discovery", "purely accidental"],
    confusables: [
      { word: "incidental", note: "附带的、次要的；" },
    ],
    pitfalls: [
      "副词 accidentally；不要写成 accidently。" ,
    ],
  },
  accommodate: {
    collocations: ["accommodate guests", "accommodate a request", "accommodating attitude"],
    confusables: [
      { word: "adapt", note: "adapt to 环境；accommodate 多指照应、容纳。" },
    ],
    pitfalls: [
      "accommodation -mm- 双写；英美可数性差异阅读题常见。" ,
    ],
  },
  accommodation: {
    collocations: ["temporary accommodation", "student accommodation"],
    confusables: [
      { word: "adaptation", note: "adapt 名词「改编」；" },
      { word: "lodging", note: "lodging/s 住处更口语。" },
    ],
    pitfalls: [
      "美式复数 accommodations 可表「旅店房间」等服务。" ,
    ],
  },
  accompany: {
    collocations: ["accompany sb", "accompanying documents", "accompanied by"],
    confusables: [
      { word: "company", note: "keep sb company；" },
      { word: "companion", note: "可数「同伴」名词。" },
    ],
    pitfalls: [
      "弱读：company 与 accompany 音节别混；" ,
    ],
  },
  accomplish: {
    collocations: ["accomplish a mission", "accomplished musician", "accomplish one's goals"],
    confusables: [
      { word: "complete", note: "complete 强调完成末项；accomplish 偏「成事、达成难度任务」。" },
    ],
    pitfalls: [
      "名词 accomplishment；-ment 后缀拼写考点。" ,
    ],
  },
  accord: {
    collocations: ["of one's own accord", "in accord with", "reach accord"],
    confusables: [
      { word: "award", note: "award 奖赏；字形略近易混。" },
    ],
    pitfalls: [
      "\"自愿」短语 of one's own accord 写作高分搭配。" ,
    ],
  },
  accordance: {
    collocations: ["in accordance with the law", "in accordance with the plan"],
    confusables: [
      { word: "accordingly", note: "副词；accordance 仅出现在名词短语里。" },
    ],
    pitfalls: [
      "with not to：不说 in accordance to。" ,
    ],
  },
  accordingly: {
    collocations: ["act accordingly", "adjusted accordingly"],
    confusables: [
      { word: "therefore", note: "therefore/hence 等价替换；" },
      { word: "consequently", note: "更强调因果关系链。" },
    ],
    pitfalls: [
      "句首 Accordingly, … 议论文常用。" ,
    ],
  },
  account: {
    collocations: ["bank account", "take into account", "on account of", "account for"],
    confusables: [
      { word: "count", note: "account for vs count on；" },
      { word: "amount", note: "amount / account 首字母辨析。" },
    ],
    pitfalls: [
      "\"解释占比」reading 常考 account for + 百分比。" ,
    ],
  },
  accumulate: {
    collocations: ["accumulate wealth", "accumulate dust", "snow accumulates"],
    confusables: [
      { word: "collect", note: "collect 偏主动收集；accumulate 强调越积越多。" },
      { word: "amass", note: "amass fortunes 较文学/正式；语气比 pile up 重。" },
    ],
    pitfalls: [
      "主语常为 debt / dirt / savings，谓语进行时也可。" ,
    ],
  },
  accuracy: {
    collocations: ["high accuracy", "accuracy of measurement", "with accuracy"],
    confusables: [
      { word: "precision", note: "理工科阅读常对比 precision 与 accuracy。" },
      { word: "exactness", note: "强调「丝毫不差」的近义场。" },
    ],
    pitfalls: [
      "-acy 后缀；accurate ↔ accuracy 变形别丢音。" ,
    ],
  },
  accuse: {
    collocations: ["accuse sb of doing", "wrongly accused", "the accused"],
    confusables: [
      { word: "charge", note: "charge sb with offence；" },
      { word: "abuse", note: "acus- vs abus-。" },
    ],
    pitfalls: [
      "介词必须是 of：accuse him of theft。" ,
    ],
  },
  accustom: {
    collocations: ["accustom oneself to", "accustom sb to"],
    confusables: [
      { word: "custom", note: "custom 习俗；前缀 ac- 表「使习惯」动词。" },
    ],
    pitfalls: [
      "accustom sb to doing / to sth 介词固定 to。" ,
    ],
  },
  accustomed: {
    collocations: ["be accustomed to doing", "get accustomed to"],
    confusables: [
      { word: "customary", note: "customary procedure 照例；" },
      { word: "used", note: "be used to doing 与它极近，可互换语感。" },
    ],
    pitfalls: [
      "to 后接动名词表示「习以为常」：" ,
    ],
  },
  ache: {
    collocations: ["a dull ache", "ache all over", "stomach ache"],
    confusables: [
      { word: "pain", note: "pain 更广；ache 常为隐隐作痛；headache 等复合词。" },
      { word: "hurt", note: "hurt 动词/形容词更口语，ache 常作持续隐痛。" },
    ],
    pitfalls: [
      "\"疼」作动词可加 for：heart aches for sb（文学修辞）。" ,
    ],
  },
  achievement: {
    collocations: ["sense of achievement", "academic achievement", "great achievement"],
    confusables: [
      { word: "feat", note: "feat 强调「壮举」，可数。" },
    ],
    pitfalls: [
      "抽象「成就」常不可数；" ,
    ],
  },
  acid: {
    collocations: ["amino acids", "acid rain", "fatty acids"],
    confusables: [
      { word: "basis", note: "basis / acids 音节不同；阅读实验类文章注意。" },
    ],
    pitfalls: [
      "\"尖刻」比喻：acid remarks。" ,
    ],
  },
  acquaintance: {
    collocations: ["make sb's acquaintance", "casual acquaintances", "a nodding acquaintance"],
    confusables: [
      { word: "friend", note: "acquaintance 层次浅于 friend。" },
      { word: "familiarity", note: "familiarity with 表熟悉度。" },
    ],
    pitfalls: [
      "\"认识某人」可作 have a passing acquaintance with。" ,
    ],
  },
  acre: {
    collocations: ["acres of land", "farm acres"],
    confusables: [
      { word: "acreage", note: "名词「英亩面积」；" },
      { word: "hectare", note: "公制 hectare；" },
    ],
    pitfalls: [
      "英式 /ˈeɪkə(r)/；不要与 ache 读音混淆考点。" ,
    ],
  },
  across: {
    collocations: ["come across", "across from", "across borders"],
    confusables: [
      { word: "cross", note: "cross 动词穿越；across 介词副词。" },
    ],
    pitfalls: [
      "介词后直接接名词：walk across the street。" ,
    ],
  },
  act: {
    collocations: ["act as", "act on", "act quickly", "in the act"],
    confusables: [
      { word: "react", note: "react to vs act on；" },
      { word: "action", note: "名动对应。" },
    ],
    pitfalls: [
      "act like 多表「装得像」；act as 常表「担任」。" ,
    ],
  },
  action: {
    collocations: ["take action", "legal action", "action movie"],
    confusables: [
      { word: "measure", note: "take measures 常考点近义替换。" },
    ],
    pitfalls: [
      "out of action 设备「停摆」阅读理解常见。" ,
    ],
  },
  active: {
    collocations: ["active role", "remain active", "active volcano"],
    confusables: [
      { word: "positive", note: "\"积极」也可说 take a positive attitude，但 active 更偏行动力。" },
    ],
    pitfalls: [
      "active vs passive 语法术语与义项双关考题。" ,
    ],
  },
  activity: {
    collocations: ["outdoor activity", "classroom activities"],
    confusables: [
      { word: "activism", note: "activism 偏社会行动主义。" },
    ],
    pitfalls: [
      "可数与不可数视语境：" ,
    ],
  },
  actor: {
    collocations: ["leading actor", "supporting actor"],
    confusables: [
      { word: "actress", note: "性别分立称呼；" },
    ],
    pitfalls: [
      "美式也可统称 actor;" ,
    ],
  },
  actress: {
    collocations: ["award-winning actress", "stage actress"],
    confusables: [
      { word: "actor", note: "对应男性/泛指趋势见语体注释。" },
    ],
    pitfalls: [
      "\"女演员」专有拼写勿漏第二个 s。" ,
    ],
  },
  actual: {
    collocations: ["actual results", "in actual fact"],
    confusables: [
      { word: "present", note: "\"当前」义项 current/present；" },
      { word: "virtual", note: "虚实对照阅读题。" },
    ],
    pitfalls: [
      "\"竟然」类强调用法多见于口语，书面慎译成中式硬套。" ,
    ],
  },
  actually: {
    collocations: ["actually happen", "as it actually stands"],
    confusables: [
      { word: "literally", note: "二者都被口语滥用；" },
      { word: "in fact", note: "可替换的连接副词短语。" },
    ],
    pitfalls: [
      "\"实际上」议论文衔接 actually, ... 不要过于频繁。" ,
    ],
  },
  acute: {
    collocations: ["acute pain", "acute shortage", "acute angle"],
    confusables: [
      { word: "chronic", note: "医学阅读 acute vs chronic 成对考点。" },
    ],
    pitfalls: [
      "\"敏锐」义项 an acute observer。" ,
    ],
  },
  add: {
    collocations: ["add up", "add to sth", "add insult to injury"],
    confusables: [
      { word: "plus", note: "plus 介词更接近口语；" },
    ],
    pitfalls: [
      "add「补充说」可作 add that 从句：" ,
    ],
  },
  addition: {
    collocations: ["in addition", "in addition to", "with the addition of"],
    confusables: [
      { word: "additive", note: "名词添加剂；" },
    ],
    pitfalls: [
      "in addition to 后接 noun/ving；介词必须用 to。" ,
    ],
  },
  additional: {
    collocations: ["additional cost", "additional information"],
    confusables: [
      { word: "extra", note: "extra 更口语；additional 更书面统计。" },
    ],
    pitfalls: [
      "\"补充的」常与 further 替换，议论文同意替换。" ,
    ],
  },
  adequate: {
    collocations: ["adequate preparation", "adequate resources"],
    confusables: [
      { word: "sufficient", note: "adequate 与 sufficient 近义，后者更偏「足量」书面语。" },
      { word: "enough", note: "enough 更口语，位置可前可后修饰名词。" },
    ],
    pitfalls: [
      "\"勉强够用」语感：barely adequate。" ,
    ],
  },
  adjust: {
    collocations: ["adjust to doing", "adjust the seat", "readjust attitudes"],
    confusables: [
      { word: "adapt", note: "adjust 偏旋钮式微调；adapt 偏整体适应." },
      { word: "adopt", note: "三词 adopt/adapt/adjust 一齐背。" },
    ],
    pitfalls: [
      "adjustment 可数；" ,
    ],
  },
  administration: {
    collocations: ["public administration", "drug administration", "during the Bush administration"],
    confusables: [
      { word: "minister", note: "administrator / minister 政府机构阅读。" },
    ],
    pitfalls: [
      "Administration 大写美国「政府届」专有名词义项。" ,
    ],
  },
  admire: {
    collocations: ["admire sb for doing", "deeply admired"],
    confusables: [
      { word: "respect", note: "respect 可指尊敬规范；admire 多带欣赏色彩。" },
    ],
    pitfalls: [
      "admire doing 少用； admire sb for + n / doing 更自然。" ,
    ],
  },
  admission: {
    collocations: ["gain admission", "admission ticket", "admission fee"],
    confusables: [
      { word: "admittance", note: "admittance 更偏「获准进入」字面。" },
    ],
    pitfalls: [
      "admissions office 美国大学招生固定表达。" ,
    ],
  },
  adopt: {
    collocations: ["adopt a policy", "adopted child", "adopt measures"],
    confusables: [
      { word: "adapt", note: "a/o 元音辨析超高频考点。" },
    ],
    pitfalls: [
      "adoption 可数；法律「收养」「采纳政策」义项别混上下文。" ,
    ],
  },
  adult: {
    collocations: ["young adult", "adult learners"],
    confusables: [
      { word: "teenager", note: "young adult novels 书评常见词块。" },
    ],
    pitfalls: [
      "\"成人内容」rated for adults：" ,
    ],
  },
  advance: {
    collocations: ["in advance", "advance booking", "scientific advances"],
    confusables: [
      { word: "advanced", note: "形近形容词 advanced level；" },
      { word: "advantage", note: "读音与拼写辨析。" },
    ],
    pitfalls: [
      "\"推进」义项 advance the cause：" ,
    ],
  },
  advanced: {
    collocations: ["advanced course", "advanced technology"],
    confusables: [
      { word: "advance", note: "过去分词感 vs 原形名词 advance。" },
    ],
    pitfalls: [
      "\"年事已高」euphemism：advanced age。" ,
    ],
  },
  advantage: {
    collocations: ["take advantage of", "competitive advantage", "advantage over"],
    confusables: [
      { word: "merit", note: "advantage vs merit 阅读理解态度题常见。" },
    ],
    pitfalls: [
      "\"利用」短语 take advantage of sb 可作贬义，注意 tone。" ,
    ],
  },
  adventure: {
    collocations: ["spirit of adventure", "adventure story"],
    confusables: [
      { word: "venture", note: "joint venture 合资企业；" },
    ],
    pitfalls: [
      "形容词 adventurous vs adventure 名词辨析。" ,
    ],
  },
  adverb: {
    collocations: ["adverbs of frequency", "adverb clauses"],
    confusables: [
      { word: "proverb", note: "proverb 谚语；词形后部相似。" },
    ],
    pitfalls: [
      "\"副词修饰动词/形容词」语篇改错题型。" ,
    ],
  },
  advertisement: {
    collocations: ["place an advertisement", "TV advertisement"],
    confusables: [
      { word: "commercial", note: "美式 TV commercial 对等 advert。" },
    ],
    pitfalls: [
      "缩写 British ad vs American spelled-out advertisement 读音题。" ,
    ],
  },
  advice: {
    collocations: ["give advice", "a piece of advice", "professional advice"],
    confusables: [
      { word: "tip", note: "tip 更零碎；advice 常不可数。" },
      { word: "advise", note: "动词 -ise / -ize 辨析。" },
    ],
    pitfalls: [
      "\"一条建议」a piece of advice，不要说 an advice。" ,
    ],
  },
  advisable: {
    collocations: ["It is advisable to", "highly advisable"],
    confusables: [
      { word: "recommendable", note: "recommendable 少单独作表语形容词。" },
    ],
    pitfalls: [
      "后接不定式：" ,
    ],
  },
  advise: {
    collocations: ["advise sb to do", "advise against doing", "advise that clause"],
    confusables: [
      { word: "tell", note: "advise 更正式医嘱/律师建议语感。" },
    ],
    pitfalls: [
      "\"建议」不接 advise sb doing，习惯接 to do 或 advise doing。" ,
    ],
  },
  affair: {
    collocations: ["state of affairs", "private affairs"],
    confusables: [
      { word: "matter", note: "\"事情」matter 中性； affair 语感可带复杂色彩。" },
    ],
    pitfalls: [
      "\"风流韵事」义项阅读小说文本常见。" ,
    ],
  },
  affection: {
    collocations: ["show affection", "deep affection"],
    confusables: [
      { word: "infection", note: "infection 感染；与 affection 首字母与意义均不同。" },
      { word: "affect", note: "affect/affection 同源。" },
    ],
    pitfalls: [
      "不可数语感为主；" ,
    ],
  },
  afraid: {
    collocations: ["afraid of doing", "afraid to do", "I'm afraid"],
    confusables: [
      { word: "fearful", note: "fearful that 从句结构与 afraid 类比。" },
    ],
    pitfalls: [
      "\"恐怕」委婉 I'm afraid ... 常用于礼貌拒绝：" ,
    ],
  },
  afternoon: {
    collocations: ["in the afternoon", "this afternoon", "Sunday afternoon"],
    confusables: [
      { word: "morning", note: "时段介词固定 in the；" },
    ],
    pitfalls: [
      "英式 this afternoon vs 时点 at + clock 辨析。" ,
    ],
  },
  afterward: {
    collocations: ["shortly afterward", "soon afterward"],
    confusables: [
      { word: "afterwards", note: "英式 afterwards / 美式 afterward；" },
      { word: "thereafter", note: "公文 thereafter：" },
    ],
    pitfalls: [
      "副词，位置灵活，常与 shortly 连用：" ,
    ],
  },
  age: {
    collocations: ["at an early age", "come of age", "the digital age"],
    confusables: [
      { word: "era", note: "\"时代」 era 可数；" },
    ],
    pitfalls: [
      "\"年龄」可作动词：He's aging gracefully（美式 ageing）." ,
    ],
  },
  against: {
    collocations: ["vote against", "against the wind", "lean against"],
    confusables: [
      { word: "for", note: "\"支持/反对」对读题：" },
      { word: "again", note: "again / against 只差尾字母考点。" },
    ],
    pitfalls: [
      "\"反对计划」plans against terrorism 介词精读。" ,
    ],
  },
  agency: {
    collocations: ["travel agency", "government agency"],
    confusables: [
      { word: "agent", note: "agent 代办人；" },
    ],
    pitfalls: [
      "\"代理权」agency law 阅读理解偶见专有语境。" ,
    ],
  },
  agree: {
    collocations: ["agree with sb", "agree on the plan", "agree that"],
    confusables: [
      { word: "consent", note: "consent 多用于正式准许；" },
    ],
    pitfalls: [
      "agree to + 提案 / agree on + 双方都接受的内容：" ,
      "不要把 agree sb to do（不成立）写成中式英语；" ,
    ],
  },
  agreement: {
    collocations: ["reach an agreement", "in agreement", "trade agreement"],
    confusables: [
      { word: "appointment", note: "appointment 预约；字头 app- 辨析。" },
    ],
    pitfalls: [
      "可数名词；常与 reach / sign / violate 动词搭配议论文。" ,
    ],
  },
} as const satisfies Record<string, WordItemExtras>;

/** 读取侧载扩展（先 wordId，再可选 wordClean，再拼写形式 word） */
export function pickWordItemExtrasFromBankEntry(entry: WordBankEntryLike): WordItemExtras | undefined {
  const map = WORD_ITEM_EXTRAS_BY_LEMMA as Readonly<Record<string, WordItemExtras>>;
  const keys = [
    normalizeLemma(entry.wordId),
    normalizeLemma(entry.wordClean),
    normalizeLemma(entry.word),
  ].filter(Boolean) as string[];
  for (const k of keys) {
    const ex = map[k];
    if (ex) return { ...ex };
  }
  return undefined;
}

type WordBankEntryLike = {
  wordId: string;
  word: string;
  wordClean?: string;
};

export function normalizeLemma(s: string | undefined): string | undefined {
  if (s === undefined || s === null) return undefined;
  const t = String(s).trim().toLowerCase();
  return t || undefined;
}
