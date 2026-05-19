import type { MineGroup, MistakeWordsMap, StudyRecord } from "@/types/v2";

export const mistakeWords = {
  发音易错: [
    ["communicate", "第二音节重读别省弱", "加入跟读"],
    ["environment", "中间 /n/ 别吞掉", "加入跟读"],
    ["usually", "/ʒ/ 与 /uː/ 要读清楚", "加入跟读"],
  ],
  理解易错: [
    ["approach", "作名词「方法」与动词「处理」易混", "加入复习"],
    ["major", "「专业」与「主要的」词性易混", "加入复习"],
    ["practice", "不可数表「练习」时别乱加 a", "加入复习"],
  ],
  拼写易错: [
    ["accommodate", "双写 m 或漏字母易错", "加入复习"],
    ["definitely", "易写成 definetely", "加入复习"],
    ["separate", "易与 seperate 混淆", "加入复习"],
  ],
} satisfies MistakeWordsMap;

export const studyRecords = [
  { type: "单词", title: "四级词表进度 18 → 25", desc: "巩固 adapt 及前后共 8 词", date: "今天" },
  { type: "跟读", title: "校园/求职场景 12 句", desc: "分学段短句与长句各练一轮", date: "今天" },
  { type: "AI对话", title: "校园学习 1 轮", desc: "练自我介绍与学习计划表达", date: "今天" },
  { type: "跟读", title: "睡前轻量跟读 8 句", desc: "复述关键短语，巩固发音节奏", date: "昨天" },
  { type: "单词", title: "个人短文解析词包", desc: "个人词包 · 6 词", date: "昨天" },
] satisfies StudyRecord[];

export const mineGroups = [
  { title: "学习概览", items: [["学习数据", "已学128词 · 连续6天 · 待复习8个"]] },
  { title: "复习管理", items: [["易错词库", "发音、理解、拼写易错词统一复盘"], ["学习记录", "查看单词学习与口语训练等活动记录"]] },
  { title: "数据安全", items: [["备份与恢复", "导出备份文件、导入恢复、清理缓存"]] },
  { title: "设置", items: [["学习设置", "目标偏好、每日学习量、音色语速偏好"]] },
] satisfies MineGroup[];
