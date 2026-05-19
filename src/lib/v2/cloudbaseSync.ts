import {
  defaultFavorites,
  defaultMistakes,
  loadFavorites,
  loadMistakes,
  loadRecentLearning,
  loadUiFlags,
  loadWordLearning,
  saveFavorites,
  saveMistakes,
  saveRecentLearning,
  saveUiFlags,
  saveWordLearning,
  type V2FavoritesState,
  type V2MistakesState,
  type V2RecentItem,
  type V2UiFlags,
  type V2WordLearningState,
} from "./storage";
import { getCloudbaseAuth, getCloudbaseDb } from "./cloudbaseClient";
import { loadChatMessages, saveChatMessages, type V2ChatMessage } from "./chatLocal";

const PROFILE_COLLECTION = "v2_profiles";
const LEARNING_COLLECTION = "v2_learning_states";
const CHAT_COLLECTION = "v2_chat_states";

export type CloudSyncProfile = {
  uid: string;
  isAnonymous: boolean;
  loginType: string;
  enabled: boolean;
  lastSyncedAt?: number;
};

type LearningSnapshot = {
  updatedAt: number;
  wordLearning: V2WordLearningState | null;
  favorites: V2FavoritesState;
  mistakes: V2MistakesState;
  recentLearning: V2RecentItem[];
  uiFlags: V2UiFlags;
};

type ChatSnapshot = {
  updatedAt: number;
  messages: V2ChatMessage[];
};

type SyncBootstrap = {
  profile: CloudSyncProfile;
  pulledLearning: boolean;
  pulledChats: boolean;
};

function cloneWordLearning(state: V2WordLearningState | null) {
  if (!state) return null;
  return JSON.parse(JSON.stringify(state)) as V2WordLearningState;
}

function buildLearningSnapshot(): LearningSnapshot {
  return {
    updatedAt: Date.now(),
    wordLearning: cloneWordLearning(loadWordLearning()),
    favorites: loadFavorites() ?? defaultFavorites(),
    mistakes: loadMistakes() ?? defaultMistakes(),
    recentLearning: loadRecentLearning(),
    uiFlags: loadUiFlags(),
  };
}

function buildChatSnapshot(defaultMessages: V2ChatMessage[]): ChatSnapshot {
  return {
    updatedAt: Date.now(),
    messages: loadChatMessages(defaultMessages),
  };
}

export async function ensureCloudSyncSession(): Promise<CloudSyncProfile> {
  const auth = await getCloudbaseAuth();
  let loginState = auth.hasLoginState();
  if (!loginState) {
    const provider = auth.anonymousAuthProvider();
    await provider.signIn();
    loginState = auth.hasLoginState();
  }
  if (!loginState?.uid) {
    throw new Error("CloudBase sign-in failed");
  }
  return {
    uid: loginState.uid,
    isAnonymous: loginState.isAnonymous === true,
    loginType: loginState.loginType || "ANONYMOUS",
    enabled: true,
  };
}

async function pullLearningSnapshot(uid: string): Promise<LearningSnapshot | null> {
  const db = await getCloudbaseDb();
  try {
    const res = await db.collection(LEARNING_COLLECTION).doc(uid).get();
    const data = res?.data as LearningSnapshot | undefined;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

async function pullChatSnapshot(uid: string): Promise<ChatSnapshot | null> {
  const db = await getCloudbaseDb();
  try {
    const res = await db.collection(CHAT_COLLECTION).doc(uid).get();
    const data = res?.data as ChatSnapshot | undefined;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

function applyLearningSnapshot(snapshot: LearningSnapshot) {
  if (snapshot.wordLearning) {
    const { v, ...rest } = snapshot.wordLearning;
    saveWordLearning(rest);
  }
  saveFavorites(snapshot.favorites ?? defaultFavorites());
  saveMistakes(snapshot.mistakes ?? defaultMistakes());
  saveRecentLearning(Array.isArray(snapshot.recentLearning) ? snapshot.recentLearning : []);
  saveUiFlags(snapshot.uiFlags ?? { v: 1, hasPersonalPack: false });
}

function applyChatSnapshot(snapshot: ChatSnapshot, defaultMessages: V2ChatMessage[]) {
  saveChatMessages(Array.isArray(snapshot.messages) && snapshot.messages.length ? snapshot.messages : defaultMessages);
}

async function upsertProfile(profile: CloudSyncProfile) {
  const db = await getCloudbaseDb();
  await db.collection(PROFILE_COLLECTION).doc(profile.uid).set({
    ...profile,
    lastSyncedAt: Date.now(),
  });
}

async function pushLearningSnapshot(uid: string) {
  const db = await getCloudbaseDb();
  const snapshot = buildLearningSnapshot();
  await db.collection(LEARNING_COLLECTION).doc(uid).set(snapshot);
}

async function pushChatSnapshot(uid: string, defaultMessages: V2ChatMessage[]) {
  const db = await getCloudbaseDb();
  const snapshot = buildChatSnapshot(defaultMessages);
  await db.collection(CHAT_COLLECTION).doc(uid).set(snapshot);
}

export async function bootstrapCloudSync(defaultMessages: V2ChatMessage[]): Promise<SyncBootstrap> {
  const profile = await ensureCloudSyncSession();
  const remoteLearning = await pullLearningSnapshot(profile.uid);
  const remoteChats = await pullChatSnapshot(profile.uid);

  let pulledLearning = false;
  let pulledChats = false;

  if (remoteLearning) {
    applyLearningSnapshot(remoteLearning);
    pulledLearning = true;
  } else {
    await pushLearningSnapshot(profile.uid);
  }

  if (remoteChats) {
    applyChatSnapshot(remoteChats, defaultMessages);
    pulledChats = true;
  } else {
    await pushChatSnapshot(profile.uid, defaultMessages);
  }

  await upsertProfile(profile);

  return {
    profile,
    pulledLearning,
    pulledChats,
  };
}

export async function syncLearningState(profile: CloudSyncProfile) {
  if (!profile?.enabled) return;
  await pushLearningSnapshot(profile.uid);
  await upsertProfile(profile);
}

export async function syncChatState(profile: CloudSyncProfile, defaultMessages: V2ChatMessage[]) {
  if (!profile?.enabled) return;
  await pushChatSnapshot(profile.uid, defaultMessages);
  await upsertProfile(profile);
}
