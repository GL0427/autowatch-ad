import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const configPath = new URL('../app/src/main/java/com/autowatch/ad/Config.java', import.meta.url);
const src = readFileSync(configPath, 'utf8');

function constantValue(name) {
  const re = new RegExp('public\\s+static\\s+final\\s+\\w+(?:\\[\\])?\\s+' + name + '\\s*=\\s*([^;]+);', 'm');
  const m = src.match(re);
  assert.ok(m, `缺少常量 ${name}`);
  return m[1].replace(/\s+/g, ' ').trim();
}

test('Config 是 public class 且常量均为 public static final', () => {
  assert.match(src, /public\s+class\s+Config\b/);
  assert.match(src, /package\s+com\.autowatch\.ad\s*;/);
});

test('包名与三十天毫秒常量', () => {
  assert.equal(constantValue('TARGET_PACKAGE'), '"com.luna.music"');
  assert.equal(constantValue('THIRTY_DAYS_MS'), '30L * 24 * 60 * 60 * 1000');
});

test('关键词数组取值', () => {
  assert.equal(constantValue('ENTRY_KEYWORDS'), '{"立即解锁", "立即领取", "立即领取时长", "免", "免广告", "免广告看视频"}');
  assert.equal(constantValue('CLAIM_SUCCESS_KEYWORDS'), '{"领取成功"}');
  assert.equal(constantValue('CLAIM_REWARD_KEYWORDS'), '{"领取奖励", "立即领取", "确认领取"}');
  assert.equal(constantValue('CONTINUE_WATCH_KEYWORDS'), '{"继续观看"}');
  assert.equal(constantValue('CLOSE_KEYWORDS'), '{"关闭", "×", "✕", "✖"}');
  assert.equal(constantValue('RENEW_DIALOG_KEYWORDS'), '{"元开通", "取消", "以后再说"}');
  assert.equal(constantValue('COUNTDOWN_KEYWORDS'), '{"秒后可领奖励", "秒后领取", "秒后关闭", "秒后获得"}');
});

test('超时常量取值', () => {
  assert.equal(constantValue('AD_WAIT_MS'), '30000');
  assert.equal(constantValue('ENTRY_WAIT_MS'), '60000');
  assert.equal(constantValue('CLAIM1_WAIT_MS'), '20000');
  assert.equal(constantValue('CLAIM2_WAIT_MS'), '15000');
  assert.equal(constantValue('POLL_INTERVAL_MS'), '800');
  assert.equal(constantValue('MAX_IDLE_ROUNDS'), '10');
});
