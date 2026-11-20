import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

test("settings.gradle sets rootProject.name to 'autowatch-ad'", () => {
  const text = read('settings.gradle');
  assert.match(text, /rootProject\.name\s*=\s*['"]autowatch-ad['"]/);
});

test("root build.gradle declares AGP 8.5.+ with apply false", () => {
  const text = read('build.gradle');
  assert.match(
    text,
    /id\s+['"]com\.android\.application['"]\s+version\s+['"]8\.5\.\+['"]\s+apply\s+false/
  );
});

test("app/build.gradle has required Android configuration", () => {
  const text = read('app/build.gradle');
  assert.match(text, /namespace\s+['"]com\.autowatch\.ad['"]/);
  assert.match(text, /applicationId\s+['"]com\.autowatch\.ad['"]/);
  assert.match(text, /compileSdk\s+34/);
  assert.match(text, /targetSdk\s+34/);
  assert.match(text, /minSdk\s+21/);
  assert.match(text, /sourceCompatibility\s+JavaVersion\.VERSION_17/);
  assert.match(text, /targetCompatibility\s+JavaVersion\.VERSION_17/);
});

test("gradle.properties enables AndroidX", () => {
  assert.match(read('gradle.properties'), /^\s*android\.useAndroidX\s*=\s*true\s*$/m);
});

test("gradle-wrapper.properties points to a Gradle 8.x distribution", () => {
  const text = read('gradle/wrapper/gradle-wrapper.properties');
  assert.match(
    text,
    /^distributionUrl=.*gradle-8\.\d+(?:-bin|-all)?\.zip$/m
  );
});

test("does not commit gradle-wrapper.jar", () => {
  assert.equal(existsSync(path.join(root, 'gradle/wrapper/gradle-wrapper.jar')), false);
});
