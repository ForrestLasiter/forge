# Contributing

Forge was built as a personal learning tool, and the most useful contribution is
a new lesson. This file explains exactly how to add one.

Start with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) if you want to know why
the app is shaped the way it is.

## Local setup

```bash
git clone <this repo>
cd forge
npm install
npm run dev      # hot-reloading, devtools open
```

Other commands:

```bash
npm start            # build and run the way a user would
npm test             # run every reference solution through the real grader
npm run smoke        # launch the real window headlessly, drive the UI, exit 0/1
npm run docs         # regenerate docs/CURRICULUM.md from the lesson files
npm run screenshots  # regenerate docs/images from the running app
```

`npm test` and `npm run smoke` both run in CI on every push.

---

## Adding a lesson

Lessons live in `electron/lessons/<track>.js`. Each track exports:

```js
module.exports = {
  id: 'python',
  title: 'Python from zero',
  blurb: 'One sentence for the tab tooltip.',
  colour: '#fbbf24',
  lessons: [ /* lesson objects, in teaching order */ ],
};
```

A lesson:

```js
{
  id: 'control-flow',              // unique within the track, used in progress keys
  title: 'Decisions and loops',
  minutes: 15,                     // honest reading estimate
  body: `markdown string`,
  exercises: [ /* exercise objects */ ],
}
```

`id` becomes part of the progress key `track/lesson/exercise`. **Renaming an id
silently resets that exercise for everyone**, so treat ids as permanent once
published.

### The body

Plain markdown, rendered by `marked`. Fenced code blocks and four-space indented
blocks both work; the lessons use indented blocks for command listings and fenced
blocks inside prompts.

Two things to watch, because the body is a JavaScript template literal:

- Escape `${` as `\${`, or JavaScript will try to interpolate it. This bites
  constantly in the bash and JavaScript tracks.
- Escape backticks as `` \` ``.

House style for lesson prose:

- **Explain why, not just what.** "Use `set -e`" is not a lesson. "Without it, a
  failed `cd` is followed by `rm -rf *` in the wrong directory" is.
- **Name the trap.** Most lessons here end up organised around the specific
  mistake everyone makes once: `sort()` comparing numbers as strings, the mutable
  default argument, `start` versus `enable`, forgetting `await`.
- **Connect back.** `2>/dev/null` is introduced in the redirection lesson and
  then *used* in the SUID hunt two lessons later, with a sentence pointing at it.
  The tracks are meant to compound.
- Plain, direct sentences. No exclamation marks, no "simply", no "just".

### Exercises

```js
{
  id: 'count-failed',
  kind: 'shell',                   // 'shell' | 'powershell' | 'python' | 'node' | 'react' | 'quiz'
  prompt: 'markdown',
  starter: '',                     // pre-filled in the editor
  solution: 'grep -c "Failed password" lab/logs/auth.log',
  hints: ['...', '...'],           // revealed one at a time, increasingly specific
  requires: ['ip'],                // optional: skip in CI if this binary is absent
  platform: 'linux',              // optional: 'linux' | 'win32' — skip off that OS
                                   //   (also settable on a lesson or a whole track)
  check: ({ code, result, h }) => ({ pass: true, message: '...' }),
}
```

`check` receives:

| | |
|---|---|
| `code` | exactly what the learner typed |
| `result` | `{ stdout, stderr, exitCode, timedOut, ms }` |
| `h.read(rel)` | read a file inside the workspace, `''` if missing |
| `h.exists(rel)` | does that path exist |
| `h.lines(text)` | non-empty trimmed lines |
| `h.norm(text)` | lowercased, whitespace-collapsed, for forgiving comparison |
| `h.uses(code, word)` | whole-word identifier test |
| `h.ws` | absolute path to the workspace, for `fs`/`stat` checks |

Return `{ pass, message }`, or a bare boolean if the default message will do.

**Checker guidelines**

- **Check the outcome, not the incantation.** Accept any command that produces
  the right result. Only require a specific tool when the tool *is* the lesson —
  and say so in the message ("this one specifically wants `reduce`").
- **Check the filesystem when the task changes it.** The permissions exercise
  passes only when `stat` reports mode `600`.
- **Write the failure message first.** It should say what was expected and what
  actually arrived. A bare "wrong" wastes the learner's afternoon.
- **Make the pass message teach something.** Not "Correct!" — the thing worth
  noticing now that it works.

### Quiz exercises

```js
{
  id: 'range-quiz',
  kind: 'quiz',
  prompt: 'How many numbers does `range(2, 10, 3)` produce?',
  choices: ['3: 2, 5, 8', '4: 2, 5, 8, 10', '8: 2 through 9', '3: 3, 6, 9'],
  answer: 0,                       // index into choices
  explain: 'Longer than the question. This is where the teaching happens.',
}
```

Distractors should be *plausible wrong beliefs*, not filler. `explain` is shown
after the answer and is expected to be substantial — `npm test` fails a quiz
whose `explain` is under 20 characters.

### React exercises

Graded against a live DOM. No `check` function; use declarative assertions:

```js
{
  kind: 'react',
  componentName: 'App',            // must match the component the learner defines
  starter: 'function App() {\n  ...\n}',
  solution: '...',
  assertions: [
    { type: 'textIncludes', value: 'Count: 0' },
    { type: 'click', selector: 'button', then: 'Count: 1' },
    { type: 'click', selector: 'button', times: 2, then: 'Count: 3' },
  ],
}
```

Available types (see `shared/assertions.mjs`):

| type | fields | meaning |
|---|---|---|
| `textIncludes` | `value` | rendered text contains it |
| `textNotIncludes` | `value` | it does not |
| `exists` | `selector` | at least one match |
| `count` | `selector`, `value` | exactly N matches |
| `attr` | `selector`, `name`, `value` | attribute equals |
| `click` | `selector`, `times?`, `then` | click, then text contains `then` |
| `type` | `selector`, `text`, `then` | type into an input, then check |
| `codeIncludes` | `value` | the source uses this (for things the DOM cannot show, like `clearInterval`) |
| `wait` | `ms` | pause, for timers |

Assertions run **in order against mutating state**, so a three-step interaction
is a flat list. `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback` and
`useReducer` are injected — lesson code needs no import line.

---

## Before you open a pull request

```bash
npm test        # must pass; every solution is executed for real
npm run smoke   # must exit 0
npm run docs    # if you added or renamed a lesson, commit the regenerated file
```

`npm test` is not a formality. A checker that is too strict, or a solution with a
typo, produces an exercise nobody can pass and a learner who assumes they are the
problem. The suite exists specifically to catch that, and it has already caught
it once.

## Reporting a bug

Include:

- what you ran and what happened
- `node -v`, `npm -v`, and your distro
- the exercise id, if it is a specific exercise
- output of `npm test` if it is a grading problem

If an exercise is unpassable, that is the highest-priority kind of bug here.
