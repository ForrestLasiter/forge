#!/usr/bin/env node
/**
 * generate-curriculum-doc.js — writes docs/CURRICULUM.md from the lesson files.
 *
 * Hand-maintained documentation drifts from the code within about two commits.
 * Generating it means the index is always the truth: add a lesson, run
 * `npm run docs`, and the table updates itself.
 *
 * The same idea is why the screenshots are captured by the app
 * (`npm run screenshots`) rather than taken by hand.
 */

const fs = require('fs');
const path = require('path');
const lessons = require('../electron/lessons');

const OUT = path.join(__dirname, '..', 'docs', 'CURRICULUM.md');

/**
 * Pull the first real prose sentence out of a lesson body, for a one-line
 * summary. The filtering matters: an indented line is a code block, and the
 * first thing in most lessons is a heading followed by a code block. Check the
 * indentation on the RAW line — trimming first would hide exactly the signal we
 * are testing for.
 */
function firstSentence(body) {
  const raw = body.split('\n').find((line) => {
    if (/^\s/.test(line)) return false;              // indented -> code block
    const t = line.trim();
    if (!t) return false;
    if (/^[#>|\-*]/.test(t)) return false;           // heading, quote, table, list
    if (/^\d+\./.test(t)) return false;              // numbered list
    return /[a-z]{3}/i.test(t);                      // has actual words
  });
  if (!raw) return '';
  const stripped = raw.replace(/[`*]/g, '').trim();
  const end = stripped.search(/\.(\s|$)/);
  const sentence = (end === -1 ? stripped : stripped.slice(0, end + 1)).trim();
  return sentence.replace(/\|/g, '\\|');             // a bare pipe would split the table cell
}

const KIND_NAME = {
  shell: 'terminal',
  python: 'python',
  node: 'node',
  react: 'react',
  quiz: 'quiz',
};

const out = [];
let totalLessons = 0;
let totalExercises = 0;
let totalMinutes = 0;
const kindTally = {};

for (const track of lessons.tracks) {
  for (const lesson of track.lessons) {
    totalLessons += 1;
    totalMinutes += lesson.minutes;
    for (const ex of lesson.exercises) {
      totalExercises += 1;
      kindTally[ex.kind] = (kindTally[ex.kind] || 0) + 1;
    }
  }
}

out.push('# Curriculum');
out.push('');
out.push('<!-- GENERATED FILE — edit the lesson files, then run `npm run docs`. -->');
out.push('');
out.push(
  `**${lessons.tracks.length} tracks · ${totalLessons} lessons · ${totalExercises} graded exercises · ~${Math.round(totalMinutes / 60)} hours of reading** ` +
  `(plus however long the exercises take you, which is the part that matters).`
);
out.push('');
out.push('Exercise kinds: ' +
  Object.entries(kindTally)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${n} ${KIND_NAME[k] || k}`)
    .join(' · '));
out.push('');
out.push('The tracks are ordered deliberately. Linux first, because everything else runs');
out.push('on it. Python next, because most of the tooling around you is written in it.');
out.push('Then JavaScript, because React needs it. Then React. You can jump around, but');
out.push('later tracks assume the earlier ones.');
out.push('');
out.push('All four tracks share one dataset — a small fake SSH auth log in your sandbox.');
out.push('You solve the same log-triage problem as a shell pipeline, then in Python, then');
out.push('in Node. Seeing one problem in three languages is the fastest way to tell what');
out.push('is *language* and what is *programming*.');
out.push('');

for (const track of lessons.tracks) {
  const exCount = track.lessons.reduce((n, l) => n + l.exercises.length, 0);
  const minutes = track.lessons.reduce((n, l) => n + l.minutes, 0);

  out.push('---');
  out.push('');
  out.push(`## ${track.title}`);
  out.push('');
  out.push(`*${track.blurb}*`);
  out.push('');
  out.push(`${track.lessons.length} lessons · ${exCount} exercises · ~${minutes} minutes of reading`);
  out.push('');
  out.push('| # | Lesson | Exercises | Covers |');
  out.push('|---|---|---|---|');

  track.lessons.forEach((lesson, i) => {
    const kinds = lesson.exercises.reduce((acc, e) => {
      acc[e.kind] = (acc[e.kind] || 0) + 1;
      return acc;
    }, {});
    const kindStr = Object.entries(kinds)
      .map(([k, n]) => `${n} ${KIND_NAME[k] || k}`)
      .join(', ');
    out.push(
      `| ${String(i + 1).padStart(2, '0')} | **${lesson.title}** | ${kindStr} | ${firstSentence(lesson.body)} |`
    );
  });

  out.push('');
  out.push('<details><summary>Every exercise in this track</summary>');
  out.push('');
  for (const lesson of track.lessons) {
    out.push(`**${lesson.title}**`);
    out.push('');
    for (const ex of lesson.exercises) {
      const prompt = ex.prompt.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      const short = (prompt.length > 160 ? `${prompt.slice(0, 157)}…` : prompt).split('|').join('\\|');
      out.push(`- \`${ex.id}\` *(${KIND_NAME[ex.kind] || ex.kind})* — ${short}`);
    }
    out.push('');
  }
  out.push('</details>');
  out.push('');
}

out.push('---');
out.push('');
out.push('## Adding your own');
out.push('');
out.push('See [CONTRIBUTING.md](../CONTRIBUTING.md). The short version: copy a lesson');
out.push('object in `electron/lessons/<track>.js`, write a `check` function, then run');
out.push('`npm test` — it executes your reference solution through the real grader and');
out.push('fails if it does not pass its own checker.');
out.push('');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out.join('\n'), 'utf8');
console.log(`Wrote ${OUT} — ${lessons.tracks.length} tracks, ${totalLessons} lessons, ${totalExercises} exercises.`);
