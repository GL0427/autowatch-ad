import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const activityPath = new URL('../app/src/main/java/com/autowatch/ad/MainActivity.java', import.meta.url);
const layoutPath = new URL('../app/src/main/res/layout/activity_main.xml', import.meta.url);
const src = readFileSync(activityPath, 'utf8');
const layout = readFileSync(layoutPath, 'utf8');

test('MainActivity 检查 Settings.Secure 中的无障碍服务开关', () => {
  assert.match(src, /Settings\.Secure\.getString/);
  assert.match(src, /Settings\.Secure\.ENABLED_ACCESSIBILITY_SERVICES/);
  assert.match(src, /AdWatchService/);
  assert.match(src, /isAccessibilityServiceEnabled/);
});

test('无障碍未开启时按钮跳转 Settings.ACTION_ACCESSIBILITY_SETTINGS', () => {
  assert.match(src, /new\s+Intent\s*\(\s*Settings\.ACTION_ACCESSIBILITY_SETTINGS\s*\)/);
  assert.match(src, /startActivity\s*\(/);
  assert.match(layout, /@\+id\/btnOpenAccessibility/);
  assert.match(layout, /开启无障碍服务/);
});

test('开始按钮通过 PackageManager.getLaunchIntentForPackage 拉起目标包一次', () => {
  assert.match(src, /PackageManager\s+\w+\s*=\s*getPackageManager\s*\(\s*\)/);
  assert.match(src, /\w+\.getLaunchIntentForPackage\s*\(\s*Config\.TARGET_PACKAGE\s*\)/);
  assert.match(src, /startActivity\s*\(/);
  assert.match(src, /targetLaunched/);
  assert.match(layout, /@\+id\/btnStart/);
});

test('剩余天数由 Prefs.firstRunMs 与 Config.THIRTY_DAYS_MS 计算', () => {
  assert.match(src, /prefs\.getFirstRunMs\s*\(\s*\)/);
  assert.match(src, /Config\.THIRTY_DAYS_MS/);
  assert.match(src, /System\.currentTimeMillis\s*\(\s*\)/);
  assert.match(src, /remainingDays/);
  assert.match(src, /remainingDaysText\.setText/);
  assert.match(layout, /@\+id\/tvRemainingDays/);
});
