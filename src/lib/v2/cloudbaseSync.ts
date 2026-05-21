import type { V2WordFavoriteEntry } from "@/types/v2";

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
  type V2MistakeEntry,
  type V2MistakesState,
  type V2RecentItem,
  type V2UiFlags,
  type V2WordLearningState,
} from "./storage";
import { getCloudbaseAuth, getCloudbaseDb, callCloudbaseHttpFunction } from "./cloudbaseClient";
import { loadChatMessages, saveChatMessages, type V2ChatMessage } from "./chatLocal";
import { buildMockUid, type SavedPhoneAuthState } from "./cloudUserAuth";

const USERS_COLLECTION = "users";
const USER_PROGRESS_COLLECTION = "user_progress";
const USER_COLLECTIONS_COLLECTION = "user_collections";
const USER_WRONG_WORDS_COLLECTION = "user_wrong_words";

const LEGACY_LEARNING_COLLECTION = "v2_learning_states";
const CHAT_COLLECTION = "v2_chat_states";

const PACK_ID_TO_BANK_ID: Record<string, string> = {
  cet4: "cet4",
  cet6: "cet6",
  kaoyan: "kaoyan",
  zsb: "zhuanshengben",
  ielts: "ielts",
};

export type CloudSyncProfile = {
  uid: string;
  isAnonymous: boolean;
  loginType: string;
  enabled: boolean;
  phone?: string;
  phoneMasked?: string;
  nickname?: string;
  avatar?: string;
  authMode?: "mock" | "sms" | "anonymous";
  lastSyncedAt?: number;
};

export type CloudUserDoc = {
  uid: string;
  phone: string;
  nickname: string;
  avatar: string;
  createdAt: number;
  lastLoginAt: number;
};

export type CloudUserProgressDoc = {
  uid: string;
  bankId: string;
  currentIndex: number;
  knownWords: string[];
  unknownWords: string[];
  masteredWords: string[];
  updatedAt: number;
};

export type CloudUserCollectionDoc = {
  uid: string;
  word: string;
  bankId: string;
  createdAt: number;
};

export type CloudUserWrongWordDoc = {
  uid: string;
  word: string;
  bankId: string;
  reason: string;
  createdAt: number;
  updatedAt: number;
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

type BootstrapOptions = {
  phoneAuth?: SavedPhoneAuthState | null;
  preferLocal?: boolean;
};

type DbLike = {
  collection: (name: string) => {
    doc: (id: string) => {
      get: () => Promise<{ data?: unknown }>;
      set: (data: unknown) => Promise<unknown>;
      remove?: () => Promise<unknown>;
    };
    where: (query: Record<string, unknown>) => {
      get: () => Promise<{ data?: unknown[] }>;
    };
  };
};

function getDbLike() {
  return getCloudbaseDb() as Promise<DbLike>;
}

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

function packIdToBankId(packId: string | undefined): string {
  if (!packId) return "";
  return PACK_ID_TO_BANK_ID[packId] ?? packId;
}

function profileDocId(uid: string) {
  return uid;
}

function progressDocId(uid: string, bankId: string) {
  return `${uid}__${bankId}`;
}

function collectionDocId(uid: string, bankId: string, word: string) {
  return `${uid}__${bankId}__${String(word).trim().toLowerCase()}`;
}

function wrongWordDocId(uid: string, bankId: string, word: string) {
  return `${uid}__${bankId}__${String(word).trim().toLowerCase()}`;
}

function buildProfileDoc(profile: CloudSyncProfile, phoneAuth?: SavedPhoneAuthState | null): CloudUserDoc {
  const now = Date.now();
  return {
    uid: profile.uid,
    phone: phoneAuth?.phone ?? profile.phone ?? "",
    nickname: phoneAuth?.nickname ?? profile.nickname ?? "词源用户",
    avatar: phoneAuth?.avatar ?? profile.avatar ?? "词",
    createdAt: now,
    lastLoginAt: phoneAuth?.lastLoginAt ?? now,
  };
}

function normalizeProfile(base: CloudSyncProfile, profileDoc: CloudUserDoc | null, phoneAuth?: SavedPhoneAuthState | null): CloudSyncProfile {
  return {
    ...base,
    phone: phoneAuth?.phone ?? profileDoc?.phone ?? "",
    phoneMasked: phoneAuth?.phoneMasked ?? (profileDoc?.phone ? `${profileDoc.phone.slice(0, 3)}****${profileDoc.phone.slice(-4)}` : ""),
    nickname: phoneAuth?.nickname ?? profileDoc?.nickname ?? "词源用户",
    avatar: phoneAuth?.avatar ?? profileDoc?.avatar ?? "词",
    authMode: phoneAuth?.authMode ?? (base.isAnonymous ? "anonymous" : "sms"),
  };
}

function buildProgressDocs(uid: string, snapshot: LearningSnapshot): CloudUserProgressDoc[] {
  const bankId = packIdToBankId(snapshot.wordLearning?.packId);
  if (!bankId) return [];
  const masteredKeys = Array.isArray(snapshot.wordLearning?.masteredKeys) ? snapshot.wordLearning?.masteredKeys : [];
  const masteredWords = masteredKeys
    .filter((item) => item.startsWith(`${snapshot.wordLearning?.packId}:`))
    .map((item) => item.split(":").slice(1).join(":").trim().toLowerCase())
    .filter(Boolean);
  const unknownWords = (snapshot.mistakes.items || [])
    .filter((item) => (item.packs || []).some((pack) => packIdToBankId(pack) === bankId))
    .map((item) => String(item.word).trim().toLowerCase())
    .filter(Boolean);
  return [
    {
      uid,
      bankId,
      currentIndex: Math.max(0, snapshot.wordLearning?.wordIndex ?? 0),
      knownWords: masteredWords,
      unknownWords,
      masteredWords,
      updatedAt: snapshot.updatedAt,
    },
  ];
}

function buildCollectionDocs(uid: string, favorites: V2WordFavoriteEntry[]): CloudUserCollectionDoc[] {
  return favorites
    .map((item) => ({
      uid,
      word: item.word,
      bankId: packIdToBankId(item.savedFromPackId),
      createdAt: item.savedAt || Date.now(),
    }))
    .filter((item) => item.bankId && item.word);
}

function buildWrongWordDocs(uid: string, mistakes: V2MistakesState): CloudUserWrongWordDoc[] {
  const rows: CloudUserWrongWordDoc[] = [];
  for (const item of mistakes.items || []) {
    const bankIds = (item.packs || []).map((pack) => packIdToBankId(pack)).filter(Boolean);
    const targets = bankIds.length ? bankIds : [""];
    for (const bankId of targets) {
      if (!bankId) continue;
      rows.push({
        uid,
        word: item.word,
        bankId,
        reason: item.reason || item.category || "待补充",
        createdAt: item.addedAt || Date.now(),
        updatedAt: Date.now(),
      });
    }
  }
  return rows;
}

// ─── Pull structured collections from CloudBase ──────────────────────

async function sdkPullUserCollections(uid: string): Promise<V2WordFavoriteEntry[]> {
  const db = await getDbLike();
  try {
    const res = await db.collection(USER_COLLECTIONS_COLLECTION).where({ uid }).get();
    const rows = (res?.data ?? []) as CloudUserCollectionDoc[];
    console.log('[cloud-sync] sdk pulled user_collections count:', rows.length);
    return rows
      .filter((r) => r.word && r.bankId)
      .map((r) => ({
        wordId: String(r.word).trim().toLowerCase(),
        word: String(r.word).trim(),
        savedFromGroupId: '',
        savedFromGroupName: '',
        savedFromPackId: r.bankId,
        savedFromPackName: '',
        savedAt: r.createdAt || 0,
      }));
  } catch (err) {
    console.warn('[cloud-sync] sdk pull user_collections failed', String(err));
    return [];
  }
}

async function sdkPullUserWrongWords(uid: string): Promise<V2MistakesState> {
  const db = await getDbLike();
  try {
    const res = await db.collection(USER_WRONG_WORDS_COLLECTION).where({ uid }).get();
    const rows = (res?.data ?? []) as CloudUserWrongWordDoc[];
    console.log('[cloud-sync] sdk pulled user_wrong_words count:', rows.length);
    return {
      v: 1,
      items: rows
        .filter((r) => r.word && r.bankId)
        .map((r) => ({
          wordId: String(r.word).trim().toLowerCase(),
          word: String(r.word).trim(),
          category: '',
          reason: r.reason || '',
          action: '',
          packs: [r.bankId],
          addedAt: r.createdAt || 0,
        })),
    };
  } catch (err) {
    console.warn('[cloud-sync] sdk pull user_wrong_words failed', String(err));
    return { v: 1, items: [] };
  }
}

async function cfLoadUserCollections(uid: string): Promise<V2WordFavoriteEntry[]> {
  try {
    const result = await callCloudbaseHttpFunction<CfResult<CloudUserCollectionDoc[]>>('/api/load-user-collections', { uid });
    if (result?.ok && Array.isArray(result.data)) {
      return result.data
        .filter((r) => r.word && r.bankId)
        .map((r) => ({
          wordId: String(r.word).trim().toLowerCase(),
          word: String(r.word).trim(),
          savedFromGroupId: '',
          savedFromGroupName: '',
          savedFromPackId: r.bankId,
          savedFromPackName: '',
          savedAt: r.createdAt || 0,
        }));
    }
    return [];
  } catch {
    return [];
  }
}

async function pullUserCollections(uid: string): Promise<V2WordFavoriteEntry[]> {
  // Primary: cloud function (no SDK fallback — SDK gateway returns 404/CORS)
  try {
    const cfData = await cfLoadUserCollections(uid);
    if (cfData.length > 0) {
      console.log('[collection-page] cloud collections loaded count:', cfData.length);
      return cfData;
    }
    console.log('[collection-page] cloud collections returned empty');
  } catch (err) {
    console.warn('[collection-page] cloud collections load FAILED, using local', String(err));
  }
  // Fallback: local storage only
  const local = loadFavorites() ?? defaultFavorites();
  console.log('[collection-page] fallback local collections count:', local.wordFavorites.length);
  return local.wordFavorites;
}

function mergeCollectionsIntoFavorites(cloudEntries: V2WordFavoriteEntry[], localFavorites: V2FavoritesState): V2FavoritesState {
  const existing = new Map<string, V2WordFavoriteEntry>();
  for (const entry of localFavorites.wordFavorites) {
    if (entry.wordId) existing.set(entry.wordId, entry);
  }
  for (const entry of cloudEntries) {
    if (entry.wordId && !existing.has(entry.wordId)) {
      existing.set(entry.wordId, entry);
      console.log('[cloud-sync] merged cloud-only favorite:', entry.word);
    }
  }
  return {
    v: localFavorites.v,
    wordFavorites: [...existing.values()],
    writing: localFavorites.writing,
    workbench: localFavorites.workbench,
  };
}

function mergeWrongWordsFromCloud(cloudWrongs: V2MistakesState, localMistakes: V2MistakesState): V2MistakesState {
  const existing = new Map<string, V2MistakeEntry>();
  for (const entry of localMistakes.items) {
    if (entry.wordId) existing.set(entry.wordId, entry);
  }
  for (const entry of cloudWrongs.items) {
    if (entry.wordId && !existing.has(entry.wordId)) {
      existing.set(entry.wordId, entry);
      console.log('[cloud-sync] merged cloud-only wrong word:', entry.word);
    }
  }
  return { v: 1, items: [...existing.values()] };
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

// ─── Cloud Function based sync (primary path) ───────────────────────────

type CfResult<T = unknown> = { ok: boolean; data?: T; message?: string };

async function cfPushUserProgress(doc: CloudUserProgressDoc): Promise<boolean> {
  try {
    const result = await callCloudbaseHttpFunction<CfResult>("/api/save-user-progress", doc);
    return result?.ok === true;
  } catch {
    return false;
  }
}

async function cfLoadUserProgress(uid: string): Promise<CloudUserProgressDoc[]> {
  try {
    const result = await callCloudbaseHttpFunction<CfResult<CloudUserProgressDoc[]>>("/api/load-user-progress", { uid });
    if (result?.ok && Array.isArray(result.data)) return result.data;
    return [];
  } catch {
    return [];
  }
}

async function cfPushUserCollection(doc: CloudUserCollectionDoc): Promise<boolean> {
  try {
    const result = await callCloudbaseHttpFunction<CfResult>("/api/save-user-collection", doc);
    return result?.ok === true;
  } catch {
    return false;
  }
}

async function cfRemoveUserCollection(uid: string, bankId: string, word: string): Promise<boolean> {
  try {
    const result = await callCloudbaseHttpFunction<CfResult>("/api/remove-user-collection", { uid, bankId, word });
    return result?.ok === true;
  } catch {
    return false;
  }
}

async function cfPushUserWrongWord(doc: CloudUserWrongWordDoc): Promise<boolean> {
  try {
    const result = await callCloudbaseHttpFunction<CfResult>("/api/save-user-wrong-word", doc);
    return result?.ok === true;
  } catch {
    return false;
  }
}

async function cfLoadUserProfile(uid: string): Promise<CloudUserDoc | null> {
  try {
    const result = await callCloudbaseHttpFunction<CfResult<CloudUserDoc>>("/api/load-user-profile", { uid });
    if (result?.ok && result.data) return result.data;
    return null;
  } catch {
    return null;
  }
}

async function cfUpsertProfile(doc: CloudUserDoc): Promise<boolean> {
  try {
    const result = await callCloudbaseHttpFunction<CfResult>("/api/save-user-progress", { ...doc, _type: "profile" });
    return result?.ok === true;
  } catch {
    return false;
  }
}

// ─── Direct SDK sync (fallback path) ────────────────────────────────────

async function sdkUpsertProfile(profile: CloudSyncProfile, phoneAuth?: SavedPhoneAuthState | null) {
  const db = await getDbLike();
  const existing = await pullProfile(profile.uid);
  const next = buildProfileDoc(profile, phoneAuth);
  await db.collection(USERS_COLLECTION).doc(profileDocId(profile.uid)).set({
    ...(existing ?? next),
    ...next,
    createdAt: existing?.createdAt || next.createdAt,
  });
}

async function sdkPushStructuredLearning(uid: string, snapshot: LearningSnapshot) {
  const db = await getDbLike();
  const progressDocs = buildProgressDocs(uid, snapshot);
  const collectionDocs = buildCollectionDocs(uid, snapshot.favorites.wordFavorites || []);
  const wrongDocs = buildWrongWordDocs(uid, snapshot.mistakes);

  for (const item of progressDocs) {
    try {
      await db.collection(USER_PROGRESS_COLLECTION).doc(progressDocId(uid, item.bankId)).set(item);
      console.log('[cloud-sync] user_progress written OK', { uid: uid.slice(0, 12), bankId: item.bankId, currentIndex: item.currentIndex });
    } catch (err) {
      console.warn('[cloud-sync] user_progress write FAILED', String(err));
    }
  }

  for (const item of collectionDocs) {
    try {
      await db.collection(USER_COLLECTIONS_COLLECTION).doc(collectionDocId(uid, item.bankId, item.word)).set(item);
      console.log('[cloud-sync] user_collections written OK', { uid: uid.slice(0, 12), word: item.word, bankId: item.bankId });
    } catch (err) {
      console.warn('[cloud-sync] user_collections write FAILED', String(err));
    }
  }

  for (const item of wrongDocs) {
    try {
      await db.collection(USER_WRONG_WORDS_COLLECTION).doc(wrongWordDocId(uid, item.bankId, item.word)).set(item);
      console.log('[cloud-sync] user_wrong_words written OK', { uid: uid.slice(0, 12), word: item.word, bankId: item.bankId });
    } catch (err) {
      console.warn('[cloud-sync] user_wrong_words write FAILED', String(err));
    }
  }
}

async function sdkPushLearningSnapshot(uid: string) {
  const db = await getDbLike();
  const snapshot = buildLearningSnapshot();
  // Legacy snapshot — best effort, must not block structured writes
  try {
    await db.collection(LEGACY_LEARNING_COLLECTION).doc(uid).set(snapshot);
  } catch {
    console.warn('[cloud-sync] legacy learning snapshot write failed (collection may not exist), continuing');
  }
  await sdkPushStructuredLearning(uid, snapshot);
}

async function sdkPushChatSnapshot(uid: string, defaultMessages: V2ChatMessage[]) {
  try {
    const db = await getDbLike();
    const snapshot = buildChatSnapshot(defaultMessages);
    await db.collection(CHAT_COLLECTION).doc(uid).set(snapshot);
  } catch {
    console.warn('[cloud-sync] chat snapshot write failed (collection may not exist), continuing');
  }
}

// ─── Structured push via cloud functions ─────────────────────────────────

async function pushLearningViaCloudFunctions(uid: string): Promise<boolean> {
  const snapshot = buildLearningSnapshot();
  let anyOk = false;

  const progressDocs = buildProgressDocs(uid, snapshot);
  for (const doc of progressDocs) {
    const ok = await cfPushUserProgress(doc);
    if (ok) anyOk = true;
  }

  const collectionDocs = buildCollectionDocs(uid, snapshot.favorites.wordFavorites || []);
  for (const doc of collectionDocs) {
    const ok = await cfPushUserCollection(doc);
    if (ok) anyOk = true;
  }

  const wrongDocs = buildWrongWordDocs(uid, snapshot.mistakes);
  for (const doc of wrongDocs) {
    const ok = await cfPushUserWrongWord(doc);
    if (ok) anyOk = true;
  }

  return anyOk;
}

async function pushProfileViaCloudFunction(profile: CloudSyncProfile, phoneAuth?: SavedPhoneAuthState | null): Promise<boolean> {
  const doc = buildProfileDoc(profile, phoneAuth);
  return cfUpsertProfile(doc);
}

async function pullLearningViaCloudFunctions(uid: string): Promise<LearningSnapshot | null> {
  const progressDocs = await cfLoadUserProgress(uid);
  if (progressDocs.length === 0) return null;

  const latest = progressDocs.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a), progressDocs[0]);
  const wordLearning: V2WordLearningState = {
    v: 1,
    packId: latest.bankId,
    wordPage: "list",
    wordIndex: latest.currentIndex,
    reviewOnly: false,
    masteredKeys: latest.masteredWords.map((w) => `${latest.bankId}:${w}`),
  };

  // Build favorites from collection data from progress (best effort)
  // The cloud function only returns progress; favorites/mistakes come from separate calls
  const favorites = loadFavorites() ?? defaultFavorites();
  const mistakes = loadMistakes() ?? defaultMistakes();

  return {
    updatedAt: latest.updatedAt,
    wordLearning,
    favorites,
    mistakes,
    recentLearning: loadRecentLearning(),
    uiFlags: loadUiFlags(),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────

export async function ensureCloudSyncSession(): Promise<CloudSyncProfile> {
  let auth;
  try {
    auth = await getCloudbaseAuth();
  } catch {
    throw new Error("CloudBase SDK unavailable");
  }

  let loginState = auth.hasLoginState() as Record<string, unknown> | null;
  if (!loginState) {
    try {
      const provider = auth.anonymousAuthProvider();
      await provider.signIn();
      loginState = auth.hasLoginState() as Record<string, unknown> | null;
    } catch {
      throw new Error("CloudBase anonymous sign-in failed");
    }
  }
  // Compat: uid may be at loginState.uid or loginState.user.uid
  const uid = String(
    (loginState?.user as Record<string, unknown> | undefined)?.uid
    || loginState?.uid
    || ''
  );
  if (!uid) {
    throw new Error("CloudBase sign-in failed — no uid in loginState");
  }
  const isAnonymous = loginState?.isAnonymous === true
    || (loginState?.user as Record<string, unknown> | undefined)?.is_anonymous === true;
  const loginType = String(loginState?.loginType || (loginState?.user as Record<string, unknown> | undefined)?.login_type || loginState?.login_type || '');
  return {
    uid,
    isAnonymous,
    loginType: loginType || (isAnonymous ? "ANONYMOUS" : "CUSTOM"),
    enabled: true,
    authMode: isAnonymous ? "anonymous" : "sms",
  };
}

export async function signOutCloudSync(): Promise<void> {
  try {
    const auth = await getCloudbaseAuth();
    if (typeof auth.signOut === "function") {
      await auth.signOut();
    }
  } catch {
    /* CloudBase SDK unavailable — nothing to sign out */
  }
}

async function pullProfile(uid: string): Promise<CloudUserDoc | null> {
  // Try cloud function first
  const cfProfile = await cfLoadUserProfile(uid);
  if (cfProfile) return cfProfile;

  // Fall back to SDK
  const db = await getDbLike();
  try {
    const res = await db.collection(USERS_COLLECTION).doc(profileDocId(uid)).get();
    const data = res?.data as CloudUserDoc | undefined;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

async function pullLearningSnapshot(uid: string): Promise<LearningSnapshot | null> {
  // Try cloud function first
  const cfSnapshot = await pullLearningViaCloudFunctions(uid);
  if (cfSnapshot) return cfSnapshot;

  // Fall back to SDK
  const db = await getDbLike();
  try {
    const res = await db.collection(LEGACY_LEARNING_COLLECTION).doc(uid).get();
    const data = res?.data as LearningSnapshot | undefined;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

async function pullChatSnapshot(uid: string): Promise<ChatSnapshot | null> {
  const db = await getDbLike();
  try {
    const res = await db.collection(CHAT_COLLECTION).doc(uid).get();
    const data = res?.data as ChatSnapshot | undefined;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

export async function bootstrapCloudSync(defaultMessages: V2ChatMessage[], options: BootstrapOptions = {}): Promise<SyncBootstrap> {
  const phoneAuth = options.phoneAuth;
  const isMock = phoneAuth?.mockMode === true;

  // ── Mock users: never touch CloudBase SDK auth ──────────────────────
  if (isMock) {
    const uid = buildMockUid(phoneAuth!.phone);
    const profile: CloudSyncProfile = {
      uid,
      isAnonymous: false,
      loginType: "MOCK_PHONE",
      enabled: true,
      phone: phoneAuth!.phone,
      phoneMasked: phoneAuth!.phoneMasked,
      nickname: phoneAuth!.nickname,
      avatar: phoneAuth!.avatar,
      authMode: "mock",
      lastSyncedAt: Date.now(),
    };

    let remoteLearning: LearningSnapshot | null = null;
    try {
      remoteLearning = await pullLearningViaCloudFunctions(uid);
    } catch {
      /* cloud unavailable, stay local */
    }

    if (remoteLearning) {
      applyLearningSnapshot(remoteLearning);
      try { await pushProfileViaCloudFunction(profile, phoneAuth); } catch { /* ignore */ }
    } else {
      try {
        await pushProfileViaCloudFunction(profile, phoneAuth);
        await pushLearningViaCloudFunctions(uid);
      } catch { /* ignore */ }
    }

    // Pull and merge cloud collections (favorites + wrong words)
    try {
      const cloudCollections = await cfLoadUserCollections(uid);
      if (cloudCollections.length > 0) {
        const merged = mergeCollectionsIntoFavorites(cloudCollections, loadFavorites() ?? defaultFavorites());
        saveFavorites(merged);
      }
    } catch { /* ignore */ }

    return {
      profile: { ...profile, lastSyncedAt: Date.now() },
      pulledLearning: !!remoteLearning,
      pulledChats: false,
    };
  }

  // ── Non-mock users: CloudBase SDK auth path ─────────────────────────
  let profileBase: CloudSyncProfile;
  try {
    profileBase = await ensureCloudSyncSession();
  } catch {
    return {
      profile: {
        uid: `local_${Date.now().toString(36)}`,
        isAnonymous: false,
        loginType: "LOCAL",
        enabled: false,
        phone: phoneAuth?.phone,
        phoneMasked: phoneAuth?.phoneMasked,
        nickname: phoneAuth?.nickname,
        avatar: phoneAuth?.avatar,
        authMode: "anonymous",
        lastSyncedAt: Date.now(),
      },
      pulledLearning: false,
      pulledChats: false,
    };
  }

  const remoteProfile = await pullProfile(profileBase.uid);
  const profile = normalizeProfile(profileBase, remoteProfile, phoneAuth);
  const remoteLearning = await pullLearningSnapshot(profile.uid);
  const remoteChats = await pullChatSnapshot(profile.uid);

  let pulledLearning = false;
  let pulledChats = false;

  if (options.preferLocal) {
    try {
      await sdkUpsertProfile(profile, phoneAuth);
      await sdkPushLearningSnapshot(profile.uid);
      await sdkPushChatSnapshot(profile.uid, defaultMessages);
    } catch {
      /* cloud push failed, data stays in localStorage */
    }
  } else {
    if (remoteLearning) {
      applyLearningSnapshot(remoteLearning);
      pulledLearning = true;
    } else {
      try {
        await sdkUpsertProfile(profile, phoneAuth);
        await sdkPushLearningSnapshot(profile.uid);
      } catch {
        /* cloud push failed, local data is safe */
      }
    }

    if (remoteChats) {
      applyChatSnapshot(remoteChats, defaultMessages);
      pulledChats = true;
    } else {
      try {
        await sdkPushChatSnapshot(profile.uid, defaultMessages);
      } catch {
        /* ignore */
      }
    }
    try {
      await sdkUpsertProfile(profile, phoneAuth);
    } catch {
      /* ignore */
    }
  }

  // Pull and merge cloud collections (favorites + wrong words)
  try {
    const cloudCollections = await pullUserCollections(profile.uid);
    if (cloudCollections.length > 0) {
      const mergedFav = mergeCollectionsIntoFavorites(cloudCollections, loadFavorites() ?? defaultFavorites());
      saveFavorites(mergedFav);
      console.log('[cloud-sync] merged cloud collections, total favorites:', mergedFav.wordFavorites.length);
    }
    const cloudWrongs = await sdkPullUserWrongWords(profile.uid);
    if (cloudWrongs.items.length > 0) {
      const mergedMistakes = mergeWrongWordsFromCloud(cloudWrongs, loadMistakes() ?? defaultMistakes());
      saveMistakes(mergedMistakes);
      console.log('[cloud-sync] merged cloud wrong words, total:', mergedMistakes.items.length);
    }
  } catch {
    /* cloud read failed, keep local data */
  }

  return {
    profile: { ...profile, lastSyncedAt: Date.now() },
    pulledLearning,
    pulledChats,
  };
}

export async function syncLearningState(profile: CloudSyncProfile) {
  if (!profile?.enabled) return;
  const uidShort = profile.uid ? profile.uid.slice(0, 16) : '';
  console.log('[cloud-sync] syncLearningState start', { authMode: profile.authMode, uid: uidShort });
  try {
    if (profile.authMode === "mock") {
      await pushLearningViaCloudFunctions(profile.uid);
      await pushProfileViaCloudFunction(profile);
    } else {
      await sdkPushLearningSnapshot(profile.uid);
      await sdkUpsertProfile(profile, null);
    }
    console.log('[cloud-sync] syncLearningState success', { uid: uidShort });
  } catch (err) {
    console.warn('[cloud-sync] syncLearningState FAILED', String(err), '- using localStorage fallback');
  }
}

export async function syncChatState(profile: CloudSyncProfile, defaultMessages: V2ChatMessage[]) {
  if (!profile?.enabled) return;
  // Mock users: skip SDK, chat is local-only
  if (profile.authMode === "mock") return;
  try {
    await sdkPushChatSnapshot(profile.uid, defaultMessages);
    await sdkUpsertProfile(profile, null);
  } catch {
    /* ignore */
  }
}
