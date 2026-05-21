/**
 * 手机端“我的收藏单词”自动检测
 *
 * 用法: node scripts/test-mobile-favorites.mjs
 *
 * 要求先启动 npm run dev，本脚本只负责浏览器自动化。
 * 如果要自动启动 dev server，加 --start-dev 参数。
 */

import { chromium } from "playwright";
import { spawn } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const REPORTS_DIR = resolve(PROJECT_ROOT, "reports");
const BASE_URL = "http://localhost:3000/v2";

// ── 收藏测试数据 ─────────────────────────────────────────────
const FAVORITES_KEY = "english-studio.v2.favorites";
const SEED_FAVORITES = {
  v: 1,
  wordFavorites: [
    { wordId: "a", word: "a", savedFromGroupId: "cet4", savedFromGroupName: "CET-4", savedFromPackId: "cet4", savedFromPackName: "CET-4", savedAt: Date.now() },
    { wordId: "a.m", word: "a.m", savedFromGroupId: "cet4", savedFromGroupName: "CET-4", savedFromPackId: "cet4", savedFromPackName: "CET-4", savedAt: Date.now() - 1000 },
    { wordId: "softly", word: "softly", savedFromGroupId: "cet4", savedFromGroupName: "CET-4", savedFromPackId: "cet4", savedFromPackName: "CET-4", savedAt: Date.now() - 2000 },
  ],
  writing: [],
  workbench: [],
};

// ── 工具函数 ─────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Dev server 启动 ───────────────────────────────────────────
async function startDevServer() {
  console.log("[dev] 启动 npm run dev ...");
  const proc = spawn("npm", ["run", "dev"], {
    cwd: PROJECT_ROOT,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // 等待 localhost:3000 就绪
  const start = Date.now();
  const deadline = start + 60_000;
  let ready = false;

  proc.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    // Next.js 16 典型输出
    if (text.includes("localhost:3000") || text.includes("ready started") || text.includes("Ready in")) {
      ready = true;
    }
  });

  proc.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    if (text.includes("localhost:3000") || text.includes("ready started") || text.includes("Ready in")) {
      ready = true;
    }
  });

  while (!ready && Date.now() < deadline) {
    try {
      const res = await fetch("http://localhost:3000/v2");
      if (res.ok || res.status === 200) {
        ready = true;
      }
    } catch {
      // 还没启动
    }
    if (!ready) await sleep(2000);
  }

  if (!ready) {
    console.error("[dev] 超时：dev server 未在 60s 内启动");
    proc.kill();
    process.exit(1);
  }

  console.log("[dev] dev server 已就绪");
  return proc;
}

// ── 浏览器检测 ───────────────────────────────────────────────
async function testViewport(viewport) {
  const { width, height } = viewport;
  const label = `${width}x${height}`;
  const result = {
    viewport: label,
    foundEntry: false,
    foundFavorites: false,
    foundWords: [],
    failureReason: null,
    screenshot: resolve(REPORTS_DIR, `mobile-favorites-${width}.png`),
  };

  console.log(`\n[test] 开始检测 ${label} ...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  try {
    // Step 1: 先访问页面让域名生效，再注入 localStorage
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // 注入收藏测试数据
    await page.evaluate(
      ({ key, data }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      { key: FAVORITES_KEY, data: SEED_FAVORITES }
    );

    // 刷新让数据生效
    await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(2000);

    // Step 2: 点击底部导航 "我的"
    const mineBtn = page.locator('nav button', { hasText: "我的" });
    await mineBtn.waitFor({ state: "visible", timeout: 10000 });
    await mineBtn.click();
    await sleep(1500);

    // Step 3: 查找 "收藏与错题" 区域和 "我的收藏单词" 按钮
    const favBtn = page.locator('button', { hasText: "我的收藏单词" }).first();
    const favBtnVisible = await favBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!favBtnVisible) {
      result.failureReason = "入口没找到：在「我的」页面未找到「我的收藏单词」按钮";
      await page.screenshot({ path: result.screenshot, fullPage: false });
      await browser.close();
      return result;
    }

    result.foundEntry = true;
    console.log(`  ✓ 找到「我的收藏单词」入口`);

    // Step 4: 点击 "我的收藏单词"
    await favBtn.click();
    await sleep(2000);

    // Step 5: 检测收藏列表页面
    // 可能的状态：
    //   - 显示 "暂无收藏" → 空态
    //   - 显示单词卡片 → 有收藏

    const emptyText = page.locator('text=暂无收藏');
    const favHeader = page.locator('h2', { hasText: "我的收藏单词" });

    const isEmptyVisible = await emptyText.isVisible({ timeout: 2000 }).catch(() => false);
    const favHeaderVisible = await favHeader.isVisible({ timeout: 2000 }).catch(() => false);

    if (!favHeaderVisible && !isEmptyVisible) {
      // 可能还在加载或跳转未完成
      await sleep(3000);
      const retryHeader = await favHeader.isVisible({ timeout: 2000 }).catch(() => false);
      const retryEmpty = await emptyText.isVisible({ timeout: 2000 }).catch(() => false);
      if (!retryHeader && !retryEmpty) {
        result.failureReason = "点了没跳转：点击「我的收藏单词」后未进入收藏列表页面";
        await page.screenshot({ path: result.screenshot, fullPage: false });
        await browser.close();
        return result;
      }
    }

    // 检查空态
    if (isEmptyVisible) {
      result.failureReason = "页面空态：收藏列表显示「暂无收藏」，localStorage 种子数据未生效";
      await page.screenshot({ path: result.screenshot, fullPage: false });
      await browser.close();
      return result;
    }

    console.log(`  ✓ 已进入收藏列表页面`);

    // Step 6: 检测是否出现收藏词
    const targetWords = ["a", "a.m", "softly"];
    let allFound = true;
    for (const word of targetWords) {
      const wordEl = page.locator(`text=${word}`).first();
      const found = await wordEl.isVisible({ timeout: 2000 }).catch(() => false);
      if (found) {
        result.foundWords.push(word);
        console.log(`  ✓ 找到收藏词: ${word}`);
      } else {
        allFound = false;
        console.log(`  ✗ 未找到收藏词: ${word}`);
      }
    }

    result.foundFavorites = result.foundWords.length > 0;

    if (!result.foundFavorites) {
      // 检查是否有收藏列表卡片（非空态但也没有具体词）
      const cards = page.locator('article[role="button"]');
      const cardCount = await cards.count().catch(() => 0);
      if (cardCount > 0) {
        result.foundFavorites = true;
        result.foundWords.push(`(找到 ${cardCount} 个收藏卡片，但未精确匹配种子词)`);
        console.log(`  ✓ 找到 ${cardCount} 个收藏卡片`);
      } else {
        result.failureReason = "数据没加载：收藏列表空态或种子数据未匹配到卡片";
      }
    }

    // Step 7: 截图
    await page.screenshot({ path: result.screenshot, fullPage: false });
    console.log(`  📸 截图: ${result.screenshot}`);

  } catch (err) {
    result.failureReason = `异常: ${err.message}`;
    try { await page.screenshot({ path: result.screenshot, fullPage: false }); } catch {}
  }

  await browser.close();
  return result;
}

// ── 主流程 ───────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const shouldStartDev = args.includes("--start-dev");

  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }

  let devProc = null;
  if (shouldStartDev) {
    devProc = await startDevServer();
  }

  try {
    // 先验证 dev server 是否可达
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      console.error("[error] dev server 不可达，请先运行 npm run dev 或用 --start-dev");
      if (devProc) devProc.kill();
      process.exit(1);
    }

    const results = [];

    // 测试 390x844
    results.push(await testViewport({ width: 390, height: 844 }));

    // 测试 430x932
    results.push(await testViewport({ width: 430, height: 932 }));

    // ── 输出报告 ─────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════");
    console.log("  手机端「我的收藏单词」自动检测报告");
    console.log("══════════════════════════════════════════\n");

    for (const r of results) {
      console.log(`📱 ${r.viewport}:`);
      console.log(`   入口: ${r.foundEntry ? "✅ 找到" : "❌ 未找到"}`);
      console.log(`   收藏词: ${r.foundFavorites ? "✅ 显示" : "❌ 未显示"}`);
      if (r.foundWords.length > 0) {
        console.log(`   匹配词: ${r.foundWords.join(", ")}`);
      }
      if (r.failureReason) {
        console.log(`   失败原因: ${r.failureReason}`);
      }
      console.log(`   截图: ${r.screenshot}`);
      console.log("");
    }

    const allPassed = results.every((r) => r.foundEntry && r.foundFavorites);
    console.log(`结论: ${allPassed ? "✅ 全部通过" : "❌ 存在失败项"}`);
    console.log("");

    // 写 JSON 报告
    const reportPath = resolve(REPORTS_DIR, "mobile-favorites-report.json");
    writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      seedWords: ["a", "a.m", "softly"],
      note: "UI 自动检测，使用 localStorage 种子数据，不代表真实云端登录检测",
      results,
      allPassed,
    }, null, 2), "utf-8");
    console.log(`报告已保存: ${reportPath}`);

    if (!allPassed) process.exitCode = 1;
  } finally {
    if (devProc) {
      console.log("\n[dev] 停止 dev server ...");
      devProc.kill();
    }
  }
}

main();
