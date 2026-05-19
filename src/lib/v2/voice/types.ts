export const VOICE_GENDERS = ["女声", "男声"] as const;
export type VoiceGender = (typeof VOICE_GENDERS)[number];

export type SpeakTextOptions = {
  gender?: VoiceGender;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  /** learnWord：有道词典单词音；例句请直接调用 queueLearnExampleQwenSpeech */
  scope?: "learnWord";
};

export type ChatVoiceGender = VoiceGender;
