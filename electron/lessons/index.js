/**
 * lessons/index.js — the curriculum registry and the grading engine.
 *
 * THE CONTRACT (read this before adding your own lessons — see README)
 *
 *   track   = { id, title, blurb, colour, lessons: [lesson] }
 *   lesson  = { id, title, minutes, body (markdown), exercises: [exercise] }
 *   exercise= {
 *       id, kind: 'shell'|'python'|'node'|'react'|'quiz',
 *       prompt (markdown), starter, solution, hints: [string],
 *       check: ({ code, result, h }) => boolean | { pass, message }
 *   }
 *
 * WHY `check` IS A FUNCTION AND NOT DATA:
 * Real grading needs real logic — "did stdout contain 3 lines that each parse as
 * an IP?" is not expressible as a config blob without inventing a whole language.
 * A plain JS function is the language, and it already exists.
 *
 * WHY FUNCTIONS NEVER LEAVE THIS FILE:
 * Electron's IPC serialises messages with the structured clone algorithm, which
 * cannot clone a function. So `toSerialisable()` strips `check` before the
 * curriculum is sent to the React UI, and grading always happens here in the
 * main process. That is also the safe design: the UI can never be tricked into
 * marking itself complete.
 */

const runner = require('../runner');
const fs = require('fs');
const path = require('path');

const tracks = [
  require('./linux'),
  require('./python'),
  require('./node'),
  require('./react'),
];

/** Helpers handed to every `check` function. Keeps lesson code short and readable. */
function makeHelpers() {
  const ws = runner.ensureWorkspace();
  return {
    ws,
    /** Read a file inside the workspace; returns '' if it is not there. */
    read(rel) {
      try { return fs.readFileSync(path.join(ws, rel), 'utf8'); } catch { return ''; }
    },
    exists(rel) {
      return fs.existsSync(path.join(ws, rel));
    },
    /** Non-empty, trimmed lines — what you almost always mean by "the output". */
    lines(text) {
      return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
    },
    /** Collapse whitespace + lowercase, for forgiving text comparison. */
    norm(text) {
      return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    },
    /** Does the code contain this identifier as a whole word? */
    uses(code, word) {
      return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(code || '');
    },
  };
}

function findExercise(trackId, lessonId, exerciseId) {
  const track = tracks.find((t) => t.id === trackId);
  if (!track) throw new Error(`No track "${trackId}"`);
  const lesson = track.lessons.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`No lesson "${lessonId}" in ${trackId}`);
  const exercise = lesson.exercises.find((e) => e.id === exerciseId);
  if (!exercise) throw new Error(`No exercise "${exerciseId}" in ${lessonId}`);
  return { track, lesson, exercise };
}

/** Run the learner's code with whichever interpreter this exercise calls for. */
async function runExercise(kind, code) {
  switch (kind) {
    case 'python': return runner.runPython(code);
    case 'node': return runner.runNode(code);
    case 'shell': return runner.runShell(code);
    default: return { stdout: '', stderr: '', exitCode: 0, timedOut: false, ms: 0 };
  }
}

/**
 * Execute + grade one submission.
 * Returns { pass, message, result } where result is the raw run output so the UI
 * can show you stdout/stderr even when you failed — especially when you failed.
 */
async function submit({ trackId, lessonId, exerciseId, code }) {
  const { exercise } = findExercise(trackId, lessonId, exerciseId);

  if (exercise.kind === 'quiz') {
    const chosen = Number(code);
    const pass = chosen === exercise.answer;
    return {
      pass,
      message: pass ? 'Correct.' : 'Not quite.',
      explain: exercise.explain || '',
      result: null,
    };
  }

  // 'react' exercises are graded in the renderer against the real DOM, because
  // that is the only place a React tree exists. See src/components/ReactPreview.jsx.
  if (exercise.kind === 'react') {
    return { pass: false, message: 'React exercises are checked in the preview pane.', result: null };
  }

  const result = await runExercise(exercise.kind, code);

  if (result.timedOut) {
    return {
      pass: false,
      message: 'Your code ran for 10 seconds and was stopped. That almost always means an infinite loop — check your while condition or your recursion base case.',
      result,
    };
  }

  let verdict;
  try {
    verdict = await exercise.check({ code, result, h: makeHelpers() });
  } catch (err) {
    verdict = { pass: false, message: `The checker itself errored: ${err.message}` };
  }

  if (typeof verdict === 'boolean') {
    verdict = {
      pass: verdict,
      message: verdict ? 'Passed.' : 'Output did not match what the exercise asked for.',
    };
  }
  return { ...verdict, result };
}

/** Strip functions so the curriculum can cross the IPC boundary. */
function toSerialisable() {
  return tracks.map((track) => ({
    id: track.id,
    title: track.title,
    blurb: track.blurb,
    colour: track.colour,
    lessons: track.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      minutes: lesson.minutes,
      body: lesson.body,
      exercises: lesson.exercises.map((ex) => ({
        id: ex.id,
        kind: ex.kind,
        prompt: ex.prompt,
        starter: ex.starter || '',
        solution: ex.solution || '',
        hints: ex.hints || [],
        choices: ex.choices || null,
        explain: ex.explain || '',
        componentName: ex.componentName || null,
        assertions: ex.assertions || null,
      })),
    })),
  }));
}

module.exports = { tracks, toSerialisable, submit, findExercise, makeHelpers, runExercise };
