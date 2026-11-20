import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const workflowText = readFileSync(path.join(root, '.github/workflows/build.yml'), 'utf8');
const gradleText = readFileSync(path.join(root, 'build.gradle'), 'utf8');

function stripQuotes(v) {
  return String(v ?? '').replace(/^['"]|['"]$/g, '').trim();
}

function parseSteps(text) {
  const steps = [];
  let current = null;
  let inWith = false;
  for (const line of text.split(/\r?\n/)) {
    const head = line.match(/^      - name:\s*(.+?)\s*$/);
    if (head) {
      if (current) steps.push(current);
      current = { name: head[1], with: {} };
      inWith = false;
      continue;
    }
    if (!current) continue;
    if (/^        with:\s*$/.test(line)) {
      inWith = true;
      continue;
    }
    const nested = line.match(/^\s{10}([A-Za-z0-9_-]+):\s*(.+?)\s*$/);
    if (inWith && nested) {
      current.with[nested[1]] = nested[2];
      continue;
    }
    const field = line.match(/^\s{8}([A-Za-z0-9_-]+):\s*(.+?)\s*$/);
    if (field) {
      current[field[1]] = field[2];
      continue;
    }
    if (/^      \S/.test(line)) inWith = false;
  }
  if (current) steps.push(current);
  return steps;
}

test('workflow 触发 push 与 workflow_dispatch', () => {
  assert.match(workflowText, /^on:\s*$/m);
  assert.match(workflowText, /^\s{2}push:\s*$/m);
  assert.match(workflowText, /^\s{2}workflow_dispatch:\s*$/m);
});

test('使用 ubuntu-latest runner', () => {
  assert.match(workflowText, /runs-on:\s*ubuntu-latest\s*$/m);
});

test('步骤顺序与版本正确：checkout → setup-gradle@v3 → setup-java@v4 → assembleDebug → upload-artifact@v4', () => {
  const uses = [...workflowText.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)].map((m) => m[1]);
  assert.deepEqual(uses, [
    'actions/checkout@v4',
    'gradle/actions/setup-gradle@v3',
    'actions/setup-java@v4',
    'actions/upload-artifact@v4',
  ]);
  const order = [
    'actions/checkout@v4',
    'gradle/actions/setup-gradle@v3',
    'actions/setup-java@v4',
    'gradle assembleDebug',
    'actions/upload-artifact@v4',
  ];
  let at = -1;
  for (const token of order) {
    const next = workflowText.indexOf(token, at + 1);
    assert.ok(next > at, `步骤缺失或顺序错误：${token}`);
    at = next;
  }
});

test('setup-gradle 提供 Gradle 8.x，规避 wrapper.jar', () => {
  assert.match(workflowText, /uses:\s*gradle\/actions\/setup-gradle@v3\b/);
  assert.match(workflowText, /gradle-version:\s*['"]?8\.\d+['"]?/);
  assert.doesNotMatch(workflowText, /gradlew\b/);
});

test('setup-java 安装 JDK 17 temurin', () => {
  assert.match(workflowText, /uses:\s*actions\/setup-java@v4\b/);
  assert.match(workflowText, /distribution:\s*['"]?temurin['"]?/);
  assert.match(workflowText, /java-version:\s*['"]?17['"]?/);
});

test('上传产物路径与 AGP 8.x 匹配', () => {
  assert.match(workflowText, /uses:\s*actions\/upload-artifact@v4\b/);
  assert.match(workflowText, /path:\s*app\/build\/outputs\/apk\/debug\/\*\.apk/);
  assert.match(gradleText, /id\s+['"]com\.android\.application['"]\s+version\s+['"]8\.\d+\.\+['"]\s+apply\s+false/);
});

test('YAML 结构断言：所有步骤与关键字段齐备', () => {
  const steps = parseSteps(workflowText);
  assert.equal(steps.length, 5);
  assert.equal(stripQuotes(steps[0].uses), 'actions/checkout@v4');
  assert.equal(stripQuotes(steps[1].uses), 'gradle/actions/setup-gradle@v3');
  assert.match(stripQuotes(steps[1].with['gradle-version']), /^8\.\d+$/);
  assert.equal(stripQuotes(steps[2].uses), 'actions/setup-java@v4');
  assert.equal(stripQuotes(steps[2].with.distribution), 'temurin');
  assert.equal(stripQuotes(steps[2].with['java-version']), '17');
  assert.equal(stripQuotes(steps[3].run), 'gradle assembleDebug');
  assert.equal(stripQuotes(steps[4].uses), 'actions/upload-artifact@v4');
  assert.equal(stripQuotes(steps[4].with.path), 'app/build/outputs/apk/debug/*.apk');
});
