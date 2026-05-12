/**
 * V2 voice module: browser Web Speech only.
 */

export { speakText } from "./speakText";
export type { VoiceGender, SpeakTextOptions } from "./types";
export { VOICE_GENDERS } from "./types";

import { warmUpWebSpeechVoices } from "./webSpeechProvider";

export function warmUpVoiceProviders(): void {
  warmUpWebSpeechVoices();
}
