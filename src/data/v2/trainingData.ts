import type { AiScene, ShadowDrillByType, ShadowStage, ShadowType, SpeedOption, TrainingCard, VoiceOption } from "@/types/v2";

export const trainingCards = [
  { key: "aiVoice", title: "AI语音对话", desc: "开口练真实场景" },
  { key: "shadow", title: "口语跟读训练", desc: "练准短句发音" },
  { key: "writing", title: "写作表达训练", desc: "套用高分表达" },
] satisfies TrainingCard[];

export const shadowStages = ["四级", "六级", "考研", "专升本", "雅思", "高中", "初中", "小学"] as const satisfies readonly ShadowStage[];
export const shadowTypes = ["学段短句", "高频短语", "长难句", "易错词"] as const satisfies readonly ShadowType[];
export const aiScenes = ["日常通用", "校园学习", "生活出行", "求职面试", "考试口语", "自定义角色"] as const satisfies readonly AiScene[];
export const voices = ["女声", "男声"] as const satisfies readonly VoiceOption[];
export const speeds = ["慢速", "标准", "快速"] as const satisfies readonly SpeedOption[];

/** 口语跟读练习句（第一批 seed，场景含校园、学习、考试、求职与自我介绍） */
export const shadowDrillByType = {
  学段短句: [
    {
      en: "I'm preparing for the upgrade exam, and I'm a bit nervous about the English speaking part.",
      cn: "我在准备专升本考试，口语部分让我有点紧张。",
      tip: "upgrade 可作名词读清楚；nervous about 可弱读 about。",
    },
    {
      en: "Could we meet in the library after class to go over today's new words?",
      cn: "下课后我们能在图书馆见个面，过一遍今天的新词吗？",
      tip: "Could we 读起来要客气、轻快；go over 连读自然即可。",
    },
    {
      en: "I would like to introduce myself briefly and explain why I chose this major.",
      cn: "我想简单自我介绍一下，并说明我为什么选这个专业。",
      tip: "would like to 三个词不要念得太硬；briefly 重音在首音节。",
    },
  ],
  高频短语: [
    {
      en: "get ready for",
      cn: "为……做准备",
      tip: "for 弱读；整组常用来接 exam / interview。",
    },
    {
      en: "on campus",
      cn: "在校园里",
      tip: "campus 重音在首音节；on 弱读即可。",
    },
    {
      en: "sign up for",
      cn: "报名参加",
      tip: "sign 和 up 中间不要加多余元音。",
    },
  ],
  长难句: [
    {
      en: "I joined the English corner because I wanted to practice speaking in a relaxed environment.",
      cn: "我参加了英语角，因为我想在轻松的环境里练口语。",
      tip: "because I 可轻微连读；relaxed 两个音节要读全。",
    },
    {
      en: "Although I still make grammar mistakes, I try to write one short paragraph in English every week.",
      cn: "虽然我还会犯语法错误，我仍尽量每周用英语写一小段。",
      tip: "Although 后轻微停顿；paragraph 重音在首音节。",
    },
    {
      en: "The more feedback I get from my teacher, the more confident I feel when I express my ideas.",
      cn: "老师给的建议越多，我表达自己想法时就越有信心。",
      tip: "The more ... the more ... 保持平稳节奏，别抢拍。",
    },
  ],
  易错词: [
    {
      en: "environment",
      cn: "环境",
      tip: "中间 n 不要漏掉，别读成 enviroment。",
    },
    {
      en: "communicate",
      cn: "交流；沟通",
      tip: "重音在第二音节 mu-，别读成 com-MU-ni-cate 错拍。",
    },
    {
      en: "develop",
      cn: "发展；培养",
      tip: "第二音节 vel 别读得太像「歪楼」。",
    },
  ],
} satisfies ShadowDrillByType;
