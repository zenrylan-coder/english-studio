/**
 * V2 public speech entrypoint: routes directly to browser Web Speech.
 */

import type { SpeakTextOptions } from "./types";
import { speakWithWebSpeech } from "./webSpeechProvider";

export function speakText(text: string, options?: SpeakTextOptions): boolean {
  return speakWithWebSpeech(text, options);
}
