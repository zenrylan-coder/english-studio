/**
 * V2 voice types for browser Web Speech only.
 */

export const VOICE_GENDERS = ["女声", "男声"] as const;
export type VoiceGender = (typeof VOICE_GENDERS)[number];

export type SpeakTextOptions = {
  gender?: VoiceGender;
  lang?: string;
  rate?: number;
};
