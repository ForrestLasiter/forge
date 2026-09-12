# Architecture

How Forge is put together, and why each decision went the way it did. If you are
working through the Node and React tracks, this document is the map for reading
the source afterwards.

---

## The shape of an Electron app

Electron is Chromium and Node.js in one process tree. It runs **two kinds of
process**, and almost every Electron bug comes from forgetting which one your
code is in.

```
┌─────────────────────────────────────────────────────────────────┐
│  MAIN PROCESS  —  electron/main.js                              │
│  Plain Node.js. Full OS access: filesystem, child processes,    │
│  windows. There is exactly one, and it owns the app's lifetime. │
│                                                                 │
│    runner.js     spawns python3 / node / bash                   │
│    progress.js   reads and writes ~/.forge/progress.json        │
│    lessons/      the curriculum AND the grading logic           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    IPC (structured clone)
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│  PRELOAD  —  electron/preload.js                                │
│  Runs before the page loads, in a privileged bridge context.    │
│  Uses contextBridge to expose exactly nine functions on         │
│  window.forge. Nothing else crosses.                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│  RENDERER  —  src/*.jsx                                         │
│  A Chromium tab running React. NO filesystem. NO require().     │
│  Can only call window.forge.*                                   │
└─────────────────────────────────────────────────────────────────┘
```

The renderer is sandboxed on purpose. `contextIsolation: true` and
`nodeIntegration: false` are the modern Electron defaults, and they are the
reason a bug in the UI cannot delete your home directory. Older tutorials turn
both off because it is easier; that is how Electron got its security reputation.

### Why grading lives in the main process

`lessons/index.js` exports two things: the curriculum with its `check` functions,
and `toSerialisable()`, which **strips those functions** before the curriculum
crosses IPC.

There are two reasons, and both are worth internalising:

1. **Mechanical.** Electron IPC serialises with the structured clone algorithm,
   which cannot clone a function. Sending a `check` would throw.
2. **Security.** The UI can never mark itself complete, because it does not have
   the logic that decides. It sends code up and gets a verdict back. This is the
   same principle as never trusting a browser to validate its own form input —
   a habit worth building on a toy app so it is automatic on a real one.

---

## Executing the learner's code

`electron/runner.js`. Three decisions carry most of the weight.

### `spawn`, not `exec`

`exec()` hands your string to a shell and buffers all output in memory.
`spawn()` gives back a stream, so output can be capped, and — with
`detached: true` — puts the child in its own **process group**.

That last part is the one that matters. `process.kill(-pid)` with a negative PID
signals the whole group, so an infinite loop that has itself spawned children
dies as a unit. Without it, `child.kill()` orphans the grandchildren and they run
until you reboot.

```js
const child = spawn(command, args, { cwd, detached: true });
// …
process.kill(-child.pid, 'SIGKILL');   // the minus sign is the whole trick
```

### Caps and timeouts

- **10 second timeout**, then SIGKILL. A `while True:` in an exercise is a normal
  student mistake, not a crash.
- **100 KB output cap.** A runaway `print` in a loop would otherwise grow a
  string until the process dies of memory exhaustion.
- **Never rejects on non-zero exit.** A failing program is a normal outcome in a
  learning app, so the promise always resolves with
  `{ stdout, stderr, exitCode, timedOut, ms }` and the caller decides.

### The sandbox workspace

Everything runs with `cwd` set to `~/.forge/workspace`. That directory is seeded
with a small fake `lab/` — SSH auth logs, an access log, a target list — so
exercises have concrete data, and so a lesson that says "delete every .tmp file"
cannot reach anything you care about.

`resetWorkspace()` wipes and re-seeds it. The **reset lab** button in the UI is
the only destructive action in the app, and it is scoped to that one directory.

### What the sandbox shell deliberately is not

Each submission is a fresh `bash -lc`. No pseudo-terminal, so `vim`, `less`,
`man` and `top` do not display, and `cd` does not persist between submissions.

A real terminal needs `node-pty` — a native module that has to be compiled
against the exact Electron ABI, and one of the most common causes of "this app
won't install" on Linux. That cost buys features this app does not need, on a
machine where a real terminal is one keystroke away. The trade is documented in
the lesson text itself so it never surprises anyone.

---

## Grading

### Shell, Python and Node

Each exercise carries a `check` function:

```js
check: ({ code, result, h }) => ({ pass: boolean, message: string })
```

- `code` — what the learner typed
- `result` — the run output (`stdout`, `stderr`, `exitCode`, `timedOut`, `ms`)
- `h` — helpers: `h.read(rel)` and `h.exists(rel)` inspect workspace files,
  `h.lines(text)` splits into non-empty trimmed lines, `h.uses(code, word)` tests
  for a whole-word identifier

A function rather than a config blob because real grading needs real logic. "Did
this produce exactly three lines that each parse as an IP?" is not expressible as
data without inventing a language, and JavaScript already is one.

Checks routinely look at the **filesystem as well as the output**. The
permissions exercise passes only if `stat` reports mode `600` — output that
merely looks right is not enough.

Messages are written to teach. A failed check says what was expected *and* what
arrived, and a passing one usually adds the thing worth noticing:

> *Five failed logins. `grep -c` beats `grep … | wc -l` — one process instead of two.*

### React

A React component only exists once it has been rendered, so React exercises are
graded against a live DOM instead. `src/components/ReactPreview.jsx`:

1. **Compile.** `@babel/standalone` transforms JSX **in the page**. This is the
   only reason `index.html`'s Content-Security-Policy allows `'unsafe-eval'`.
2. **Instantiate.** The compiled source becomes a function via `new Function`,
   with React and the hooks passed in as arguments — so a lesson can use
   `useState` with no import line, and the code cannot reach anything it was not
   handed.
3. **Mount.** Into a real DOM node with its own React root, wrapped in an error
   boundary so a crash shows a message rather than blanking the app.
4. **Assert.** `shared/assertions.mjs` runs declarative checks against that DOM —
   clicking real buttons, typing into real inputs.

```js
assertions: [
  { type: 'textIncludes', value: 'Count: 0' },
  { type: 'click', selector: 'button', then: 'Count: 1' },
  { type: 'click', selector: 'button', times: 2, then: 'Count: 3' },
]
```

Assertions run **in order against mutating state**, which is how a multi-step
interaction is expressed as a flat list.

Two details that are easy to get wrong:

- **`flushSync`.** React 18 renders concurrently, so `root.render()` returns
  before the DOM exists. Without `flushSync`, every assertion would run against
  an empty container and fail.
- **Typing into a controlled input.** Setting `el.value` does not trigger React's
  change tracking, because React has installed its own setter on the element. The
  assertion helper calls the *native* setter from the prototype, then dispatches a
  real `input` event — which is what React's `onChange` actually listens for.

```js
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
setter.call(el, value);
el.dispatchEvent(new Event('input', { bubbles: true }));
```

---

## State and persistence

`~/.forge/progress.json`, written atomically:

```js
fs.writeFileSync(tmp, json);   // write to a temp file
fs.renameSync(tmp, FILE);      // then rename — atomic on the same filesystem
```

If the app is killed halfway through a plain `writeFileSync` you get a truncated,
unparseable file and lose everything. A rename is atomic: the file is either
entirely the old one or entirely the new one.

A file rather than `localStorage` because it is inspectable. For a tool teaching
you the filesystem, `cat ~/.forge/progress.json` should work.

In the UI, `src/App.jsx` owns the curriculum and progress; children get what they
need as props and report back through callbacks. Data down, events up. No Redux
and no Context, because one level of prop passing does not need either — and the
React track argues exactly that.

Note `handlePass`:

```js
setProgress(p => ({ ...p, completed: { ...p.completed, [key]: new Date().toISOString() } }));
```

Mutating `progress.completed` in place would leave the object identity unchanged,
React would see nothing, and the tick would not appear. That is the trap the
state lesson warns about, in the app's own source.

---

## Build

```
src/*.jsx  ──[ Vite + @vitejs/plugin-react ]──>  dist/  ──[ Electron loads ]──> window
```

`npm start` = `vite build && electron .`. One command, one process, no dev server
in the normal path.

`base: './'` in `vite.config.mjs` is load-bearing. Electron loads the built page
over `file://`, where an absolute `/assets/index.js` resolves to the root of your
disk and 404s. It is the single most common cause of "white screen in
production".

`npm run dev` runs Vite's dev server with hot reload and points Electron at
`localhost:5173` instead, with devtools open.

The main process is CommonJS (`require`) while the renderer is ESM (`import`).
That is a real inconsistency, and the Node track's module lesson uses it as the
worked example: Electron's tooling is still most predictable with CJS in main,
Vite and the browser want ESM, and `package.json`'s `"type"` field decides which
one Node applies to a `.js` file.

---

## Testing

Three layers, because they catch different things.

| Command | What it proves |
|---|---|
| `npm test` | Every reference solution passes its own checker — really executing the shell, Python and Node, really compiling and mounting the React |
| `npm run smoke` | The packaged app opens a window, renders the curriculum, and a full exercise can be driven to a pass through the UI |
| `npm run screenshots` | The docs images match the current UI |

### `npm test` — `scripts/verify-lessons.js`

Takes each exercise's `solution` and runs it through `lessons.submit()` — the
same function the app calls. React exercises are compiled and mounted in
**jsdom** and graded with the *same* `shared/assertions.mjs` the app uses, so the
tests grade exactly what the app grades rather than a parallel reimplementation.

It earns its keep. While this app was being written it caught a genuine
off-by-one: the seeded auth log contains five `Failed password` lines, but five
exercises across three tracks had been written expecting four. Every one of those
would have been an unpassable exercise with a checker insisting on the wrong
answer — the single worst bug a learning app can have.

Exercises can declare `requires: ['ip']`. If that binary is absent the exercise
is **skipped, not failed**, so the suite is honest on a minimal container while
still grading the real thing on Kali.

### `npm run smoke` — `FORGE_SMOKE=1`

A headless test suite cannot see a white screen. This launches the real Electron
window under `xvfb` and, from inside the page:

1. waits for the curriculum to render and reports what it found;
2. calls `window.forge.submit(...)` to prove the preload bridge really reaches
   the main process and executes code;
3. drives the React track's first exercise — clicks *reveal solution*, clicks
   *load into editor*, clicks *check answer* — and asserts the verdict is a pass.

Exit code 0 or 1, so CI can gate on it.

---

## Directory map

```
electron/
  main.js              window, menu, IPC handlers, the smoke-test hook
  preload.js           contextBridge — the only door between UI and OS
  runner.js            process execution, timeouts, the sandbox workspace
  progress.js          atomic JSON persistence
  lessons/
    index.js           the contract, helpers, and submit() — read this first
    linux.js           track 1
    python.js          track 2
    node.js            track 3
    react.js           track 4
shared/
  assertions.mjs       React DOM grading, shared by the app and the tests
src/
  main.jsx             createRoot
  App.jsx              owns curriculum + progress state
  styles.css           design tokens on :root
  components/
    Editor.jsx         CodeMirror wrapper
    Exercise.jsx       one graded task, all four kinds
    ReactPreview.jsx   Babel compile -> mount -> assert
    Markdown.jsx       lesson body rendering
    Scratch.jsx        the sandbox shell panel
scripts/
  verify-lessons.js         npm test
  generate-curriculum-doc.js  npm run docs
docs/
  ARCHITECTURE.md      this file
  CURRICULUM.md        generated
  images/              generated
forge                  launcher (handles cwd + sandbox fallback)
install.sh             prerequisites, install, build, .desktop entry
```

---

## Things deliberately left out

- **A real PTY.** Discussed above.
- **A bundler for the main process.** It is a handful of CommonJS files that Node
  runs directly. Adding a build step there would buy nothing and hide the source
  from a reader — and this codebase is meant to be read.
- **electron-builder / AppImage packaging.** `install.sh` plus a `.desktop` file
  is fewer moving parts, and the intended user is someone who benefits from
  seeing `npm install` and `npm run build` happen.
- **Telemetry, accounts, sync.** Forge makes no network requests after install.
  Progress is a JSON file you can copy between machines.
- **A test framework.** `scripts/verify-lessons.js` is ~150 lines of plain Node
  with no dependencies beyond jsdom. For one very specific job, a framework would
  be more code to learn than the thing it tests.
