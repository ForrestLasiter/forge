/**
 * progress.js — remembers which exercises you have passed.
 *
 * WHY A FILE AND NOT localStorage:
 * localStorage lives inside Chromium's profile for this app. It works, but it is
 * invisible and hard to back up. A plain JSON file at ~/.forge/progress.json you
 * can `cat`, copy to another machine, or version-control. For a tool that is
 * teaching you the filesystem, being inspectable matters.
 *
 * WHY THE ATOMIC WRITE (write temp -> rename):
 * If the app is killed halfway through fs.writeFileSync you get a truncated,
 * unparseable file and lose all progress. rename() on the same filesystem is
 * atomic: the file is either the old one or the new one, never half of each.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = path.join(os.homedir(), '.forge');
const FILE = path.join(DIR, 'progress.json');

const EMPTY = { version: 1, completed: {}, attempts: {}, lastLesson: null, savedCode: {} };

function load() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

function save(state) {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmp, FILE);
  return state;
}

function markComplete(key) {
  const state = load();
  state.completed[key] = new Date().toISOString();
  return save(state);
}

function recordAttempt(key) {
  const state = load();
  state.attempts[key] = (state.attempts[key] || 0) + 1;
  return save(state);
}

function setLastLesson(trackId, lessonId) {
  const state = load();
  state.lastLesson = { trackId, lessonId };
  return save(state);
}

/** Persist whatever you typed, so closing the app mid-exercise costs nothing. */
function saveCode(key, code) {
  const state = load();
  state.savedCode[key] = code;
  return save(state);
}

function resetAll() {
  return save({ ...EMPTY });
}

module.exports = { load, save, markComplete, recordAttempt, setLastLesson, saveCode, resetAll, FILE };
