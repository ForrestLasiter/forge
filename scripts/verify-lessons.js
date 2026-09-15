#!/usr/bin/env node
/**
 * verify-lessons.js — proves the curriculum is not lying to you.
 *
 * For every exercise in every track it takes the *reference solution* and puts
 * it through the exact grading path the app uses:
 *
 *   shell / python / node  -> lessons.submit(), which really executes it
 *   react                  -> compiled with Babel, mounted in jsdom, then the
 *                             same shared/assertions.mjs the app runs
 *   quiz                   -> sanity-checks the answer index and metadata
 *
 * If a checker is too strict, or a solution has a typo, this fails here rather
 * than wasting your time inside the app. Run it with `npm test`.
 *
 * Exercises can declare `requires: ['ip']`. If that binary is not on this
 * machine the exercise is SKIPPED rather than failed — Kali has `ip`, a minimal
 * container may not.
 */

const { execSync } = require('child_process');
const path = require('path');

const lessons = require('../electron/lessons');
const runner = require('../electron/runner');

const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', RESET = '\x1b[0m';

function have(binary) {
  try {
    execSync(`command -v ${binary}`, { stdio: 'ignore', shell: '/bin/bash' });
    return true;
  } catch {
    return false;
  }
}

// --- React grading in Node -------------------------------------------------
// jsdom gives us a DOM without a browser. React 18 renders into it happily, so
// the assertions can click and type exactly as they do inside Electron.
async function setupDom() {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', {
    pretendToBeVisual: true,
    url: 'http://localhost/',
  });
  const w = dom.window;
  for (const key of [
    'window', 'document', 'navigator', 'Event', 'MouseEvent', 'KeyboardEvent',
    'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Node', 'getComputedStyle',
    'requestAnimationFrame', 'cancelAnimationFrame',
  ]) {
    global[key] = w[key];
  }
  global.IS_REACT_ACT_ENVIRONMENT = false;
  return dom;
}

async function checkReactExercise(exercise, React, ReactDOMClient, ReactDOM, Babel, runAssertions) {
  const host = global.document.createElement('div');
  global.document.body.appendChild(host);
  const root = ReactDOMClient.createRoot(host);

  try {
    const { code: js } = Babel.transform(exercise.solution, {
      presets: [['react', { runtime: 'classic' }]],
      filename: 'exercise.jsx',
    });
    const name = exercise.componentName || 'App';
    const factory = new Function(
      'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useReducer',
      `${js}\n;return typeof ${name} === "function" ? ${name} : null;`
    );
    const Component = factory(
      React, React.useState, React.useEffect, React.useRef,
      React.useMemo, React.useCallback, React.useReducer
    );
    if (!Component) return { pass: false, message: `No component named ${name}` };

    ReactDOM.flushSync(() => root.render(React.createElement(Component)));
    await new Promise((r) => setTimeout(r, 30));
    return await runAssertions(host, exercise.assertions || [], exercise.solution);
  } catch (err) {
    return { pass: false, message: `${err.name}: ${err.message}` };
  } finally {
    setTimeout(() => { try { root.unmount(); } catch { /* ignore */ } }, 0);
  }
}

// --- main ------------------------------------------------------------------

(async () => {
  runner.resetWorkspace(); // start from clean lab files every run

  // Probe once. An exercise whose interpreter is not on this machine is SKIPPED,
  // not failed — pwsh may be absent on a Linux dev box, bash on a bare Windows
  // one. Maps each exercise kind to the toolchain entry it needs.
  const tools = await runner.probeToolchain();
  const NEEDS = { shell: 'bash', powershell: 'powershell', python: 'python', node: 'node' };

  const { runAssertions } = await import('../shared/assertions.mjs');
  await setupDom();
  const React = require('react');
  const ReactDOMClient = require('react-dom/client');
  const ReactDOM = require('react-dom');
  const Babel = require('@babel/standalone');

  let pass = 0, fail = 0, skip = 0;
  const failures = [];

  for (const track of lessons.tracks) {
    console.log(`\n${DIM}── ${track.title} ──${RESET}`);

    for (const lesson of track.lessons) {
      const line = [];

      for (const exercise of lesson.exercises) {
        const id = `${track.id}/${lesson.id}/${exercise.id}`;

        // Tracks/lessons/exercises tagged for another OS are skipped here (the
        // app still shows them). The bash track is platform:'linux', so it does
        // not fail on a Windows runner where its Unix tools differ.
        const plat = exercise.platform || lesson.platform || track.platform;
        if (plat && plat !== process.platform) {
          skip += 1; line.push(`${YELLOW}s${RESET}`); continue;
        }

        // Skip if the interpreter this kind needs is not installed on this box.
        const need = NEEDS[exercise.kind];
        if (need && tools[need] && !tools[need].available) {
          skip += 1; line.push(`${YELLOW}s${RESET}`); continue;
        }

        // Environment-dependent exercises are skipped, not failed.
        if (exercise.requires && exercise.requires.some((b) => !have(b))) {
          skip += 1; line.push(`${YELLOW}s${RESET}`); continue;
        }

        let verdict;
        if (exercise.kind === 'quiz') {
          const ok =
            Array.isArray(exercise.choices) &&
            exercise.choices.length >= 2 &&
            Number.isInteger(exercise.answer) &&
            exercise.answer >= 0 &&
            exercise.answer < exercise.choices.length &&
            typeof exercise.explain === 'string' &&
            exercise.explain.length > 20;
          verdict = { pass: ok, message: ok ? 'ok' : 'malformed quiz (choices/answer/explain)' };
        } else if (exercise.kind === 'react') {
          if (!exercise.solution) verdict = { pass: false, message: 'no solution' };
          else verdict = await checkReactExercise(exercise, React, ReactDOMClient, ReactDOM, Babel, runAssertions);
        } else {
          if (!exercise.solution) {
            verdict = { pass: false, message: 'no solution' };
          } else {
            const res = await lessons.submit({
              trackId: track.id,
              lessonId: lesson.id,
              exerciseId: exercise.id,
              code: exercise.solution,
            });
            verdict = res;
            if (!res.pass && res.result) {
              verdict = { ...res, message: `${res.message}\n      stderr: ${(res.result.stderr || '').slice(0, 300)}` };
            }
          }
        }

        if (verdict.pass) { pass += 1; line.push(`${GREEN}.${RESET}`); }
        else { fail += 1; line.push(`${RED}F${RESET}`); failures.push({ id, message: verdict.message }); }
      }

      console.log(`  ${line.join('')}  ${DIM}${lesson.id}${RESET}`);
    }
  }

  console.log('');
  if (failures.length) {
    console.log(`${RED}Failures:${RESET}`);
    for (const f of failures) console.log(`  ${RED}✗${RESET} ${f.id}\n      ${f.message}`);
    console.log('');
  }
  console.log(
    `${pass === 0 ? RED : GREEN}${pass} passed${RESET}` +
    (fail ? `, ${RED}${fail} failed${RESET}` : '') +
    (skip ? `, ${YELLOW}${skip} skipped (missing tool)${RESET}` : '')
  );

  process.exit(fail ? 1 : 0);
})();
