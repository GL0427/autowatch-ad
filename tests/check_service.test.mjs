import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const servicePath = new URL('../app/src/main/java/com/autowatch/ad/AdWatchService.java', import.meta.url);
const src = readFileSync(servicePath, 'utf8');

function bodyOf(signature) {
  const re = new RegExp(signature + '\\s*\\{', 'm');
  const m = re.exec(src);
  assert.ok(m, `缺少方法 ${signature}`);
  const open = src.indexOf('{', m.index + m[0].length - 1);
  assert.ok(open >= 0, `缺少方法体 ${signature}`);
  let depth = 0;
  let i = open;
  let quote = null;
  let lineComment = false;
  let blockComment = false;
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (lineComment) {
      if (ch === '\n') lineComment = false;
      i += 1;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 2;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 2;
      continue;
    }
    if (ch === '"' || ch === '\'') {
      quote = ch;
      i += 1;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(open + 1, i);
    }
    i += 1;
  }
  assert.fail(`方法体不完整 ${signature}`);
}

function findMethod(signature) {
  const escaped = signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\s+/g, '\\s+');
  assert.match(src, new RegExp(escaped + '\\s*\\{', 'm'), `缺少方法 ${signature}`);
}

test('AdWatchService 继承 AccessibilityService 并声明五个状态常量', () => {
  assert.match(src, /package\s+com\.autowatch\.ad\s*;/);
  assert.match(src, /public\s+class\s+AdWatchService\s+extends\s+AccessibilityService\b/);
  for (const state of ['IDLE', 'SCAN_ENTRY', 'WAIT_AD', 'CLAIM', 'CLOSE']) {
    assert.match(src, new RegExp(`static\\s+final\\s+int\\s+${state}\\s*=\\s*\\d+;`), `缺少状态 ${state}`);
  }
});

test('服务生命周期启动/移除递归轮询并初始化 Prefs', () => {
  const connected = bodyOf('protected void onServiceConnected\\(\\)');
  assert.match(connected, /mPrefs\s*=\s*new\s+Prefs\s*\(\s*getApplicationContext\s*\(\s*\)\s*\)/);
  assert.match(connected, /ensureFirstRun\s*\(\s*\)/);
  assert.match(connected, /scheduleNext\s*\(\s*0L\s*\)/);
  const destroyed = bodyOf('public void onDestroy\\(\\)');
  assert.match(destroyed, /removeCallbacks\s*\(\s*mPollRunnable\s*\)/);
});

test('onAccessibilityEvent 仅处理目标包并驱动状态机', () => {
  const eventBody = bodyOf('public void onAccessibilityEvent\\(AccessibilityEvent event\\)');
  assert.match(eventBody, /event\.getPackageName\s*\(\s*\)/);
  assert.match(eventBody, /Config\.TARGET_PACKAGE\.equals/);
  assert.match(eventBody, /getRootInActiveWindow\s*\(\s*\)/);
  assert.match(eventBody, /runIdleRound\s*\(\s*root\s*\)/);
});

test('节点查找使用文本模糊匹配、contentDescription 兜底、className/clickable 过滤与 ACTION_CLICK', () => {
  const findBody = bodyOf('private AccessibilityNodeInfo findClickable\\(AccessibilityNodeInfo root, String\\[\\] keywords, int depth\\)');
  const isMatchingBody = bodyOf('private boolean isMatching\\(AccessibilityNodeInfo node, String\\[\\] keywords\\)');
  assert.match(isMatchingBody, /getText\s*\(\s*\)/);
  assert.match(isMatchingBody, /contentDescription/i);
  assert.match(isMatchingBody, /getClassName\s*\(\s*\)/);
  assert.match(findBody, /isClickable\s*\(\s*\)/);
  const clickBody = bodyOf('private boolean clickNode\\(AccessibilityNodeInfo node\\)');
  assert.match(clickBody, /AccessibilityNodeInfo\.ACTION_CLICK/);
  assert.match(clickBody, /performAction\s*\(\s*AccessibilityNodeInfo\.ACTION_CLICK\s*\)/);
});

test('CLAIM 分两步：先领取成功，再领取奖励', () => {
  const claimBody = bodyOf('private void runClaim\\(AccessibilityNodeInfo root\\)');
  const successIndex = claimBody.indexOf('CLAIM_SUCCESS_KEYWORDS');
  const rewardIndex = claimBody.indexOf('CLAIM_REWARD_KEYWORDS');
  assert.ok(successIndex >= 0, '第一步必须使用 CLAIM_SUCCESS_KEYWORDS');
  assert.ok(rewardIndex > successIndex, '第二步领取奖励必须发生在领取成功之后');
  assert.match(claimBody, /clickNode\s*\(\s*success\s*\)/);
  assert.match(claimBody, /clickNode\s*\(\s*reward\s*\)/);
});

test('每次成功写 Prefs 并按 30 天阈值 stopSelf + 兼容通知', () => {
  const finishBody = bodyOf('private void finishClaim\\(\\)');
  assert.match(finishBody, /mPrefs\.incrementCount\s*\(\s*\)/);
  assert.match(finishBody, /System\.currentTimeMillis\s*\(\s*\)\s*-\s*mPrefs\.getFirstRunMs\s*\(\s*\)\s*>=\s*Config\.THIRTY_DAYS_MS/);
  assert.match(finishBody, /stopSelf\s*\(\s*\)/);
  assert.match(finishBody, /showCompletionNotice\s*\(\s*\)/);
  assert.match(src, /NotificationChannel/);
  assert.match(src, /Toast\.makeText/);
});

test('空闲轮次不退出，仅延时进入下一轮；全局超时防卡死', () => {
  const idleBody = bodyOf('private void runIdleRound\\(AccessibilityNodeInfo root\\)');
  assert.match(idleBody, /MAX_IDLE_ROUNDS/);
  assert.doesNotMatch(idleBody, /stopSelf\s*\(/);
  assert.match(idleBody, /scheduleNext\s*\(\s*Config\.POLL_INTERVAL_MS\s*\)/);
  const timeoutBody = bodyOf('private void enforceGlobalTimeout\\(\\)');
  assert.match(timeoutBody, /currentTimeMillis/);
  assert.match(timeoutBody, /ENTRY_WAIT_MS/);
  assert.match(timeoutBody, /scheduleNext\s*\(/);
});

test('递归轮询使用 Handler.postDelayed，严禁 while(true)', () => {
  const scheduleBody = bodyOf('private void scheduleNext\\(long delayMs\\)');
  assert.match(scheduleBody, /mHandler\.removeCallbacks\s*\(\s*mPollRunnable\s*\)/);
  assert.match(scheduleBody, /mHandler\.postDelayed\s*\(\s*mPollRunnable\s*,\s*delayMs\s*\)/);
  assert.doesNotMatch(src, /while\s*\(\s*true\s*\)/);
  assert.doesNotMatch(src, /for\s*\(\s*;\s*;\s*\)/);
});
