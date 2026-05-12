// Minimal ambient declaration so the project type-checks while the
// `dashscope` SDK is consumed via dynamic `import("dashscope")` in
// `src/lib/v2/qwenTts.ts`. No runtime code changes.
declare module "dashscope";
