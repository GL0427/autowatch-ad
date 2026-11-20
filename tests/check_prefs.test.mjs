import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const prefsPath = new URL('../app/src/main/java/com/autowatch/ad/Prefs.java', import.meta.url);
const src = readFileSync(prefsPath, 'utf8');

function constantValue(name) {
  const re = new RegExp('public\\s+static\\s+final\\s+\\w+\\s+' + name + '\\s*=\\s*([^;]+);', 'm');
  const m = src.match(re);
  assert.ok(m, `缺少常量 ${name}`);
  return m[1].replace(/\s+/g, ' ').trim();
}

function hasMethod(signature) {
  const re = new RegExp(signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\s+/g, '\\s+'));
  return re.test(src);
}

test('Prefs 是 public class，包名为 com.autowatch.ad，构造接收 Context', () => {
  assert.match(src, /package\s+com\.autowatch\.ad\s*;/);
  assert.match(src, /public\s+class\s+Prefs\b/);
  assert.match(src, /public\s+Prefs\s*\(\s*Context\s+\w+\s*\)/);
});

test('PREFS_NAME 与三个键常量齐备', () => {
  assert.equal(constantValue('PREFS_NAME'), '"autowatch_ad_prefs"');
  assert.equal(constantValue('KEY_FIRST_RUN_MS'), '"firstRunMs"');
  assert.equal(constantValue('KEY_DAILY_COUNT'), '"dailyCount"');
  assert.equal(constantValue('KEY_LAST_RUN_DAY'), '"lastRunDay"');
});

test('读写方法齐备', () => {
  assert.ok(hasMethod('public long getFirstRunMs()'), '缺少 getFirstRunMs()');
  assert.ok(hasMethod('public void ensureFirstRun()'), '缺少 ensureFirstRun()');
  assert.ok(hasMethod('public int getCount()'), '缺少 getCount()');
  assert.ok(hasMethod('public void incrementCount()'), '缺少 incrementCount()');
  assert.ok(hasMethod('public void resetIfNewDay()'), '缺少 resetIfNewDay()');
});

test('ensureFirstRun 首次写入 System.currentTimeMillis()，且写入后不再覆盖', () => {
  const body = src.match(/public\s+void\s+ensureFirstRun\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/);
  assert.ok(body, 'ensureFirstRun 方法体缺失');
  assert.match(body[1], /contains\s*\(\s*KEY_FIRST_RUN_MS\s*\)/, '首次运行必须先检查 key 是否已存在');
  assert.match(body[1], /putLong\s*\(\s*KEY_FIRST_RUN_MS\s*,\s*System\.currentTimeMillis\(\)\s*\)/,
    '首次运行必须写入 System.currentTimeMillis()');
  const wholeWrites = src.match(/putLong\s*\(\s*KEY_FIRST_RUN_MS\s*,/g) ?? [];
  assert.equal(wholeWrites.length, 1, 'KEY_FIRST_RUN_MS 只能有一处写入，确保写入后绝不覆盖');
});

test('跨天重置同时更新 lastRunDay 并把 dailyCount 清零', () => {
  const body = src.match(/public\s+void\s+resetIfNewDay\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/);
  assert.ok(body, 'resetIfNewDay 方法体缺失');
  assert.match(body[1], /KEY_LAST_RUN_DAY/);
  assert.match(body[1], /putInt\s*\(\s*KEY_DAILY_COUNT\s*,\s*0\s*\)/);
});

test('incrementCount 递增 dailyCount', () => {
  const body = src.match(/public\s+void\s+incrementCount\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/);
  assert.ok(body, 'incrementCount 方法体缺失');
  assert.match(body[1], /getCount\s*\(\s*\)\s*\+\s*1/);
  assert.match(body[1], /putInt\s*\(\s*KEY_DAILY_COUNT\s*,/);
});
