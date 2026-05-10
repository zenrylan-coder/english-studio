import type { MineGroup, MistakeWordsMap, StudyRecord } from "@/types/v2";

export const mistakeWords = {
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
} satisfies MistakeWordsMap;

export const studyRecords = [
  { type: "单词", title: "四级核心词 18 → 26", desc: "完成8词复习", date: "今天" },
  { type: "跟读", title: "高频短句 5句", desc: "练习生活出行表达", date: "今天" },
  { type: "AI对话", title: "生活出行 1轮", desc: "已生成表达优化1条", date: "今天" },
  { type: "写作", title: "万能框架 3条", desc: "收录观点引入框架", date: "昨天" },
  { type: "单词", title: "雅思词汇 9 → 12", desc: "切换英音学习", date: "昨天" },
] satisfies StudyRecord[];

export const mineGroups = [
  { title: "学习概览", items: [["学习数据", "已学128词 · 连续6天 · 待复习8个"]] },
  { title: "复习管理", items: [["易错词库", "发音、理解、拼写易错词统一复盘"], ["学习记录", "查看每次单词、跟读、AI对话和写作记录"]] },
  { title: "数据安全", items: [["备份与恢复", "导出备份文件、导入恢复、清理缓存"]] },
  { title: "设置", items: [["学习设置", "目标偏好、每日学习量、音色语速偏好"]] },
] satisfies MineGroup[];
