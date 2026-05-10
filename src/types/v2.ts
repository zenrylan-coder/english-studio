/** V2 mock / UI data shapes (tabs, training, word book, mine, workbench, writing). */

export type TabItem = {
  key: string;
  label: string;
  icon: string;
};

export type TodayTaskTarget = "words" | "shadow" | "aiVoice";

export type TodayTask = {
  title: string;
  desc: string;
  target: TodayTaskTarget;
  done: boolean;
};

export type WordPack = {
  id: string;
  name: string;
  total: number;
  learned: number;
  current: boolean;
  last: string;
};

export type WordGroup = {
  title: string;
  items: WordPack[];
};

export type WordItem = {
  word: string;
  phonetic: string;
  pos: string;
  cn: string;
  example: string;
  exampleCn: string;
  review: boolean;
};

export type Accent = "美音" | "英音";

export type TrainingCardKey = "aiVoice" | "shadow" | "writing";

export type TrainingCard = {
  key: TrainingCardKey;
  title: string;
  desc: string;
};

export type ShadowStage = "四级" | "六级" | "考研" | "专升本" | "雅思" | "高中" | "初中" | "小学";

export type ShadowType = "学段短句" | "高频短语" | "长难句" | "易错词";

export type ShadowDrillLine = {
  en: string;
  cn: string;
  tip: string;
};

export type ShadowDrillByType = Record<ShadowType, ShadowDrillLine[]>;

export type AiScene = "日常通用" | "校园学习" | "生活出行" | "求职面试" | "考试口语" | "自定义角色";

export type VoiceOption = "女声" | "男声";

export type SpeedOption = "慢速" | "标准" | "快速";

export type StudyRecordType = "单词" | "跟读" | "AI对话" | "写作";

export type StudyRecord = {
  type: StudyRecordType;
  title: string;
  desc: string;
  date: string;
};

export type MineGroupItem = readonly [title: string, description: string];

export type MineGroup = {
  title: string;
  items: MineGroupItem[];
};

/** Single mistake row: word, hint, action label */
export type MistakeWord = readonly [word: string, reason: string, action: string];

export type MistakeCategory = "发音易错" | "理解易错" | "拼写易错";

export type MistakeWordsMap = Record<MistakeCategory, MistakeWord[]>;

/** Dialogue line: speaker role + utterance */
export type SceneScriptLine = readonly [role: string, line: string];

/** Parsed lemma row: word + gloss */
export type ParsedWordTuple = readonly [word: string, gloss: string];

export type WritingType = "万能框架" | "高分句型" | "话题素材" | "原创范文拆解";

export type WritingStage = "四级" | "六级" | "考研" | "专升本" | "雅思";

/** title, main body snippet, usage note */
export type WritingItemRow = readonly [string, string, string];

export type WritingSection = {
  desc: string;
  items: WritingItemRow[];
};

export type WritingMap = Record<WritingType, WritingSection>;
