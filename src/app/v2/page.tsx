// @ts-nocheck
"use client";
import React, { useState } from "react";
import { Badge } from "@/components/v2/Badge";
import { GroupHeader } from "@/components/v2/GroupHeader";
import { HighlightedExample } from "@/components/v2/HighlightedExample";
import { PageHeader } from "@/components/v2/PageHeader";
import { PhoneShell } from "@/components/v2/PhoneShell";
import { Progress } from "@/components/v2/Progress";
import { SectionTitle } from "@/components/v2/SectionTitle";
import { Surface } from "@/components/v2/Surface";

const tabs = [
  { key: "home", label: "首页", icon: "⌂" },
  { key: "words", label: "单词库", icon: "Aa" },
  { key: "training", label: "训练中心", icon: "◎" },
  { key: "workbench", label: "工作台", icon: "✦" },
  { key: "mine", label: "我的", icon: "◌" },
];

const wordGroups = [
  {
    title: "升学备考组",
    items: [
      { id: "cet4", name: "大学英语四级", total: 4500, learned: 18, current: true, last: "继续：第18词 adapt" },
      { id: "cet6", name: "大学英语六级", total: 5500, learned: 0, current: false, last: "" },
      { id: "kaoyan", name: "考研英语", total: 5500, learned: 12, current: false, last: "" },
      { id: "zsb", name: "专升本英语", total: 3800, learned: 6, current: false, last: "" },
      { id: "ielts", name: "雅思英语", total: 4000, learned: 9, current: false, last: "" },
    ],
  },
  {
    title: "基础学段组",
    items: [
      { id: "high", name: "高中英语", total: 3500, learned: 22, current: false, last: "" },
      { id: "middle", name: "初中英语", total: 1600, learned: 0, current: false, last: "" },
      { id: "primary", name: "小学英语", total: 800, learned: 0, current: false, last: "" },
    ],
  },
];

const sampleWords = [
  {
    word: "adapt",
    phonetic: "/əˈdæpt/",
    pos: "v.",
    cn: "适应；改编",
    example: "Students need time to adapt to a new learning environment.",
    exampleCn: "学生需要时间适应新的学习环境。",
    review: true,
  },
  {
    word: "adequate",
    phonetic: "/ˈædɪkwət/",
    pos: "adj.",
    cn: "足够的；合格的",
    example: "Adequate preparation can improve your performance in the test.",
    exampleCn: "充分准备可以提升你在考试中的表现。",
    review: true,
  },
  {
    word: "analyze",
    phonetic: "/ˈænəlaɪz/",
    pos: "v.",
    cn: "分析；研究",
    example: "We should analyze the problem before making a decision.",
    exampleCn: "做决定前，我们应该先分析这个问题。",
    review: false,
  },
];

const personalPackWords = [
  {
    word: "patience",
    phonetic: "/ˈpeɪʃns/",
    pos: "n.",
    cn: "耐心",
    example: "Learning a language requires patience and regular practice.",
    exampleCn: "学习一门语言需要耐心和规律练习。",
    review: false,
  },
  {
    word: "regular",
    phonetic: "/ˈreɡjələr/",
    pos: "adj.",
    cn: "规律的；定期的",
    example: "Regular practice helps students build confidence.",
    exampleCn: "规律练习能帮助学生建立信心。",
    review: false,
  },
  {
    word: "conversation",
    phonetic: "/ˌkɑːnvərˈseɪʃn/",
    pos: "n.",
    cn: "对话；交谈",
    example: "Useful expressions can make real conversations easier.",
    exampleCn: "实用表达能让真实对话更轻松。",
    review: false,
  },
  {
    word: "review",
    phonetic: "/rɪˈvjuː/",
    pos: "v.",
    cn: "复习；回顾",
    example: "Students should review new words after class.",
    exampleCn: "学生应该在课后复习新词。",
    review: false,
  },
  {
    word: "passage",
    phonetic: "/ˈpæsɪdʒ/",
    pos: "n.",
    cn: "段落；文章节选",
    example: "Read short passages to improve your understanding.",
    exampleCn: "阅读短篇段落能提升你的理解能力。",
    review: false,
  },
];

const personalPackMeta = {
  id: "personal-language-parse",
  name: "语言学习短文解析",
  total: 5,
  learned: 0,
  current: false,
  last: "由文本解析生成",
};

const todayTasks = [
  { title: "复习 8 个待复习词", desc: "四级核心词 · 预计 6 分钟", target: "words", done: true },
  { title: "跟读 5 句高频短句", desc: "口语跟读训练 · 预计 4 分钟", target: "shadow", done: false },
  { title: "完成 1 轮 AI 语音对话", desc: "生活出行场景 · 预计 5 分钟", target: "aiVoice", done: false },
];

const trainingCards = [
  { key: "aiVoice", title: "AI语音对话", desc: "开口练真实场景" },
  { key: "shadow", title: "口语跟读训练", desc: "练准短句发音" },
  { key: "writing", title: "写作表达训练", desc: "套用高分表达" },
];

const shadowStages = ["四级", "六级", "考研", "专升本", "雅思", "高中", "初中", "小学"];
const shadowTypes = ["学段短句", "高频短语", "长难句", "易错词"];
const writingTypes = ["万能框架", "高分句型", "话题素材", "原创范文拆解"];
const writingStages = ["四级", "六级", "考研", "专升本", "雅思"];
const aiScenes = ["日常通用", "校园学习", "生活出行", "求职面试", "考试口语", "自定义角色"];
const voices = ["女声", "男声"];
const speeds = ["慢速", "标准", "快速"];
const accents = ["美音", "英音"];

export default function WordRealmCleanPreview() {
  const [activeTab, setActiveTab] = useState("home");
  const [wordPage, setWordPage] = useState("list");
  const [selectedPack, setSelectedPack] = useState(wordGroups[0].items[0]);
  const [wordIndex, setWordIndex] = useState(0);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [accent, setAccent] = useState("美音");
  const [loopPlay, setLoopPlay] = useState(false);
  const [trainingPage, setTrainingPage] = useState("overview");
  const [writingPage, setWritingPage] = useState("overview");
  const [writingStage, setWritingStage] = useState("四级");
  const [stage, setStage] = useState("四级");
  const [shadowPage, setShadowPage] = useState("overview");
  const [shadowType, setShadowType] = useState("学段短句");
  const [shadowIndex, setShadowIndex] = useState(0);
  const [voice, setVoice] = useState("女声");
  const [speed, setSpeed] = useState("标准");
  const [scene, setScene] = useState("生活出行");
  const [recording, setRecording] = useState(false);
  const [textFallback, setTextFallback] = useState(false);
  const [customText, setCustomText] = useState("我想练习在机场询问登机口。");
  const [aiFeedback, setAiFeedback] = useState(false);
  const [aiStatusDemo, setAiStatusDemo] = useState("normal");
  const [toast, setToast] = useState("");
  const [minePage, setMinePage] = useState("overview");
  const [mistakeFilter, setMistakeFilter] = useState("发音易错");
  const [recordFilter, setRecordFilter] = useState("全部");
  const [openWordGroups, setOpenWordGroups] = useState({ "升学备考组": true, "基础学段组": false });
  const [workbenchPage, setWorkbenchPage] = useState("overview");
  const [sceneInput, setSceneInput] = useState("在机场办理值机，询问行李托运和登机口");
  const [hasRecentGenerate, setHasRecentGenerate] = useState(false);
  const [textInput, setTextInput] = useState("Learning a language requires patience and regular practice. Students should review new words, read short passages, and use useful expressions in real conversations.");
  const [hasRecentParse, setHasRecentParse] = useState(false);
  const [hasPersonalPack, setHasPersonalPack] = useState(false);
  const [showFullSceneResult, setShowFullSceneResult] = useState(false);
  const [showFullTextResult, setShowFullTextResult] = useState(false);
  const [showAllWritingItems, setShowAllWritingItems] = useState(false);
  const [writingSearch, setWritingSearch] = useState("");
  const [writingFilter, setWritingFilter] = useState("全部");

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(""), 1500);
  };

  const goTask = (target) => {
    if (target === "words") {
      setActiveTab("words");
      setWordPage("learn");
    }
    if (target === "shadow") {
      setActiveTab("training");
      setTrainingPage("shadow");
      setShadowPage("overview");
    }
    if (target === "aiVoice") {
      setActiveTab("training");
      setTrainingPage("aiVoice");
    }
  };

  const startTodayLearning = () => {
    const nextTask = todayTasks.find((task) => !task.done) || todayTasks[0];
    goTask(nextTask.target);
  };

  function renderHome() {
    const doneCount = todayTasks.filter((item) => item.done).length;
    return (
      <>
        <PageHeader title="下午好，今天稳步积累就好" desc="系统已整理好最短学习路径，点一次就能开始。" />
        <Surface className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] font-bold text-[#8A6324]">今日进度</div>
            <div className="text-[12px] font-bold text-[#8A6324]">{doneCount}/{todayTasks.length}</div>
          </div>
          <div className="mt-2"><Progress value={(doneCount / todayTasks.length) * 100} /></div>
          <div className="mt-5 text-[12px] font-bold text-[#8A6324]">继续上次学习</div>
          <h2 className="mt-2 text-[22px] font-bold leading-tight text-[#2C241C]">大学英语四级 · 第18词 adapt</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">今天建议：复习 8 个词 → 跟读 5 句 → 完成 1 轮生活出行对话。</p>
          <button onClick={startTodayLearning} className="mt-4 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">开始今日学习</button>
        </Surface>
        <div className="mt-4 space-y-3">
          {todayTasks.map((item) => (
            <button key={item.title} onClick={() => goTask(item.target)} className={`flex w-full items-center gap-3 rounded-[18px] border border-[#E6D8BF] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98] ${item.done ? "bg-[#F7EEDB] opacity-75" : "bg-[#FFF8EA]"}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${item.done ? "bg-[#D8B65E] text-[#2B2118]" : "bg-white text-[#8A6324]"}`}>{item.done ? "✓" : "○"}</div>
              <div className="min-w-0 flex-1">
                <div className={`text-[15px] font-bold ${item.done ? "text-[#8B7B67]" : "text-[#2C241C]"}`}>{item.title}</div>
                <div className="mt-1 text-[12px] text-[#7A6B57]">{item.desc}</div>
              </div>
              <div className="text-[#8A6324]">›</div>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[ ["连续学习", "6天"], ["待复习", "8"] ].map(([a, b]) => (
            <Surface key={a} className="p-4 text-center">
              <div className="text-[20px] font-bold text-[#2C241C]">{b}</div>
              <div className="mt-1 text-[12px] text-[#8A6324]">{a}</div>
            </Surface>
          ))}
        </div>
      </>
    );
  }

  const openPack = (pack) => {
    setSelectedPack(pack);
    setWordPage("learn");
    setWordIndex(0);
    if (pack.name.includes("雅思")) setAccent("英音");
    else setAccent("美音");
  };

  function renderWords() {
    const wordSource = selectedPack.id === "personal-language-parse" ? personalPackWords : sampleWords;
    const activeWords = reviewOnly ? wordSource.filter((w) => w.review) : wordSource;
    const safeIndex = activeWords.length > 0 ? Math.min(wordIndex, activeWords.length - 1) : 0;

    if (wordPage === "learn") {
      if (activeWords.length === 0) {
        return (
          <>
            <PageHeader title={selectedPack.name} desc="当前没有待复习内容。" back onBack={() => setWordPage("list")} />
            <Surface className="p-6 text-center">
              <div className="text-[20px] font-bold text-[#2C241C]">暂无待复习生词</div>
              <p className="mt-3 text-[13px] leading-6 text-[#6B5B49]">这个词库目前没有需要复习的词。你可以切回全部单词继续学习。</p>
              <button onClick={() => { setReviewOnly(false); setWordIndex(0); }} className="mt-5 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">返回全部单词</button>
            </Surface>
          </>
        );
      }
      const w = activeWords[safeIndex];
      return (
        <>
          <PageHeader title={selectedPack.name} desc="左右切换词条，进度自动保存。" back onBack={() => setWordPage("list")} />
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Surface className="p-3">
              <div className="mb-2 text-[12px] font-bold text-[#8A6324]">发音</div>
              <div className="flex gap-2">
                {accents.map((item) => (
                  <button key={item} onClick={() => setAccent(item)} className={`flex-1 rounded-full py-2 text-[12px] font-bold active:scale-95 ${accent === item ? "bg-[#3A2A1A] text-white" : "bg-white text-[#6B5B49]"}`}>{item}</button>
                ))}
              </div>
            </Surface>
            <Surface className="p-3">
              <div className="mb-2 text-[12px] font-bold text-[#8A6324]">模式</div>
              <button onClick={() => { setReviewOnly(!reviewOnly); setWordIndex(0); }} className={`w-full rounded-full py-2 text-[12px] font-bold active:scale-95 ${reviewOnly ? "bg-[#3A2A1A] text-white" : "bg-white text-[#6B5B49]"}`}>{reviewOnly ? "复习模式" : "全部单词"}</button>
            </Surface>
          </div>
          <Surface className="p-5">
            <div className="flex justify-between"><Badge>{selectedPack.total}词</Badge><Badge>{safeIndex + 1}/{activeWords.length}</Badge></div>
            <div className="mt-8 text-center">
              <div className="text-[42px] font-bold text-[#2C241C]">{w.word}</div>
              <div className="mt-2 text-[15px] text-[#8A6324]">{w.phonetic}</div>
              <div className="mt-4 flex justify-center gap-2">
                <button onClick={() => showToast(`播放${accent}发音`)} className="rounded-full border border-[#E6D8BF] bg-white/80 px-4 py-2 text-[12px] font-bold text-[#8A6324] active:scale-95">🔊 播放</button>
                <button onClick={() => { setLoopPlay(!loopPlay); showToast(loopPlay ? "已关闭循环播放" : "已开启循环播放"); }} className={`rounded-full border px-4 py-2 text-[12px] font-bold active:scale-95 ${loopPlay ? "border-[#3A2A1A] bg-[#3A2A1A] text-white" : "border-[#E6D8BF] bg-white/80 text-[#8A6324]"}`}>↻ 循环</button>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <div className="rounded-[16px] bg-white p-4"><div className="text-[12px] text-[#998B78]">词性</div><div className="mt-1 text-[15px] font-bold text-[#2C241C]">{w.pos}</div></div>
              <div className="rounded-[16px] bg-white p-4"><div className="text-[12px] text-[#998B78]">核心释义</div><div className="mt-1 text-[15px] font-bold text-[#2C241C]">{w.cn}</div></div>
              <div className="rounded-[16px] bg-white p-4">
                <div className="text-[12px] text-[#998B78]">真题风格例句</div>
                <div className="mt-2 flex items-start gap-3">
                  <button onClick={() => showToast("播放例句发音")} className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E6D8BF] bg-[#FFF8EA] text-[13px] text-[#8A6324] active:scale-95">🔊</button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] leading-6 text-[#2C241C]"><HighlightedExample sentence={w.example} word={w.word} /></div>
                    <div className="mt-2 text-[12px] leading-5 text-[#998B78]">{w.exampleCn}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <button onClick={() => setWordIndex(Math.max(0, safeIndex - 1))} className="rounded-[16px] bg-white py-3 text-[14px] font-bold text-[#8A6324] active:scale-95">上一词</button>
              <button onClick={() => showToast("已标记掌握")} className="rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-95">掌握</button>
              <button onClick={() => setWordIndex(Math.min(activeWords.length - 1, safeIndex + 1))} className="rounded-[16px] bg-white py-3 text-[14px] font-bold text-[#8A6324] active:scale-95">下一词</button>
            </div>
          </Surface>
        </>
      );
    }

    return (
      <>
        <PageHeader title="单词库" desc="最近学习置顶，分组可收起，后期注入更多词库也不乱。" />
        <Surface className="mb-5 p-4">
          <div className="text-[12px] font-bold text-[#8A6324]">最近学习</div>
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[18px] font-bold text-[#2C241C]">大学英语四级</div>
              <div className="mt-1 text-[12px] text-[#8A6324]">第18词 adapt</div>
            </div>
            <button onClick={() => openPack(wordGroups[0].items[0])} className="shrink-0 rounded-[14px] bg-[#3A2A1A] px-4 py-2.5 text-[13px] font-bold text-white active:scale-95">继续</button>
          </div>
          <div className="mt-4"><Progress value={18} /></div>
        </Surface>
        {hasPersonalPack ? (
          <section className="mb-5">
            <GroupHeader title="个人词包" count={1} open={true} onClick={() => showToast("个人词包已展开")} />
            <button onClick={() => openPack(personalPackMeta)} className="w-full rounded-[20px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[18px] font-bold text-[#2C241C]">{personalPackMeta.name}</h3>
                  <p className="mt-1 text-[12px] text-[#8A6324]">由文本解析生成 · 可继续扩充</p>
                </div>
                <div className="text-right"><div className="text-[20px] font-bold text-[#2C241C]">{personalPackMeta.total}</div><div className="text-[12px] text-[#998B78]">词</div></div>
              </div>
              <div className="mt-4"><Progress value={0} /></div>
            </button>
          </section>
        ) : null}
        <div className="space-y-5">
          {wordGroups.map((group) => {
            const open = openWordGroups[group.title];
            const visibleItems = group.items.filter((pack) => !(pack.current && group.title === "升学备考组"));
            return (
              <section key={group.title}>
                <GroupHeader title={group.title} count={group.items.length} open={open} onClick={() => setOpenWordGroups((prev) => ({ ...prev, [group.title]: !prev[group.title] }))} />
                {open ? (
                  <div className="space-y-3">
                    {visibleItems.map((pack) => (
                      <button key={pack.id} onClick={() => openPack(pack)} className="w-full rounded-[20px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-[18px] font-bold text-[#2C241C]">{pack.name}</h3>
                            {pack.current ? <p className="mt-1 text-[12px] text-[#8A6324]">{pack.last}</p> : null}
                          </div>
                          <div className="text-right"><div className="text-[20px] font-bold text-[#2C241C]">{pack.total}</div><div className="text-[12px] text-[#998B78]">词</div></div>
                        </div>
                        <div className="mt-4"><Progress value={pack.learned > 0 ? Math.max(3, (pack.learned / pack.total) * 100) : 0} /></div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </>
    );
  }

  function renderTraining() {
    if (trainingPage === "aiVoice") return renderAIVoice();
    if (trainingPage === "shadow") return renderShadow();
    if (trainingPage === "writing") return renderWriting();
    return (
      <>
        <PageHeader title="训练中心" desc="把学过的词和表达用出来。" />
        <div className="space-y-3">
          {trainingCards.map((card) => (
            <button key={card.key} onClick={() => setTrainingPage(card.key)} className="w-full rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-5 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
              <h3 className="text-[19px] font-bold text-[#2C241C]">{card.title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">{card.desc}</p>
            </button>
          ))}
        </div>
      </>
    );
  }

  function renderShadow() {
    const shadowData = {
      "学段短句": [
        { en: "Could you help me with this problem?", cn: "你能帮我看看这个问题吗？", tip: "注意 could you 的连读，语气要轻。" },
        { en: "I need more time to prepare.", cn: "我需要更多时间准备。", tip: "more time 可以连起来读。" },
        { en: "This method is useful for beginners.", cn: "这个方法对初学者很有用。", tip: "method 的 th 不要读成 s。" },
      ],
      "高频短语": [
        { en: "make progress", cn: "取得进步", tip: "progress 作名词时重音在前。" },
        { en: "take action", cn: "采取行动", tip: "take action 中 k 和 a 可自然连读。" },
        { en: "pay attention to", cn: "注意；关注", tip: "attention 重音在第二音节。" },
      ],
      "长难句": [
        { en: "Students who practice regularly are more likely to improve their speaking skills.", cn: "经常练习的学生更有可能提升口语能力。", tip: "先按 who practice regularly 断句。" },
        { en: "Although the task is difficult, it can help learners build confidence.", cn: "虽然任务很难，但它能帮助学习者建立信心。", tip: "Although 后稍作停顿。" },
        { en: "The more you use new words, the easier it becomes to remember them.", cn: "你越常使用新词，就越容易记住它们。", tip: "the more / the easier 是固定节奏。" },
      ],
      "易错词": [
        { en: "environment", cn: "环境", tip: "注意中间的 n，不要吞音。" },
        { en: "conversation", cn: "对话；交谈", tip: "conversation 重音在第三音节。" },
        { en: "adequate", cn: "足够的；合格的", tip: "adequate 结尾不要读成 ate。" },
      ],
    };

    if (shadowPage === "practice") {
      const list = shadowData[shadowType];
      const current = list[Math.min(shadowIndex, list.length - 1)];
      return (
        <>
          <PageHeader title={shadowType} desc={`${stage} · 左右切换练习句，跟读进度自动保存。`} back onBack={() => setShadowPage("overview")} />
          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <Badge>{stage}</Badge>
              <Badge>{shadowIndex + 1}/{list.length}</Badge>
            </div>
            <div className="mt-8 rounded-[22px] bg-white p-5 text-center">
              <div className="text-[22px] font-bold leading-8 text-[#2C241C]">{current.en}</div>
              <div className="mt-3 text-[13px] leading-6 text-[#7A6B57]">{current.cn}</div>
              <button onClick={() => showToast("播放标准跟读音频")} className="mt-5 rounded-full border border-[#E6D8BF] bg-[#FFF8EA] px-5 py-2.5 text-[13px] font-bold text-[#8A6324] active:scale-95">🔊 播放示范</button>
            </div>
            <Surface className="mt-4 p-4 shadow-none">
              <div className="text-[12px] font-bold text-[#8A6324]">发音提示</div>
              <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">{current.tip}</p>
            </Surface>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <button onClick={() => setShadowIndex(Math.max(0, shadowIndex - 1))} className="rounded-[16px] bg-white py-3 text-[13px] font-bold text-[#8A6324] active:scale-95">上一句</button>
              <button onClick={() => showToast("已完成本句跟读")} className="rounded-[16px] bg-[#3A2A1A] py-3 text-[13px] font-bold text-white active:scale-95">已跟读</button>
              <button onClick={() => setShadowIndex(Math.min(list.length - 1, shadowIndex + 1))} className="rounded-[16px] bg-white py-3 text-[13px] font-bold text-[#8A6324] active:scale-95">下一句</button>
            </div>
          </Surface>
        </>
      );
    }

    return (
      <>
        <PageHeader title="口语跟读训练" desc="自动记住上次学段与分类，点进来直接续练。" back onBack={() => setTrainingPage("overview")} />
        <Surface className="mb-4 p-4">
          <div className="text-[12px] font-bold text-[#8A6324]">继续上次跟读</div>
          <div className="mt-1 text-[17px] font-bold text-[#2C241C]">{stage} · {shadowType}</div>
          <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">上次停在第 {shadowIndex + 1} 句，可直接继续。</p>
          <button onClick={() => setShadowPage("practice")} className="mt-3 rounded-[14px] bg-[#3A2A1A] px-4 py-2.5 text-[12px] font-bold text-white active:scale-95">继续跟读</button>
        </Surface>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {shadowStages.map((s) => <button key={s} onClick={() => setStage(s)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${stage === s ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{s}</button>)}
        </div>
        <div className="space-y-3">
          {shadowTypes.map((t) => (
            <button key={t} onClick={() => { setShadowType(t); setShadowIndex(0); setShadowPage("practice"); }} className="w-full rounded-[18px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[16px] font-bold text-[#2C241C]">{t}</div>
                  <div className="mt-1 text-[12px] text-[#7A6B57]">当前学段：{stage} · {shadowData[t].length}句</div>
                </div>
                <div className="text-[#8A6324]">›</div>
              </div>
            </button>
          ))}
        </div>
      </>
    );
  }

  function renderAIVoice() {
    const submitRecording = () => {
      if (aiStatusDemo === "offline") {
        setRecording(false);
        showToast("当前离线，AI对话暂不可用");
        return;
      }
      if (aiStatusDemo === "micDenied") {
        setRecording(false);
        setTextFallback(true);
        showToast("麦克风不可用，已切换文字练习");
        return;
      }
      if (recording) {
        setRecording(false);
        if (aiStatusDemo === "aiFailed") {
          setAiFeedback(false);
          showToast("AI回复失败，可重试或稍后保存");
          return;
        }
        setAiFeedback(true);
        showToast("录音已结束，正在分析");
      } else {
        setRecording(true);
        setAiFeedback(false);
        showToast("开始录音");
      }
    };

    return (
      <>
        <PageHeader title="AI语音对话" desc="点击开始，点击结束。支持文字兜底。" back onBack={() => setTrainingPage("overview")} />
        <Surface className="mb-4 p-4">
          <div className="text-[12px] font-bold text-[#8A6324]">状态兜底演示</div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {[
              ["normal", "正常"],
              ["micDenied", "麦克风失败"],
              ["offline", "离线"],
              ["aiFailed", "AI失败"],
            ].map(([key, label]) => (
              <button key={key} onClick={() => { setAiStatusDemo(key); setRecording(false); setAiFeedback(false); }} className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-bold ${aiStatusDemo === key ? "bg-[#3A2A1A] text-white" : "bg-white text-[#6B5B49]"}`}>{label}</button>
            ))}
          </div>
          {aiStatusDemo !== "normal" ? (
            <p className="mt-2 text-[12px] leading-5 text-[#6B5B49]">
              {aiStatusDemo === "micDenied" ? "麦克风权限失败时，自动引导用户切换文字练习。" : aiStatusDemo === "offline" ? "离线时基础学习可用，AI对话提示联网后再试。" : "AI回复失败时，不让页面卡死，给出重试或稍后保存。"}
            </p>
          ) : null}
        </Surface>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Surface className="p-4"><div className="text-[12px] font-bold text-[#8A6324]">音色</div><div className="mt-3 flex gap-2">{voices.map((v) => <button key={v} onClick={() => setVoice(v)} className={`flex-1 rounded-full py-2 text-[12px] font-bold ${voice === v ? "bg-[#3A2A1A] text-white" : "bg-white text-[#6B5B49]"}`}>{v}</button>)}</div></Surface>
          <Surface className="p-4"><div className="text-[12px] font-bold text-[#8A6324]">语速</div><div className="mt-3 flex gap-2">{speeds.map((s) => <button key={s} onClick={() => setSpeed(s)} className={`flex-1 rounded-full py-2 text-[12px] font-bold ${speed === s ? "bg-[#3A2A1A] text-white" : "bg-white text-[#6B5B49]"}`}>{s}</button>)}</div></Surface>
        </div>
        <Surface className="p-4">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{aiScenes.map((s) => <button key={s} onClick={() => { setScene(s); setAiFeedback(false); }} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${scene === s ? "bg-[#3A2A1A] text-white" : "bg-white text-[#6B5B49]"}`}>{s}</button>)}</div>
          <div className="rounded-[28px] bg-gradient-to-br from-[#3A2A1A] to-[#15100B] p-6 text-center text-white">
            <div className="text-[12px] text-[#D8B65E]">{voice} · {speed}</div>
            <h2 className="mt-3 text-[24px] font-bold">{scene}</h2>
            <div className="mt-2 text-[13px] text-white/60">00:{recording ? "18" : "00"}</div>
            <div className="mt-8 flex h-28 items-center justify-center gap-2">
              {[18, 42, 70, 52, 86, 48, 64].map((h, i) => <div key={i} className={`w-3 rounded-full ${recording ? "bg-gradient-to-t from-[#B8872E] to-[#F4D58B]" : "bg-white/20"}`} style={{ height: `${h}px` }} />)}
            </div>
            <p className="mx-auto mt-4 max-w-xs text-[13px] leading-6 text-white/70">{recording ? "正在录音，再次点击结束并发送。" : "AI 已准备好。点击开始说话。"}</p>
            <button onClick={submitRecording} className={`mt-6 h-20 w-20 rounded-full text-[13px] font-bold shadow-[0_10px_28px_rgba(0,0,0,0.28)] active:scale-95 ${recording ? "bg-white text-[#3A2A1A]" : "bg-gradient-to-br from-[#D8B65E] to-[#B8872E] text-[#2B2118]"}`}>{recording ? "结束" : "开始"}</button>
          </div>
          <button onClick={() => setTextFallback(!textFallback)} className="mt-4 text-[12px] font-bold text-[#8A6324]">无法录音？切换文字练习</button>
          {aiStatusDemo === "offline" ? (
            <div className="mt-3 rounded-[16px] bg-white p-4 text-[12px] leading-5 text-[#6B5B49]">当前处于离线状态，单词库和跟读仍可使用；AI语音对话需要联网。</div>
          ) : null}
          {aiStatusDemo === "aiFailed" ? (
            <div className="mt-3 rounded-[16px] bg-white p-4">
              <div className="text-[13px] font-bold text-[#2C241C]">AI回复失败</div>
              <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">可以重试本轮对话，或先保存文本记录，稍后继续。</p>
              <button onClick={() => { setAiStatusDemo("normal"); showToast("已切回正常模式"); }} className="mt-3 rounded-[14px] bg-[#3A2A1A] px-4 py-2.5 text-[12px] font-bold text-white active:scale-95">重试</button>
            </div>
          ) : null}
          {textFallback ? (
            <div className="mt-3 space-y-3">
              <textarea value={customText} onChange={(e) => setCustomText(e.target.value)} className="min-h-[86px] w-full rounded-[16px] border border-[#E6D8BF] bg-white p-4 text-[13px] outline-none" />
              <button onClick={() => { setAiFeedback(true); showToast("已提交文字练习"); }} className="rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">提交文字练习</button>
            </div>
          ) : null}
        </Surface>
        <div className="mt-4 space-y-3">
          {aiFeedback ? (
            <>
              <Surface className="p-4"><div className="text-[13px] font-bold text-[#2C241C]">表达优化</div><p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">Could I get a late checkout?</p><button onClick={() => showToast("已收录到个人素材库")} className="mt-3 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">收录</button></Surface>
              <Surface className="p-4"><div className="text-[13px] font-bold text-[#2C241C]">易错音提示</div><p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">checkout 尾音不要拖长，later 的 /t/ 可以更轻。</p></Surface>
            </>
          ) : (
            <Surface className="p-4 text-center"><div className="text-[13px] font-bold text-[#2C241C]">暂无反馈</div><p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">完成一轮语音或文字练习后，这里会显示表达优化。</p></Surface>
          )}
        </div>
      </>
    );
  }

  function renderWriting() {
    const writingMap = {
      "万能框架": {
        desc: "按学段套用写作结构。",
        items: [
          ["观点引入", "It is widely believed that ...", "用于开头引出观点，四级/专升本都能直接改写。"],
          ["原因展开", "There are two main reasons for this.", "用于正文第一句，帮你自然展开论证。"],
          ["举例说明", "A typical example is that ...", "用于补充例子，避免正文只有空泛观点。"],
          ["对比转折", "However, this does not mean that ...", "用于让论证更自然，不显得单薄。"],
          ["结果影响", "As a result, ...", "用于说明某个现象带来的结果。"],
          ["总结收束", "In conclusion, ... plays an important role in ...", "用于结尾，简洁收束全文。"],
        ],
      },
      "高分句型": {
        desc: "把普通表达换成更自然的句子。",
        items: [
          ["普通", "I think it is important.", "高分替换：I attach great importance to it."],
          ["普通", "More people use AI tools.", "高分替换：An increasing number of people are turning to AI tools."],
          ["普通", "We should study hard.", "高分替换：It is necessary for us to keep learning consistently."],
          ["普通", "This problem is serious.", "高分替换：This issue deserves more attention."],
          ["普通", "It has many benefits.", "高分替换：It brings a wide range of benefits."],
          ["普通", "People should take action.", "高分替换：Effective measures should be taken."],
        ],
      },
      "话题素材": {
        desc: "按高频主题积累可用语料。",
        items: [
          ["教育", "lifelong learning", "终身学习；可用于学习、就业、社会发展类作文。"],
          ["科技", "the rapid development of technology", "科技快速发展；适合AI、互联网、效率类话题。"],
          ["社会", "a sense of responsibility", "责任感；适合青年、职业、社会参与类话题。"],
          ["环境", "environmental awareness", "环保意识；适合环保、城市、社会责任类话题。"],
          ["就业", "career development", "职业发展；适合职业规划、技能提升类作文。"],
          ["生活", "a balanced lifestyle", "平衡生活方式；适合健康、学习压力类话题。"],
        ],
      },
      "原创范文拆解": {
        desc: "看结构，不背整篇。",
        items: [
          ["开头", "引出话题 + 表明态度", "第一段只解决“我要谈什么、我的态度是什么”。"],
          ["正文", "原因1 + 原因2 + 简短例子", "正文不要堆句子，围绕两个理由展开。"],
          ["转折", "承认另一面 + 回到主观点", "让文章更自然，不像背模板。"],
          ["例子", "生活例子 + 简短解释", "例子只服务观点，不要展开太长。"],
          ["结尾", "重申观点 + 给出建议", "结尾保持短，不要强行升华。"],
          ["检查", "主题句 + 连接词 + 结尾句", "写完后检查结构是否完整。"],
        ],
      },
    };

    if (writingPage !== "overview") {
      const data = writingMap[writingPage];
      const isSaved = (index) => index === 0 || index === 2;
      const isRecent = (index) => index <= 1;
      const writingFilters = ["全部", "收藏", "最近", ...Array.from(new Set(data.items.map(([title]) => title)))];
      const keyword = writingSearch.trim().toLowerCase();
      const filteredWritingItems = data.items
        .map((item, index) => ({ item, index }))
        .filter(({ item, index }) => {
          const [title, main, desc] = item;
          const text = `${title} ${main} ${desc}`.toLowerCase();
          const matchesKeyword = !keyword || text.includes(keyword);
          const matchesFilter = writingFilter === "全部" ||
            (writingFilter === "收藏" ? isSaved(index) : writingFilter === "最近" ? isRecent(index) : title === writingFilter);
          return matchesKeyword && matchesFilter;
        });
      const visibleWritingItems = showAllWritingItems ? filteredWritingItems : filteredWritingItems.slice(0, 5);
      return (
        <>
          <PageHeader title={writingPage} desc={data.desc} back onBack={() => setWritingPage("overview")} />
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {writingStages.map((s) => (
              <button key={s} onClick={() => setWritingStage(s)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${writingStage === s ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{s}</button>
            ))}
          </div>
          <Surface className="mb-4 p-4">
            <div className="text-[12px] font-bold text-[#8A6324]">当前学段</div>
            <div className="mt-1 text-[17px] font-bold text-[#2C241C]">{writingStage}写作训练</div>
            <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">默认跟随当前学习目标，可随时切换学段。</p>
          </Surface>
          <div className="mb-4 space-y-3">
            <input value={writingSearch} onChange={(e) => { setWritingSearch(e.target.value); setShowAllWritingItems(false); }} placeholder="搜索框架 / 关键词，例如：开头、结尾、原因" className="w-full rounded-[16px] border border-[#E6D8BF] bg-white px-4 py-3 text-[13px] text-[#2C241C] outline-none placeholder:text-[#B0A18D]" />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {writingFilters.map((filter) => (
                <button key={filter} onClick={() => { setWritingFilter(filter); setShowAllWritingItems(false); }} className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-bold ${writingFilter === filter ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{filter}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {visibleWritingItems.map(({ item, index }) => {
              const [title, main, desc] = item;
              return (
              <Surface key={title + main} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[12px] font-bold text-[#8A6324]">{title}</div>
                    <div className="flex gap-1">
                      {isRecent(index) ? <span className="rounded-full bg-[#FBF2DA] px-2 py-0.5 text-[10px] font-bold text-[#8A6324]">最近</span> : null}
                      {isSaved(index) ? <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#8A6324]">收藏</span> : null}
                    </div>
                  </div>
                  <div className="mt-2 text-[15px] font-bold leading-6 text-[#2C241C]">{main}</div>
                  <p className="mt-2 text-[12px] leading-5 text-[#6B5B49]">{desc}</p>
                  <button onClick={() => showToast("已收录到个人素材库")} className="mt-3 rounded-[14px] bg-[#3A2A1A] px-4 py-2.5 text-[12px] font-bold text-white active:scale-95">收录</button>
                </Surface>
              );
            })}
            {filteredWritingItems.length === 0 ? (
              <Surface className="p-5 text-center">
                <div className="text-[15px] font-bold text-[#2C241C]">没有找到对应内容</div>
                <p className="mt-2 text-[12px] leading-5 text-[#6B5B49]">换个关键词，或切回“全部”继续查看。</p>
              </Surface>
            ) : null}
            {filteredWritingItems.length > 5 ? (
              <button onClick={() => setShowAllWritingItems(!showAllWritingItems)} className="w-full rounded-[16px] border border-[#E6D8BF] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">
                {showAllWritingItems ? "收起部分内容" : `查看更多 ${filteredWritingItems.length - 5} 条`}
              </button>
            ) : null}
          </div>
        </>
      );
    }

    return (
      <>
        <PageHeader title="写作表达训练" desc="分学段练框架、句型、素材。" back onBack={() => setTrainingPage("overview")} />
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {writingStages.map((s) => (
            <button key={s} onClick={() => setWritingStage(s)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${writingStage === s ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{s}</button>
          ))}
        </div>
        <div className="space-y-3">
          {writingTypes.map((t) => {
            const desc = {
              "万能框架": "先搭结构，再填内容",
              "高分句型": "替换低分表达",
              "话题素材": "积累常考语料",
              "原创范文拆解": "只看结构逻辑",
            }[t];
            return (
              <button key={t} onClick={() => { setWritingPage(t); setShowAllWritingItems(false); setWritingSearch(""); setWritingFilter("全部"); }} className="w-full rounded-[18px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
                <div className="text-[16px] font-bold text-[#2C241C]">{t}</div>
                <div className="mt-1 text-[12px] text-[#7A6B57]">{writingStage} · {desc}</div>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  function renderWorkbench() {
    const sceneScript = [
      ["AI", "Good morning. May I see your passport and ticket, please?"],
      ["你", "Sure. Here is my passport and ticket."],
      ["AI", "Do you have any checked luggage today?"],
      ["你", "Yes. I have one suitcase to check in."],
      ["AI", "Your boarding gate is B12. Boarding starts at 9:40."],
      ["你", "Thank you. Could you tell me where I should drop off my luggage?"],
    ];

    const shadowLines = [
      "May I check in for this flight?",
      "Where should I drop off my luggage?",
      "Could you tell me which gate I should go to?",
      "Do I need to show my passport again?",
      "What time does boarding start?",
    ];

    const usefulExpressions = [
      "May I see your passport?",
      "I have one suitcase to check in.",
      "Could you tell me where the boarding gate is?",
      "What time does boarding start?",
      "Where should I drop off my luggage?",
    ];

    const parsedWords = [
      ["patience", "n. 耐心"],
      ["regular", "adj. 规律的"],
      ["expression", "n. 表达；措辞"],
      ["conversation", "n. 对话；交谈"],
      ["review", "v. 复习；回顾"],
      ["passage", "n. 段落；文章节选"],
      ["require", "v. 需要；要求"],
      ["useful", "adj. 有用的"],
    ];

    const parsedPhrases = [
      "regular practice",
      "review new words",
      "use useful expressions",
      "real conversations",
      "short passages",
      "language learning",
      "requires patience",
    ];

    const parsedSentences = [
      "Students should review new words, read short passages, and use useful expressions in real conversations.",
      "Learning a language requires patience and regular practice.",
      "Regular practice helps students build confidence when using a new language.",
      "Useful expressions can make real conversations easier and more natural.",
    ];

    if (workbenchPage === "sceneForm") {
      return (
        <>
          <PageHeader title="自定义场景生成器" desc="输入场景，生成口语脚本。" back onBack={() => setWorkbenchPage("overview")} />
          <Surface className="p-5">
            <div className="text-[13px] font-bold text-[#2C241C]">你想练什么场景？</div>
            <textarea value={sceneInput} onChange={(e) => setSceneInput(e.target.value)} className="mt-3 min-h-[120px] w-full rounded-[16px] border border-[#E6D8BF] bg-white p-4 text-[13px] leading-6 text-[#2C241C] outline-none" />
            <button onClick={() => { setHasRecentGenerate(true); setWorkbenchPage("sceneResult"); showToast("已生成口语练习包"); }} className="mt-4 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">生成练习包</button>
          </Surface>
          <Surface className="mt-4 p-4">
            <div className="text-[13px] font-bold text-[#2C241C]">生成后会包含</div>
            <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">对话脚本、跟读短句、可收藏表达。生成内容先进入最近生成，确认有用后再收录。</p>
          </Surface>
        </>
      );
    }

    if (workbenchPage === "sceneResult") {
      const visibleSceneScript = showFullSceneResult ? sceneScript : sceneScript.slice(0, 4);
      const visibleShadowLines = showFullSceneResult ? shadowLines : shadowLines.slice(0, 3);
      const visibleUsefulExpressions = showFullSceneResult ? usefulExpressions : usefulExpressions.slice(0, 3);
      return (
        <>
          <PageHeader title="生成结果" desc="先预览，再决定收录或加入训练。" back onBack={() => setWorkbenchPage("overview")} />
          <Surface className="p-5">
            <div className="text-[12px] font-bold text-[#8A6324]">场景</div>
            <h2 className="mt-2 text-[19px] font-bold text-[#2C241C]">机场值机与行李托运</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">{sceneInput}</p>
          </Surface>

          <div className="mt-4"><SectionTitle title="对话脚本" /></div>
          <div className="space-y-2">
            {visibleSceneScript.map(([role, text], index) => (
              <Surface key={index} className="p-4">
                <div className="text-[12px] font-bold text-[#8A6324]">{role}</div>
                <div className="mt-1 text-[14px] leading-6 text-[#2C241C]">{text}</div>
              </Surface>
            ))}
          </div>

          <div className="mt-5"><SectionTitle title="跟读短句" /></div>
          <div className="space-y-2">
            {visibleShadowLines.map((line) => (
              <Surface key={line} className="flex items-center gap-3 p-4">
                <button onClick={() => showToast("播放跟读句")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E6D8BF] bg-[#FFF8EA] text-[13px] text-[#8A6324] active:scale-95">🔊</button>
                <div className="text-[14px] leading-6 text-[#2C241C]">{line}</div>
              </Surface>
            ))}
          </div>

          <div className="mt-5"><SectionTitle title="可收藏表达" /></div>
          <div className="space-y-2">
            {visibleUsefulExpressions.map((line) => (
              <Surface key={line} className="p-4">
                <div className="text-[14px] leading-6 text-[#2C241C]">{line}</div>
              </Surface>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <button onClick={() => setShowFullSceneResult(!showFullSceneResult)} className="w-full rounded-[16px] border border-[#E6D8BF] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">
              {showFullSceneResult ? "收起部分内容" : "查看完整练习包"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={() => showToast("已收录到个人素材库")} className="rounded-[16px] bg-[#3A2A1A] py-3 text-[13px] font-bold text-white active:scale-[0.98]">收录素材库</button>
            <button onClick={() => { setActiveTab("training"); setTrainingPage("shadow"); }} className="rounded-[16px] bg-white py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">加入跟读</button>
            <button onClick={() => { setActiveTab("training"); setTrainingPage("aiVoice"); setScene("自定义角色"); }} className="col-span-2 rounded-[16px] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">进入AI对话练习</button>
          </div>
        </>
      );
    }

    if (workbenchPage === "textForm") {
      return (
        <>
          <PageHeader title="文本智能解析" desc="粘贴文章，提炼生词句型。" back onBack={() => setWorkbenchPage("overview")} />
          <Surface className="p-5">
            <div className="text-[13px] font-bold text-[#2C241C]">粘贴英文文本</div>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} className="mt-3 min-h-[180px] w-full rounded-[16px] border border-[#E6D8BF] bg-white p-4 text-[13px] leading-6 text-[#2C241C] outline-none" />
            <button onClick={() => { setHasRecentParse(true); setWorkbenchPage("textResult"); showToast("已完成文本解析"); }} className="mt-4 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">开始解析</button>
          </Surface>
          <Surface className="mt-4 p-4">
            <div className="text-[13px] font-bold text-[#2C241C]">解析后会得到</div>
            <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">重点生词、高频短语、长难句。结果可生成专属词包，也可加入跟读任务。</p>
          </Surface>
        </>
      );
    }

    if (workbenchPage === "textResult") {
      const visibleParsedWords = showFullTextResult ? parsedWords : parsedWords.slice(0, 5);
      const visibleParsedPhrases = showFullTextResult ? parsedPhrases : parsedPhrases.slice(0, 5);
      const visibleParsedSentences = showFullTextResult ? parsedSentences : parsedSentences.slice(0, 2);
      return (
        <>
          <PageHeader title="解析结果" desc="默认只展示重点内容，避免信息过载。" back onBack={() => setWorkbenchPage("overview")} />
          <Surface className="p-5">
            <div className="text-[12px] font-bold text-[#8A6324]">原文摘要</div>
            <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-[#6B5B49]">{textInput}</p>
          </Surface>

          <div className="mt-4"><SectionTitle title="重点生词" /></div>
          <div className="space-y-2">
            {visibleParsedWords.map(([word, desc]) => (
              <Surface key={word} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="text-[16px] font-bold text-[#2C241C]">{word}</div>
                  <div className="mt-1 text-[12px] text-[#7A6B57]">{desc}</div>
                </div>
                <button onClick={() => showToast("已加入专属词包")} className="rounded-full bg-[#FBF2DA] px-3 py-1.5 text-[12px] font-bold text-[#8A6324] active:scale-95">加入</button>
              </Surface>
            ))}
          </div>

          <div className="mt-5"><SectionTitle title="高频短语" /></div>
          <div className="flex flex-wrap gap-2">
            {visibleParsedPhrases.map((phrase) => <button key={phrase} onClick={() => showToast("已收录短语")} className="rounded-full border border-[#E6D8BF] bg-[#FFF8EA] px-3 py-2 text-[12px] font-bold text-[#8A6324] active:scale-95">{phrase}</button>)}
          </div>

          <div className="mt-5"><SectionTitle title="长难句" /></div>
          <div className="space-y-2">
            {visibleParsedSentences.map((sentence) => (
              <Surface key={sentence} className="p-4">
                <div className="text-[14px] leading-6 text-[#2C241C]">{sentence}</div>
              </Surface>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <button onClick={() => setShowFullTextResult(!showFullTextResult)} className="w-full rounded-[16px] border border-[#E6D8BF] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">
              {showFullTextResult ? "收起部分内容" : "查看更多解析结果"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={() => { setHasPersonalPack(true); setActiveTab("words"); setWordPage("list"); showToast("已生成专属词包"); }} className="rounded-[16px] bg-[#3A2A1A] py-3 text-[13px] font-bold text-white active:scale-[0.98]">生成词包</button>
            <button onClick={() => { setActiveTab("training"); setTrainingPage("shadow"); }} className="rounded-[16px] bg-white py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">加入跟读</button>
            <button onClick={() => showToast("已收录到个人素材库")} className="col-span-2 rounded-[16px] bg-[#FFF8EA] py-3 text-[13px] font-bold text-[#8A6324] active:scale-[0.98]">收录素材库</button>
          </div>
        </>
      );
    }

    return (
      <>
        <PageHeader title="工作台" desc="生成内容先进最近生成，确认有用后再收录。" />
        <SectionTitle title="工具区" />
        <div className="space-y-3">
          <Surface className="p-5">
            <h3 className="text-[18px] font-bold text-[#2C241C]">自定义场景生成器</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">输入任意场景，生成对话、短句和可收藏表达。</p>
            <button onClick={() => setWorkbenchPage("sceneForm")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">进入</button>
          </Surface>
          <Surface className="p-5">
            <h3 className="text-[18px] font-bold text-[#2C241C]">文本智能解析工具</h3>
            <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">粘贴英文，提取生词、短语和长难句。</p>
            <button onClick={() => setWorkbenchPage("textForm")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">进入</button>
          </Surface>
        </div>
        <div className="mt-6"><SectionTitle title="素材区" /></div>
        {hasRecentGenerate || hasRecentParse ? (
          <div className="space-y-3">
            {hasRecentGenerate ? (
              <Surface className="p-5">
                <div className="text-[12px] font-bold text-[#8A6324]">最近生成 · 场景</div>
                <h3 className="mt-2 text-[17px] font-bold text-[#2C241C]">机场值机与行李托运</h3>
                <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">包含对话脚本、3句跟读短句、3条可收藏表达。</p>
                <button onClick={() => setWorkbenchPage("sceneResult")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">查看结果</button>
              </Surface>
            ) : null}
            {hasRecentParse ? (
              <Surface className="p-5">
                <div className="text-[12px] font-bold text-[#8A6324]">最近生成 · 文本解析</div>
                <h3 className="mt-2 text-[17px] font-bold text-[#2C241C]">语言学习短文解析</h3>
                <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">包含5个重点生词、4个高频短语、2个长难句。</p>
                <button onClick={() => setWorkbenchPage("textResult")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">查看结果</button>
              </Surface>
            ) : null}
          </div>
        ) : (
          <Surface className="p-5 text-center">
            <div className="text-[17px] font-bold text-[#2C241C]">暂无生成内容</div>
            <p className="mt-2 text-[13px] leading-6 text-[#6B5B49]">试试输入一个场景，生成你的第一组练习素材。</p>
            <button onClick={() => setWorkbenchPage("sceneForm")} className="mt-4 rounded-[14px] bg-[#3A2A1A] px-4 py-3 text-[13px] font-bold text-white active:scale-95">去生成</button>
          </Surface>
        )}
      </>
    );
  }

  function renderMine() {
    const mistakeWords = {
      "发音易错": [
        ["checkout", "尾音容易拖长", "加入跟读"],
        ["later", "/t/ 发音可更轻", "加入跟读"],
        ["adequate", "重音位置易错", "加入跟读"],
      ],
      "理解易错": [
        ["adapt", "常和 adopt 混淆", "加入复习"],
        ["regular", "易只记成“普通的”", "加入复习"],
        ["require", "易漏掉“要求”含义", "加入复习"],
      ],
      "拼写易错": [
        ["environment", "容易漏 n", "加入复习"],
        ["conversation", "容易漏 sation", "加入复习"],
        ["expression", "容易写成 expresion", "加入复习"],
      ],
    };

    const studyRecords = [
      { type: "单词", title: "四级核心词 18 → 26", desc: "完成8词复习", date: "今天" },
      { type: "跟读", title: "高频短句 5句", desc: "练习生活出行表达", date: "今天" },
      { type: "AI对话", title: "生活出行 1轮", desc: "已生成表达优化1条", date: "今天" },
      { type: "写作", title: "万能框架 3条", desc: "收录观点引入框架", date: "昨天" },
      { type: "单词", title: "雅思词汇 9 → 12", desc: "切换英音学习", date: "昨天" },
    ];

    if (minePage === "stats") {
      return (
        <>
          <PageHeader title="学习数据" desc="汇总全局学习情况，复杂数据统一放在这里。" back onBack={() => setMinePage("overview")} />
          <div className="grid grid-cols-2 gap-3">
            {[["已学词数", "128"], ["连续学习", "6天"], ["待复习", "8"], ["训练次数", "21"]].map(([label, value]) => (
              <Surface key={label} className="p-4 text-center">
                <div className="text-[22px] font-bold text-[#2C241C]">{value}</div>
                <div className="mt-1 text-[12px] text-[#8A6324]">{label}</div>
              </Surface>
            ))}
          </div>
          <Surface className="mt-4 p-5">
            <div className="text-[13px] font-bold text-[#2C241C]">本周学习概览</div>
            <div className="mt-4 space-y-3">
              {[["单词学习", 72], ["口语跟读", 56], ["AI对话", 38], ["写作训练", 24]].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-[12px] text-[#6B5B49]"><span>{label}</span><span>{value}%</span></div>
                  <Progress value={value} />
                </div>
              ))}
            </div>
          </Surface>
        </>
      );
    }

    if (minePage === "mistakes") {
      return (
        <>
          <PageHeader title="易错词库" desc="按发音、释义、拼写分类复盘。" back onBack={() => setMinePage("overview")} />
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {Object.keys(mistakeWords).map((type) => (
              <button key={type} onClick={() => setMistakeFilter(type)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${mistakeFilter === type ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{type}</button>
            ))}
          </div>
          <div className="space-y-3">
            {mistakeWords[mistakeFilter].map(([word, reason, action]) => (
              <Surface key={word} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[18px] font-bold text-[#2C241C]">{word}</div>
                    <div className="mt-1 text-[12px] text-[#6B5B49]">{reason}</div>
                  </div>
                  <button onClick={() => showToast(action)} className="shrink-0 rounded-full bg-[#FBF2DA] px-3 py-2 text-[12px] font-bold text-[#8A6324] active:scale-95">{action}</button>
                </div>
              </Surface>
            ))}
          </div>
        </>
      );
    }

    if (minePage === "records") {
      const filters = ["全部", "单词", "跟读", "AI对话", "写作"];
      const visibleRecords = studyRecords.filter((item) => recordFilter === "全部" || item.type === recordFilter);
      const grouped = visibleRecords.reduce((acc, item) => {
        acc[item.date] = acc[item.date] || [];
        acc[item.date].push(item);
        return acc;
      }, {});
      return (
        <>
          <PageHeader title="学习记录" desc="按日期聚合，不做流水账。" back onBack={() => setMinePage("overview")} />
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {filters.map((type) => (
              <button key={type} onClick={() => setRecordFilter(type)} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold ${recordFilter === type ? "bg-[#3A2A1A] text-white" : "bg-[#FFF8EA] text-[#6B5B49]"}`}>{type}</button>
            ))}
          </div>
          <div className="space-y-5">
            {Object.entries(grouped).map(([date, items]) => (
              <section key={date}>
                <SectionTitle title={date} />
                <div className="space-y-2">
                  {items.map((item) => (
                    <Surface key={item.type + item.title} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-[#FBF2DA] px-3 py-1 text-[12px] font-bold text-[#8A6324]">{item.type}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-bold text-[#2C241C]">{item.title}</div>
                          <div className="mt-1 text-[12px] text-[#6B5B49]">{item.desc}</div>
                        </div>
                      </div>
                    </Surface>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      );
    }

    if (minePage === "backup") {
      return (
        <>
          <PageHeader title="备份与恢复" desc="本地数据安全操作，全部需要二次确认。" back onBack={() => setMinePage("overview")} />
          <div className="space-y-3">
            {[["导出备份文件", "导出词库进度、学习记录、素材库"], ["导入备份文件", "恢复之前保存的本地备份"], ["清理音频缓存", "释放AI对话产生的音频空间"], ["重置全部数据", "清空本地学习数据，需谨慎操作"]].map(([title, desc]) => (
              <Surface key={title} className="p-4">
                <div className="text-[16px] font-bold text-[#2C241C]">{title}</div>
                <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">{desc}</p>
                <button onClick={() => showToast("二次确认后执行")} className="mt-3 rounded-[14px] bg-[#3A2A1A] px-4 py-2.5 text-[12px] font-bold text-white active:scale-95">操作</button>
              </Surface>
            ))}
          </div>
        </>
      );
    }

    if (minePage === "settings") {
      return (
        <>
          <PageHeader title="学习设置" desc="目标偏好、每日学习量、音色语速都在这里。" back onBack={() => setMinePage("overview")} />
          <div className="space-y-4">
            <Surface className="p-4">
              <div className="text-[13px] font-bold text-[#2C241C]">学习目标偏好</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["考试提分", "口语提升", "写作提升", "综合学习"].map((item, index) => (
                  <button key={item} onClick={() => showToast("已切换为" + item)} className={`rounded-full px-4 py-2 text-[12px] font-bold ${index === 0 ? "bg-[#3A2A1A] text-white" : "bg-white text-[#6B5B49]"}`}>{item}</button>
                ))}
              </div>
            </Surface>
            <Surface className="p-4">
              <div className="text-[13px] font-bold text-[#2C241C]">默认语音偏好</div>
              <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">美音 · 女声 · 标准语速</p>
            </Surface>
            <Surface className="p-4">
              <div className="text-[13px] font-bold text-[#2C241C]">每日学习量</div>
              <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">每天 8 个待复习词 + 1 轮输出训练</p>
            </Surface>
          </div>
        </>
      );
    }

    if (minePage === "login") {
      return (
        <>
          <PageHeader title="账号与同步" desc="当前阶段仅做登录入口占位，后续用于云同步、跨设备备份和AI额度管理。" back onBack={() => setMinePage("overview")} />
          <Surface className="p-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#D8B65E] to-[#7A5525] text-[22px] font-bold text-white">词</div>
            <h2 className="mt-4 text-center text-[20px] font-bold text-[#2C241C]">登录词境账号</h2>
            <p className="mx-auto mt-2 max-w-xs text-center text-[13px] leading-6 text-[#6B5B49]">登录后可同步学习记录、个人素材库和AI对话记录。当前预览版暂不接入真实账号系统。</p>
            <div className="mt-5 space-y-3">
              <input disabled value="手机号 / 邮箱" className="w-full rounded-[16px] border border-[#E6D8BF] bg-white/70 px-4 py-3 text-[13px] text-[#998B78] outline-none" />
              <input disabled value="验证码 / 密码" className="w-full rounded-[16px] border border-[#E6D8BF] bg-white/70 px-4 py-3 text-[13px] text-[#998B78] outline-none" />
            </div>
            <button onClick={() => showToast("登录功能后续开放")} className="mt-5 w-full rounded-[16px] bg-[#3A2A1A] py-3 text-[14px] font-bold text-white active:scale-[0.98]">登录 / 开启同步</button>
            <button onClick={() => setMinePage("overview")} className="mt-3 w-full rounded-[16px] bg-white py-3 text-[14px] font-bold text-[#8A6324] active:scale-[0.98]">暂不登录，继续本地使用</button>
          </Surface>
          <Surface className="mt-4 p-4">
            <div className="text-[13px] font-bold text-[#2C241C]">本地模式说明</div>
            <p className="mt-1 text-[12px] leading-5 text-[#6B5B49]">不登录也可使用单词库、跟读、工作台和本地学习记录；数据保存在当前设备。</p>
          </Surface>
        </>
      );
    }

    const groups = [
      { title: "学习概览", items: [["学习数据", "已学128词 · 连续6天 · 待复习8个"]] },
      { title: "复习管理", items: [["易错词库", "发音、理解、拼写易错词统一复盘"], ["学习记录", "查看每次单词、跟读、AI对话和写作记录"]] },
      { title: "数据安全", items: [["备份与恢复", "导出备份文件、导入恢复、清理缓存"]] },
      { title: "设置", items: [["学习设置", "目标偏好、每日学习量、音色语速偏好"]] },
    ];

    return (
      <>
        <PageHeader title="我的" desc="学习记录、易错词、备份与设置。" />
        <button onClick={() => setMinePage("login")} className="mb-5 flex w-full items-center gap-4 rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.06)] active:scale-[0.98]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D8B65E] to-[#7A5525] text-[16px] font-bold text-white">词</div>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-bold text-[#2C241C]">本地学习档案</div>
            <div className="mt-1 text-[12px] text-[#6B5B49]">数据保存在当前设备 · 可登录后同步</div>
          </div>
          <div className="text-[12px] font-bold text-[#8A6324]">登录</div>
        </button>
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.title}>
              <SectionTitle title={group.title} />
              <div className="space-y-3">
                {group.items.map(([title, desc]) => {
                  const pageMap = { "学习数据": "stats", "易错词库": "mistakes", "学习记录": "records", "备份与恢复": "backup", "学习设置": "settings" };
                  return (
                    <button key={title} onClick={() => setMinePage(pageMap[title] || "overview")} className="w-full rounded-[22px] border border-[#E6D8BF] bg-[#FFF8EA] p-4 text-left shadow-[0_4px_16px_rgba(58,42,26,0.05)] active:scale-[0.98]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[16px] font-bold text-[#2C241C]">{title}</div>
                          <p className="mt-1 text-[13px] leading-6 text-[#6B5B49]">{desc}</p>
                        </div>
                        <div className="shrink-0 text-[#8A6324]">›</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </>
    );
  }

  const renderActive = () => {
    if (activeTab === "home") return renderHome();
    if (activeTab === "words") return renderWords();
    if (activeTab === "training") return renderTraining();
    if (activeTab === "workbench") return renderWorkbench();
    return renderMine();
  };

  return (
    <PhoneShell tabs={tabs} activeTab={activeTab} onTab={(tab) => { setActiveTab(tab); if (tab !== "training") { setTrainingPage("overview"); setWritingPage("overview"); setShadowPage("overview"); } if (tab !== "mine") setMinePage("overview"); if (tab !== "workbench") setWorkbenchPage("overview"); }}>
      {renderActive()}
      {toast ? <div className="fixed bottom-[92px] left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#3A2A1A] px-5 py-3 text-[13px] font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)]">{toast}</div> : null}
    </PhoneShell>
  );
}
