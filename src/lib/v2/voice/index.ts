/** V2 voice：单词有道词典音；例句千问 TTS；AI 对话 playQwenAiChat */

export { speakText } from "./speakText";
export { playQwenAiChat } from "./qwenAiChat";
export { queueLearnExampleQwenSpeech } from "./learnExampleSpeak";
export type { QueueLearnExampleResult, LearnExamplePlaybackHooks } from "./learnExampleSpeak";
export type { VoiceGender, SpeakTextOptions, ChatVoiceGender } from "./types";
export { VOICE_GENDERS } from "./types";

import { warmUpWebSpeechVoices } from "./webSpeechProvider";

export function warmUpVoiceProviders(): void {
  warmUpWebSpeechVoices();
}
