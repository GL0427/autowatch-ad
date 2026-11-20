import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const readmePath = new URL('../README.md', import.meta.url);
const md = readFileSync(readmePath, 'utf8');

test('README 存在且为中文文档', () => {
  assert.ok(md.length > 200, 'README 内容过短');
  assert.match(md, /[\u4e00-\u9fa5]/, 'README 应包含中文');
});

test('项目定位段落：独立 APK、不依赖 AScript/电脑/IP、纯本地', () => {
  assert.match(md, /##\s*项目定位/);
  assert.match(md, /独立\s*APK/);
  assert.match(md, /AScript/);
  assert.match(md, /电脑/);
  assert.match(md, /IP/);
  assert.match(md, /本地/);
});

test('构建安装流程段落：fork→Actions→下载→安装→无障碍→开始', () => {
  assert.match(md, /##\s*构建与安装/);
  assert.match(md, /Fork/);
  assert.match(md, /Actions/);
  assert.match(md, /Run workflow/);
  assert.match(md, /Artifacts/);
  assert.match(md, /apk/i);
  assert.match(md, /安装/);
  assert.match(md, /无障碍/);
  assert.match(md, /开始/);
});

test('目标包名 com.luna.music', () => {
  assert.match(md, /com\.luna\.music/);
  assert.match(md, /汽水音乐/);
});

test('无障碍权限用途说明段落', () => {
  assert.match(md, /##\s*无障碍权限用途说明/);
  assert.match(md, /BIND_ACCESSIBILITY_SERVICE/);
  assert.match(md, /com\.luna\.music/);
  assert.match(md, /跳过|关闭/);
});

test('30 天周期机制段落：首启计时、杀进程连续、满 30 天自动停', () => {
  assert.match(md, /##\s*30\s*天周期机制/);
  assert.match(md, /首启计时/);
  assert.match(md, /杀进程连续/);
  assert.match(md, /满\s*30\s*天自动停/);
  assert.match(md, /firstRunMs/);
});

test('微调指引段落：Config.java 关键词/等待时长/包名后重新构建', () => {
  assert.match(md, /##\s*微调指引/);
  assert.match(md, /Config\.java/);
  assert.match(md, /关键词/);
  assert.match(md, /等待时长/);
  assert.match(md, /包名/);
  assert.match(md, /重新构建/);
});

test('文中提及 Config.java 的具体关键词与等待常量', () => {
  for (const name of ['ENTRY_KEYWORDS', 'CLAIM_SUCCESS_KEYWORDS', 'CLAIM_REWARD_KEYWORDS', 'CONTINUE_WATCH_KEYWORDS', 'CLOSE_KEYWORDS', 'RENEW_DIALOG_KEYWORDS', 'COUNTDOWN_KEYWORDS']) {
    assert.ok(md.includes(name), `README 缺少关键词数组 ${name}`);
  }
  for (const name of ['AD_WAIT_MS', 'ENTRY_WAIT_MS', 'CLAIM1_WAIT_MS', 'CLAIM2_WAIT_MS', 'POLL_INTERVAL_MS', 'MAX_IDLE_ROUNDS']) {
    assert.ok(md.includes(name), `README 缺少等待常量 ${name}`);
  }
  assert.match(md, /TARGET_PACKAGE/);
});
