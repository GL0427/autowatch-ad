import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const manifest = readFileSync(resolve(root, 'app/src/main/AndroidManifest.xml'), 'utf8');
const config = readFileSync(resolve(root, 'app/src/main/res/xml/accessibility_service_config.xml'), 'utf8');

const attr = (source, name) => {
  const match = source.match(new RegExp(`android:${name}\\s*=\\s*"([^"]*)"`));
  return match ? match[1] : null;
};

const tag = (source, name) => {
  const open = source.match(new RegExp(`<${name}\\b[\\s\\S]*?>`, 'i'));
  if (!open) return '';
  if (/\/>$/.test(open[0])) return open[0];
  const openEnd = open.index + open[0].length;
  const close = source.slice(openEnd).search(new RegExp(`<\\/${name}>`, 'i'));
  if (close === -1) return open[0];
  const closeTag = source.slice(openEnd + close).match(/<\/[^>]+>/)[0];
  return source.slice(open.index, openEnd + close + closeTag.length);
};

test('Manifest declares BIND_ACCESSIBILITY_SERVICE permission', () => {
  assert.match(
    manifest,
    /<uses-permission\s+android:name="android\.permission\.BIND_ACCESSIBILITY_SERVICE"\s*\/>/,
  );
});

test('Manifest declares MainActivity as MAIN/LAUNCHER', () => {
  const activity = tag(manifest, 'activity');
  assert.equal(attr(activity, 'name'), '.MainActivity');
  assert.match(activity, /android:name="android\.intent\.action\.MAIN"/);
  assert.match(activity, /android:name="android\.intent\.category\.LAUNCHER"/);
});

test('Manifest declares AdWatchService with accessibility permission and config meta-data', () => {
  const service = tag(manifest, 'service');
  assert.equal(attr(service, 'name'), '.AdWatchService');
  assert.equal(attr(service, 'exported'), 'true');
  assert.equal(attr(service, 'permission'), 'android.permission.BIND_ACCESSIBILITY_SERVICE');
  assert.match(
    service,
    /<meta-data\s+android:name="android\.accessibilityservice"\s+android:resource="@xml\/accessibility_service_config"\s*\/>/,
  );
});

test('Accessibility config enables window content, timeout and target package', () => {
  assert.equal(attr(config, 'canRetrieveWindowContent'), 'true');
  assert.ok(attr(config, 'notificationTimeout'), 'notificationTimeout must be set');
  const eventTypes = attr(config, 'accessibilityEventTypes') ?? '';
  assert.ok(eventTypes.includes('typeWindowStateChanged'), 'must listen to window state changes');
  assert.ok(eventTypes.includes('typeWindowContentChanged'), 'must listen to window content changes');
  const packages = attr(config, 'packageNames') ?? '';
  assert.ok(packages.split(/[,\s]+/).includes('com.luna.music'), 'must target com.luna.music');
});

test('Accessibility config uses a string resource description with Chinese text', () => {
  const description = attr(config, 'description') ?? '';
  assert.match(description, /^@string\//, 'description must be a @string/ resource reference (AAPT requires it)');
  const stringsPath = resolve(root, 'app/src/main/res/values/strings.xml');
  const stringsXml = readFileSync(stringsPath, 'utf8');
  const resName = description.replace('@string/', '');
  const entry = new RegExp(`<string\\s+name="${resName}"[^>]*>([\\s\\S]*?)<\\/string>`).exec(stringsXml);
  assert.ok(entry, `strings.xml must define ${resName}`);
  assert.match(entry[1], /[\u4e00-\u9fff]/, 'description resource must contain Chinese text');
});
