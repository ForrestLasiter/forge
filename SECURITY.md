# Security & trust model

Forge is a single-user desktop app whose entire purpose is to run **your own
code** — shell, Python, Node and React — and grade the result. Read this before
judging it against a threat model it is not trying to meet.

## The one-sentence version

Forge runs code you wrote, on your machine, with your privileges, on purpose.
It is a learning tool, not a sandbox for untrusted code. **Don't paste code you
don't trust into Forge — the same rule as pasting it into a terminal.**

## What *is* a boundary

- **The renderer cannot reach the OS on its own.** The window runs with
  `contextIsolation: true` and `nodeIntegration: false`, so page code cannot
  `require()` Node, open a raw socket, or read an arbitrary file by itself. It
  reaches Node only through the explicit `window.forge.*` calls in
  `electron/preload.js`. This protects you from a *bug in the UI*, and it is why
  a rendering glitch can't delete your home directory.
- **Graded passes for shell/python/node cannot be faked by the UI.** The `check`
  functions live in the main process and are stripped from the curriculum before
  it crosses IPC (`electron/lessons/index.js`), so the renderer never holds the
  logic that decides pass/fail for those tracks.
- **Process runaways are contained.** Python/Node/shell run via `spawn` with
  `detached: true`; a 10-second timeout kills the whole process group with
  `process.kill(-pid)`, and each output stream is capped at 100 KB by slicing
  every chunk to the remaining room (`electron/runner.js`).

## What is deliberately *not* a boundary

These are not bugs. They are what "teach the real command line" requires.

- **The `~/.forge/workspace` lab is a working directory, not a jail.** It is the
  default `cwd` and holds seeded practice files so everyday `rm`/`chmod`/`find`
  land on throwaway data. Code you run can `cd` out of it, read `$HOME`, write
  elsewhere, or reach the network — exactly as it could in your own terminal.
  A real OS/container sandbox would defeat the point: you *want* real `find /`,
  real `ip`, real tools.
- **React exercises run in the app's own renderer.** JSX is compiled in-page and
  instantiated with `new Function`. That isolates local scope but **not** browser
  globals, so React exercise code can reach `window.forge` and therefore the same
  `run`/`shell` execution the other tracks use. There is no separate realm.
  Adding one (an out-of-process frame) would not change what a learner can
  already do one tab over on the Kali track, so it is not built.
- **React completion is reported by the renderer.** A React component only exists
  once mounted, so React grading happens in the page and reports its verdict via
  `forge:complete`. Progress (`~/.forge/progress.json`) is therefore a personal
  record, not an anti-cheat: a determined user can mark their own exercises done.
  The only person that fools is themselves.
- **A synchronous infinite loop in a React exercise freezes the window.**
  `while (true) {}` runs on the renderer's single thread with no timeout and
  hangs the app until you restart it. Render-time *exceptions* are caught by an
  error boundary; a runaway *loop* cannot be, because there is no separate
  process to kill. Restarting the app is the recovery path.

## If you are hardening this for a different threat model

If you ever wanted Forge to run genuinely *untrusted* code (e.g. a hosted,
multi-user version), the changes are real work, not tweaks:

- Execute learner code in a real OS/container sandbox with a filesystem and
  network policy, instead of the user's own shell.
- Render React exercises in an out-of-process, origin-isolated frame with no
  `window.forge`, so a runaway can be killed and globals are unreachable.
- Treat `forge:complete` and any renderer-supplied `cwd` as untrusted input and
  validate them in the main process.

None of that is needed for the app as it exists — a local tool teaching you to
use your own machine — which is why it is documented here rather than done.

## Reporting

Found something that breaks the boundaries in the first section above (e.g. the
renderer reaching the OS *without* going through `window.forge`)? Open an issue
at <https://github.com/forrestlasiter/forge/issues>.
