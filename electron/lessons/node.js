/**
 * Track 3 — JavaScript and Node.
 *
 * Exercises run with `node <tempfile>`, cwd = ~/.forge/workspace.
 * The Express lesson uses Node's built-in `node:http` rather than Express itself
 * so that every exercise works with zero npm installs — the concepts are
 * identical and the body explains what Express adds on top.
 */

module.exports = {
  id: 'node',
  title: 'JavaScript & Node',
  blurb: 'The language, arrays and objects, async/await, the Node runtime, npm, and an HTTP API.',
  colour: '#a78bfa',
  lessons: [

// ---------------------------------------------------------------------------
{
  id: 'js-basics',
  title: 'JavaScript: the language itself',
  minutes: 16,
  body: `
## Where JavaScript runs

JavaScript began as the language inside a web browser. **Node** is the same
language with the browser removed and the operating system bolted on: files,
sockets, processes. So one language covers your web page, your API server, and
your command-line tools — which is most of why it is worth your time.

Run a file with \`node script.js\`. Same workflow as Python.

## Variables: const, let, and never var

    const target = "10.10.10.5";   // cannot be REASSIGNED
    let count = 0;                 // can be reassigned
    var old = "avoid";             // legacy scoping rules, do not use

Default to \`const\`. Switch to \`let\` only when you genuinely reassign. This is not
style policing — a \`const\` tells the next reader "this name never changes",
which removes a whole category of question while debugging.

\`const\` freezes the *binding*, not the contents:

    const ports = [22, 80];
    ports.push(443);     // fine — the array changed, the binding did not
    ports = [];          // TypeError — reassigning the binding

## Semicolons and blocks

Semicolons end statements; JavaScript will insert them for you, occasionally in
the wrong place, so write them. Blocks use \`{ }\` and indentation is cosmetic —
the opposite of Python, and worth naming explicitly so you do not carry the wrong
mental model between the two.

## Types

    string    "kali"  'kali'  \`kali\`
    number    22    3.14           one type for both — no separate int
    boolean   true  false          lowercase, unlike Python
    null      "deliberately nothing"
    undefined "never assigned"     <- two flavours of nothing; yes, it is awkward
    object    { ip: "10.0.0.1" }
    array     [22, 80]             (technically an object)

\`typeof x\` reports the type. Famously \`typeof null === "object"\` — a bug from
1995 that can never be fixed without breaking the web.

## == vs === : use === always

    "22" == 22     // true  — == converts types before comparing
    "22" === 22    // false — === compares type AND value
    0 == ""        // true
    null == undefined  // true

The conversion rules behind \`==\` are elaborate and nobody remembers them
correctly. Use \`===\` and \`!==\` unconditionally; the one accepted exception is
\`x == null\`, which neatly catches both null and undefined.

## Template literals

Backticks, with \`\${}\` for interpolation — the same job as Python's f-strings:

    const host = "kali";
    const port = 22;
    console.log(\`Connecting to \${host}:\${port}\`);
    console.log(\`Sum: \${port * 2}\`);
    console.log(\`multi
    line works too\`);

## Functions, three spellings

    function scan(host, port = 22) {      // declaration — hoisted
      return \`\${host}:\${port}\`;
    }

    const scan2 = function (host) { ... };            // expression

    const scan3 = (host, port = 22) => \`\${host}:\${port}\`;   // arrow

Arrow functions are the modern default for short callbacks. A single expression
body returns automatically — no \`return\` keyword. With a \`{ }\` body you must
write \`return\` yourself, and forgetting it (silently returning \`undefined\`) is a
top-three beginner bug.

    const double = n => n * 2;              // implicit return
    const double2 = n => { return n * 2; }; // explicit — both fine
    const broken = n => { n * 2; };         // returns undefined!

## Truthiness, and the operators that exploit it

Falsy values: \`false\`, \`0\`, \`""\`, \`null\`, \`undefined\`, \`NaN\`. Everything else is
truthy — note that \`[]\` and \`{}\` are truthy in JavaScript, unlike Python's empty
list.

    const name = input || "anonymous";     // fallback if input is FALSY
    const name2 = input ?? "anonymous";    // fallback only if null/undefined
    user?.profile?.email                   // optional chaining — undefined, not a crash

\`??\` matters when \`0\` or \`""\` are legitimate values: \`port || 8080\` turns a real
port \`0\` into 8080, while \`port ?? 8080\` does not. \`?.\` is how you stop writing
\`if (user && user.profile && ...)\`.
`,
  exercises: [
    {
      id: 'hello-node',
      kind: 'node',
      prompt: 'Print exactly: `forge online`',
      starter: '',
      solution: 'console.log("forge online");',
      hints: ['console.log(...)'],
      check: ({ result }) =>
        result.stdout.trim() === 'forge online'
          ? { pass: true, message: 'console.log is your print().' }
          : { pass: false, message: `Expected "forge online", got ${JSON.stringify(result.stdout.trim())}` },
    },
    {
      id: 'template-literal',
      kind: 'node',
      prompt:
        'Declare `host` as `"10.10.10.5"` and `port` as `22` using `const`, then use a template literal to log `Scanning 10.10.10.5 on port 22`.',
      starter: 'const host = ;\nconst port = ;\n',
      solution: 'const host = "10.10.10.5";\nconst port = 22;\nconsole.log(`Scanning ${host} on port ${port}`);',
      hints: ['Template literals use backticks, not quotes.', 'Interpolate with ${...}'],
      check: ({ code, result }) => {
        if (!code.includes('`')) return { pass: false, message: 'Use a template literal (backticks).' };
        return result.stdout.trim() === 'Scanning 10.10.10.5 on port 22'
          ? { pass: true, message: 'Same idea as an f-string, different punctuation.' }
          : { pass: false, message: `Expected "Scanning 10.10.10.5 on port 22", got ${JSON.stringify(result.stdout.trim())}` };
      },
    },
    {
      id: 'arrow-fn',
      kind: 'node',
      prompt:
        'Write an arrow function `banner` taking `host` and `port` (defaulting to 22) that **returns** `"<host>:<port>"`. Log `banner("10.10.10.5")` then `banner("10.10.10.5", 8080)`.',
      starter: 'const banner = ',
      solution:
        'const banner = (host, port = 22) => `${host}:${port}`;\nconsole.log(banner("10.10.10.5"));\nconsole.log(banner("10.10.10.5", 8080));',
      hints: ['const banner = (host, port = 22) => ...', 'A single-expression arrow body returns automatically.'],
      check: ({ code, result, h }) => {
        if (!/=>/.test(code)) return { pass: false, message: 'Use an arrow function (=>).' };
        const lines = h.lines(result.stdout);
        return JSON.stringify(lines) === JSON.stringify(['10.10.10.5:22', '10.10.10.5:8080'])
          ? { pass: true, message: 'Default parameters work exactly like Python\'s.' }
          : { pass: false, message: `Expected "10.10.10.5:22" then "10.10.10.5:8080". Got: ${lines.join(' | ')}` };
      },
    },
    {
      id: 'equality-quiz',
      kind: 'quiz',
      prompt: 'What does `"0" == 0` evaluate to, and `"0" === 0`?',
      choices: ['true, true', 'true, false', 'false, false', 'false, true'],
      answer: 1,
      explain:
        '`==` coerces before comparing: the string "0" becomes the number 0, so they match. `===` compares type first, and string is not number, so it is false. Because the coercion table has genuinely surprising corners (`[] == false` is true), the profession settled on: always use `===`.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'js-collections',
  title: 'Arrays, objects and the methods that matter',
  minutes: 18,
  body: `
## Arrays

    const ports = [22, 80, 443];
    ports.length
    ports[0]              // 22
    ports.at(-1)          // 443   <- the modern negative index
    ports.push(8080)      // add to end
    ports.pop()           // remove from end
    ports.includes(22)    // true
    ports.indexOf(80)     // 1, or -1 if absent
    ports.slice(0, 2)     // COPY of a portion
    ports.splice(0, 1)    // MUTATES — removes in place. Different verb, very different job.

## The big three: map, filter, reduce

These replace most loops you would otherwise write, and they are everywhere in
React, so learn them properly.

**map** — same number of items, each transformed:

    const doubled = ports.map(p => p * 2);              // [44, 160, 886]
    const labels = hosts.map(h => \`\${h.ip}:\${h.port}\`);

**filter** — fewer items, same shape:

    const open = results.filter(r => r.state === "open");
    const highPorts = ports.filter(p => p > 100);

**reduce** — many items down to one value:

    const total = counts.reduce((sum, n) => sum + n, 0);

reduce takes an accumulator and each item, and the \`0\` is the starting value.
Everybody finds it awkward at first. The one mental model that helps: "carry a
running answer through the list". Counting occurrences into an object is the
version you will actually use:

    const tally = ips.reduce((acc, ip) => {
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {});

That is the exact Python \`counts.get(ip, 0) + 1\` pattern, wearing different
clothes.

They chain, because each returns a new array:

    const names = hosts
      .filter(h => h.up)
      .map(h => h.name)
      .sort();

Other useful ones: \`find\` (first match, or undefined), \`some\` (any match?),
\`every\` (all match?), \`flatMap\`, \`join(", ")\`.

**\`sort\` has a trap**: by default it converts everything to strings.
\`[10, 9, 100].sort()\` gives \`[10, 100, 9]\`. For numbers you must pass a
comparator: \`.sort((a, b) => a - b)\`. And \`sort\` mutates the original — use
\`[...arr].sort()\` if that matters.

## Objects

    const host = { ip: "10.10.10.5", os: "linux", ports: [22, 80] };

    host.ip            // dot access
    host["ip"]         // bracket access — needed when the key is in a variable
    host.banner = "OpenSSH";
    delete host.os;
    "ip" in host
    Object.keys(host)  /  Object.values(host)  /  Object.entries(host)

    for (const [key, value] of Object.entries(host)) {
      console.log(key, value);
    }

An object with string keys is JavaScript's dict. (There is also a real \`Map\`,
which allows any key type and preserves insertion order — reach for it when your
keys are not strings.)

## Destructuring and spread — the syntax React is built on

    const { ip, os } = host;                    // pull fields into variables
    const { os: osName = "unknown" } = host;    // rename, with a default
    const [first, second] = ports;              // arrays too

    const copy = { ...host };                   // shallow copy
    const updated = { ...host, os: "windows" }; // copy with one field changed
    const merged = [...ports, 8080];            // array copy plus an item

That third line is the single most important pattern in modern JavaScript. React
state must never be mutated in place, so "make a new object that is the old one
with one thing different" is how *every* state update is written. You will use
\`{ ...old, field: newValue }\` hundreds of times.

Destructuring in a parameter list is how React components receive props:

    function HostCard({ ip, os }) { ... }
    HostCard({ ip: "10.0.0.1", os: "linux" });

## JSON

    JSON.stringify(host)              // object -> string
    JSON.stringify(host, null, 2)     // pretty printed
    JSON.parse(text)                  // string -> object

JSON is not JavaScript: no trailing commas, no comments, keys must be
double-quoted. \`JSON.parse\` on bad input throws, so wrap it in try/catch when the
input comes from anywhere you do not control.
`,
  exercises: [
    {
      id: 'map-filter',
      kind: 'node',
      prompt:
        'Given `results = [{port: 22, state: "open"}, {port: 80, state: "closed"}, {port: 443, state: "open"}]`, log an array of just the open port numbers. Expected: `[ 22, 443 ]`',
      starter:
        'const results = [{port: 22, state: "open"}, {port: 80, state: "closed"}, {port: 443, state: "open"}];\n',
      solution:
        'const results = [{port: 22, state: "open"}, {port: 80, state: "closed"}, {port: 443, state: "open"}];\nconsole.log(results.filter(r => r.state === "open").map(r => r.port));',
      hints: ['filter first to keep the open ones, then map to pull out the port.', 'They chain: .filter(...).map(...)'],
      check: ({ code, result }) => {
        if (!/\.filter\(/.test(code) || !/\.map\(/.test(code))
          return { pass: false, message: 'Use filter and map (this is the pattern React leans on constantly).' };
        const t = result.stdout.replace(/\s+/g, ' ').trim();
        return t === '[ 22, 443 ]'
          ? { pass: true, message: 'The JavaScript spelling of the list comprehension you wrote in Python.' }
          : { pass: false, message: `Expected [ 22, 443 ], got: ${t}` };
      },
    },
    {
      id: 'reduce-tally',
      kind: 'node',
      prompt:
        'Given `ips = ["a", "b", "a", "c", "a"]`, use `reduce` to build a tally object and log it. Expected: `{ a: 3, b: 1, c: 1 }`',
      starter: 'const ips = ["a", "b", "a", "c", "a"];\n',
      solution:
        'const ips = ["a", "b", "a", "c", "a"];\nconst tally = ips.reduce((acc, ip) => {\n  acc[ip] = (acc[ip] || 0) + 1;\n  return acc;\n}, {});\nconsole.log(tally);',
      hints: [
        'reduce((accumulator, item) => { ...; return accumulator; }, startingValue)',
        'The starting value is an empty object: {}',
        'Do not forget to `return acc` at the end of the callback.',
      ],
      check: ({ code, result }) => {
        if (!/\.reduce\(/.test(code)) return { pass: false, message: 'This one specifically wants reduce.' };
        const t = result.stdout.replace(/\s+/g, ' ').trim();
        return t === '{ a: 3, b: 1, c: 1 }'
          ? { pass: true, message: 'If the callback returns nothing, acc becomes undefined on the next pass — that is the classic reduce bug.' }
          : { pass: false, message: `Expected { a: 3, b: 1, c: 1 }, got: ${t}` };
      },
    },
    {
      id: 'spread-update',
      kind: 'node',
      prompt:
        'Given `const host = { ip: "10.0.0.1", os: "linux" };` create a **new** object `updated` that is the same but with `os` set to `"windows"`, without modifying `host`. Log `host.os` then `updated.os`.',
      starter: 'const host = { ip: "10.0.0.1", os: "linux" };\n',
      solution:
        'const host = { ip: "10.0.0.1", os: "linux" };\nconst updated = { ...host, os: "windows" };\nconsole.log(host.os);\nconsole.log(updated.os);',
      hints: ['The spread operator is three dots: { ...host }', 'Fields listed after the spread win.'],
      check: ({ code, result, h }) => {
        if (!/\.\.\./.test(code)) return { pass: false, message: 'Use the spread operator (...).' };
        const lines = h.lines(result.stdout);
        return JSON.stringify(lines) === JSON.stringify(['linux', 'windows'])
          ? { pass: true, message: 'Memorise this shape. Every React state update you ever write looks like it.' }
          : { pass: false, message: `Expected "linux" then "windows". Got: ${lines.join(' | ')}` };
      },
    },
    {
      id: 'sort-quiz',
      kind: 'quiz',
      prompt: 'What does `[10, 9, 100].sort()` return?',
      choices: ['[9, 10, 100]', '[10, 100, 9]', '[100, 10, 9]', 'A TypeError'],
      answer: 1,
      explain:
        'The default sort converts every element to a string and compares them lexicographically: "10" < "100" < "9". For numbers you must supply a comparator — `.sort((a, b) => a - b)` — which returns a negative number, zero, or a positive number to mean "a first", "tie", "b first". It also sorts in place, so use `[...arr].sort(...)` when you need the original intact.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'js-async',
  title: 'Asynchronous JavaScript',
  minutes: 18,
  body: `
## The problem async solves

JavaScript runs your code on a **single thread**. If it waited for a network
request the way Python's \`requests.get()\` does, nothing else could happen — in a
browser the page would freeze; in a server, every other user would wait.

So anything slow (disk, network, timers) is handed to the runtime, and your code
says what to do *when it finishes*. Your function returns immediately; the result
arrives later.

## The event loop, in one picture

    call stack        <- your code runs here, one thing at a time
       |
       | slow thing handed off
       v
    Node / browser APIs   <- the actual waiting happens out here
       |
       | finished
       v
    callback queue    <- results line up
       |
       | only when the stack is EMPTY
       v
    call stack again

Two consequences worth internalising now:

- **Nothing interrupts you.** Your function always runs to completion before any
  callback fires. No locks, no race conditions inside a single function.
- **A long synchronous loop blocks everything**, including the server answering
  other requests. In Node, CPU-heavy work is the thing to avoid, not IO.

## Promises

A Promise is an object representing a value that is not here yet. It is
*pending*, then either *fulfilled* with a value or *rejected* with an error.

    fetch("https://example.com")
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(err => console.error("failed:", err))
      .finally(() => console.log("done either way"));

Each \`.then\` receives the previous result and returns a new promise, which is why
they chain. This replaced "callback hell" — the deeply nested pyramid of callback
functions you will still see in older code.

## async / await — promises that read like ordinary code

    async function main() {
      try {
        const response = await fetch("https://example.com");
        const data = await response.json();
        console.log(data);
      } catch (err) {
        console.error("failed:", err);
      }
    }

    main();

- \`async\` before a function means it always returns a Promise.
- \`await\` pauses **that function** until the promise settles — the rest of the
  program keeps running.
- \`await\` is only legal inside an \`async\` function (or at the top level of an ES
  module).
- Errors become ordinary exceptions, so \`try/catch\` works normally.

This is what you should write. \`.then\` chains are worth reading fluently, but
\`async/await\` is clearer for anything with more than two steps.

## The mistake everyone makes once

    const data = fetchData();          // WRONG — this is a Promise, not the data
    console.log(data);                 // Promise { <pending> }

    const data = await fetchData();    // right

If you ever log \`Promise { <pending> }\`, you forgot an \`await\`. That symptom has
exactly one cause.

## Doing things at the same time

    // Sequential: 3 seconds total. Each await waits for the one before.
    const a = await slow();
    const b = await slow();
    const c = await slow();

    // Concurrent: 1 second total. All three start, then we wait for all.
    const [a, b, c] = await Promise.all([slow(), slow(), slow()]);

\`Promise.all\` rejects as soon as any one fails. \`Promise.allSettled\` waits for
all and reports each outcome — the right choice when scanning 254 hosts and some
will time out.

## setTimeout, and turning a callback into a promise

    setTimeout(() => console.log("1 second later"), 1000);

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    await sleep(1000);      // now it reads like Python's time.sleep

That \`sleep\` one-liner is worth keeping. It is also a clean illustration of what a
Promise constructor does: you get a \`resolve\` function, and calling it fulfils the
promise.
`,
  exercises: [
    {
      id: 'await-basic',
      kind: 'node',
      prompt:
        'Write a `sleep(ms)` helper that returns a Promise, then in an async `main()` log `start`, await a 50ms sleep, and log `end`. Call `main()`.',
      starter: 'const sleep = ms => ',
      solution:
        'const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));\n\nasync function main() {\n  console.log("start");\n  await sleep(50);\n  console.log("end");\n}\n\nmain();',
      hints: [
        'new Promise(resolve => setTimeout(resolve, ms))',
        'The function containing await must be declared async.',
      ],
      check: ({ code, result, h }) => {
        if (!/await/.test(code)) return { pass: false, message: 'Use await.' };
        const lines = h.lines(result.stdout);
        return JSON.stringify(lines) === JSON.stringify(['start', 'end'])
          ? { pass: true, message: 'Note the program did not exit between them — Node stayed alive for the pending timer.' }
          : { pass: false, message: `Expected "start" then "end". Got: ${lines.join(' | ')}` };
      },
    },
    {
      id: 'promise-all',
      kind: 'node',
      prompt:
        'Write `async function check(port)` that awaits a 30ms sleep and returns `` `port ${port} checked` ``. Use `Promise.all` to run it for ports 22, 80 and 443 **concurrently**, then log the resulting array.',
      starter: 'const sleep = ms => new Promise(r => setTimeout(r, ms));\n\n',
      solution:
        'const sleep = ms => new Promise(r => setTimeout(r, ms));\n\nasync function check(port) {\n  await sleep(30);\n  return `port ${port} checked`;\n}\n\nasync function main() {\n  const results = await Promise.all([check(22), check(80), check(443)]);\n  console.log(results);\n}\n\nmain();',
      hints: [
        'Call all three first so they start together, then await Promise.all([...]).',
        'Promise.all resolves to an array of results in the same order.',
      ],
      check: ({ code, result }) => {
        if (!/Promise\.all/.test(code)) return { pass: false, message: 'Use Promise.all.' };
        const t = result.stdout.replace(/\s+/g, ' ').trim();
        const ok = t.includes('port 22 checked') && t.includes('port 80 checked') && t.includes('port 443 checked');
        return ok
          ? { pass: true, message: 'That finished in ~30ms, not 90ms. Scale it to 254 hosts and the difference is the whole scan.' }
          : { pass: false, message: `Expected an array of all three results. Got: ${t}` };
      },
    },
    {
      id: 'pending-quiz',
      kind: 'quiz',
      prompt: 'Your code logs `Promise { <pending> }` instead of the data. What happened?',
      choices: [
        'The network request failed',
        'You forgot to `await` the async call (or to `.then` it)',
        'The function was not declared async',
        'JSON.parse was needed',
      ],
      answer: 1,
      explain:
        'An async function returns a Promise immediately, before its work is done. Logging that Promise shows you the wrapper, not the value inside. `await` unwraps it — and `await` is only legal inside an async function, so the fix is often both: mark the caller async, then await the call.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'node-runtime',
  title: 'The Node runtime: files, paths and processes',
  minutes: 16,
  body: `
## Two module systems, and which to use

**CommonJS** — the original Node system, what this app's Electron code uses:

    const fs = require("fs");
    module.exports = { myFunction };

**ES Modules** — the standard, what the browser and your React code use:

    import fs from "node:fs";
    export { myFunction };

Node decides which one a \`.js\` file is by looking at \`"type"\` in the nearest
package.json: \`"type": "module"\` means ESM, absent or \`"commonjs"\` means CJS. You
can also force it per file with the \`.mjs\` and \`.cjs\` extensions.

Mixing them is the source of the error you will meet sooner or later: *"Cannot use
import statement outside a module"*. It means Node parsed the file as CommonJS and
found ESM syntax. The fix is to make the file's type explicit, not to rewrite the
syntax.

New code should use ESM. This app's main process is CommonJS because Electron's
tooling is still most predictable that way — a real trade-off you will meet in
real projects.

## Files

    const fs = require("node:fs");
    const fsp = require("node:fs/promises");

    const text = fs.readFileSync("lab/logs/auth.log", "utf8");   // blocking
    const text2 = await fsp.readFile("lab/logs/auth.log", "utf8"); // async

    fs.writeFileSync("out.txt", "hello\\n");
    fs.appendFileSync("out.txt", "more\\n");
    fs.existsSync("out.txt");
    fs.mkdirSync("a/b", { recursive: true });      // like mkdir -p
    fs.readdirSync("lab");                          // like ls

Note the \`"utf8"\`: without it you get a raw Buffer of bytes, not a string. That
surprises everyone once.

**Sync vs async**: the \`Sync\` versions block the single thread. In a script that
does one thing, they are simpler and completely fine. In a server handling many
requests, they are a serious bug — one slow read freezes every other user. Use
\`node:fs/promises\` with \`await\` in anything long-lived.

The \`node:\` prefix explicitly means "the built-in module", so nobody can shadow it
with an npm package named \`fs\`. Use it.

## Paths

    const path = require("node:path");

    path.join("lab", "logs", "auth.log")     // "lab/logs/auth.log"
    path.resolve("lab")                       // absolute path
    path.basename("/a/b/c.txt")               // "c.txt"
    path.extname("c.txt")                     // ".txt"
    path.dirname("/a/b/c.txt")                // "/a/b"

    __dirname    // directory of THIS file (CommonJS only)
    process.cwd()// where the process was STARTED — usually different!

\`__dirname\` vs \`process.cwd()\` is the Node version of the absolute/relative lesson
from the Linux track. A path relative to \`process.cwd()\` breaks the moment someone
runs your tool from another directory. Anchor on \`__dirname\` for files that ship
with your code.

## The process

    process.argv          // ["node", "/path/script.js", "arg1", ...]
    process.argv.slice(2) // just YOUR arguments
    process.env.HOME      // environment variables
    process.exit(1)       // non-zero = failure, exactly like bash
    process.stdout.write("no newline");
    console.error("goes to stderr");

\`console.log\` writes to stdout and \`console.error\` to stderr — the same two
channels you learned to redirect in the Linux track. Progress messages belong on
stderr so they do not pollute output somebody is piping into a file.

## Running other programs

    const { execSync } = require("node:child_process");
    const out = execSync("ip -br a", { encoding: "utf8" });

    const { spawn } = require("node:child_process");
    const child = spawn("ping", ["-c", "3", "10.0.0.1"]);
    child.stdout.on("data", chunk => process.stdout.write(chunk));

\`spawn\` streams output as it arrives and takes arguments as an array (no shell
parsing, so no injection). \`execSync\` buffers everything and is simpler when you
just want the result of a short command. This is exactly what Forge's own
\`runner.js\` does to execute your code — go read it.
`,
  exercises: [
    {
      id: 'read-file-node',
      kind: 'node',
      prompt:
        'Read `lab/logs/auth.log` and log how many lines contain `Failed password`. (Expected: `5`)',
      starter: 'const fs = require("node:fs");\n',
      solution:
        'const fs = require("node:fs");\nconst text = fs.readFileSync("lab/logs/auth.log", "utf8");\nconst n = text.split("\\n").filter(l => l.includes("Failed password")).length;\nconsole.log(n);',
      hints: [
        'readFileSync(path, "utf8") gives you a string.',
        'split("\\n") turns it into lines, then filter and take .length',
      ],
      check: ({ result }) =>
        result.stdout.trim() === '5'
          ? { pass: true, message: 'Third language, same answer. The concepts transfer; only the punctuation changes.' }
          : { pass: false, message: `Expected 5, got: ${result.stdout.trim()}. Did you pass "utf8" to readFileSync?` },
    },
    {
      id: 'path-join',
      kind: 'node',
      prompt:
        'Use the `path` module to build the path `lab/logs/auth.log` from its three parts and log it. Then log just the file extension of that path.',
      starter: 'const path = require("node:path");\n',
      solution:
        'const path = require("node:path");\nconst p = path.join("lab", "logs", "auth.log");\nconsole.log(p);\nconsole.log(path.extname(p));',
      hints: ['path.join(...parts)', 'path.extname(p)'],
      check: ({ code, result, h }) => {
        if (!/path\.join/.test(code)) return { pass: false, message: 'Use path.join rather than building the string by hand.' };
        const lines = h.lines(result.stdout);
        return JSON.stringify(lines) === JSON.stringify(['lab/logs/auth.log', '.log'])
          ? { pass: true, message: 'path.join is how you avoid the separator bugs that bite cross-platform code.' }
          : { pass: false, message: `Expected "lab/logs/auth.log" then ".log". Got: ${lines.join(' | ')}` };
      },
    },
    {
      id: 'sync-quiz',
      kind: 'quiz',
      prompt: 'Why is `fs.readFileSync` fine in a one-off script but a bug inside a web server?',
      choices: [
        'Sync functions cannot read large files',
        'Node runs your code on one thread, so a blocking read freezes every other request until it finishes',
        'Sync functions cannot handle UTF-8',
        'It is not a bug, just slower',
      ],
      answer: 1,
      explain:
        'A script has one job and nobody is waiting, so blocking costs nothing. A server is handling many requests on that single thread — every millisecond spent blocked in a sync read is a millisecond no other request can be served. Use node:fs/promises with await in anything long-lived.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'npm',
  title: 'npm, package.json and dependencies',
  minutes: 14,
  body: `
## package.json is the project

    npm init -y           create package.json with defaults

    {
      "name": "my-tool",
      "version": "1.0.0",
      "type": "module",
      "main": "index.js",
      "scripts": {
        "start": "node index.js",
        "dev": "node --watch index.js",
        "test": "node --test"
      },
      "dependencies": {},
      "devDependencies": {}
    }

\`npm run dev\` runs whatever that script says. It is the project's front door: a
new person clones your repo and can run it without being told the incantation.
(\`start\` and \`test\` are special and work without the word \`run\`.)

## Installing

    npm install express          add a runtime dependency
    npm install -D vite          add a DEV dependency (build tools, test runners)
    npm install                  install everything package.json lists
    npm uninstall express
    npm outdated                 what has newer versions
    npm update

**dependencies vs devDependencies**: things your code needs at runtime go in the
first; things only needed to build or test go in the second. A production deploy
installs only \`dependencies\`, so getting this wrong either ships megabytes of
build tooling or breaks the build.

## node_modules and the lockfile

\`node_modules/\` is where the actual code lands. It is enormous, it is generated,
and it is never committed — that is what \`.gitignore\` is for.

\`package-lock.json\` **is** committed. Here is why both exist:

- \`package.json\` says \`"express": "^4.18.0"\` — a *range*.
- \`package-lock.json\` records \`4.18.2\` — the *exact* version, and the exact
  version of every dependency of every dependency.

Without the lock, two people running \`npm install\` a month apart get different
code and "works on my machine" becomes real. \`npm ci\` installs strictly from the
lockfile and is what CI pipelines should use.

## Semantic versioning

    MAJOR.MINOR.PATCH        e.g. 4.18.2

    PATCH   bug fix, nothing else changed
    MINOR   new feature, existing code still works
    MAJOR   breaking change — something you used is gone or different

    "^4.18.0"   accept 4.x.x  (minor and patch updates)   <- npm's default
    "~4.18.0"   accept 4.18.x (patch only)
    "4.18.2"    exactly this

\`^\` trusts publishers to follow the rules. Mostly they do.

## Supply chain: the part that concerns you professionally

Installing a package runs its code on your machine, and that package has its own
dependencies you never chose. This is a real attack surface, and typosquatted
package names are an active technique.

    npm audit                 known vulnerabilities in your tree
    npm audit fix
    npm ls <package>          why is this thing even installed?
    npm install --ignore-scripts     skip lifecycle scripts you do not trust

Before adding a dependency worth a second look: when was it last published, how
many maintainers, how many dependencies of its own, and could you write the
fifteen lines yourself instead. "Left-pad" is the famous cautionary tale.

## npx

    npx create-vite my-app

\`npx\` downloads and runs a package without installing it permanently — how most
project scaffolding tools are meant to be used.
`,
  exercises: [
    {
      id: 'semver-quiz',
      kind: 'quiz',
      prompt: 'Your package.json says `"express": "^4.18.0"`. Which versions will npm install?',
      choices: [
        'Only exactly 4.18.0',
        'Any 4.x.x at or above 4.18.0, but not 5.0.0',
        'Any version at or above 4.18.0 including 5.x',
        'Only 4.18.x patches',
      ],
      answer: 1,
      explain:
        'The caret allows anything that does not change the leftmost non-zero number — so minor and patch updates within major version 4, but never 5.0.0, because a major bump is where breaking changes are allowed to live. `~4.18.0` would restrict you to patch updates only.',
    },
    {
      id: 'lockfile-quiz',
      kind: 'quiz',
      prompt: 'Why commit `package-lock.json` but not `node_modules/`?',
      choices: [
        'node_modules is encrypted',
        'The lockfile is a small, exact recipe that reproduces the install; node_modules is the large generated result',
        'The lockfile is required by git',
        'node_modules changes too rarely to be worth tracking',
      ],
      answer: 1,
      explain:
        'package.json records version *ranges*, so an install today and an install next month can differ. The lockfile pins every exact version in the whole tree, making installs reproducible. node_modules is what you get by following that recipe — hundreds of megabytes of generated files, regenerable at any time, and pure noise in a diff.',
    },
    {
      id: 'scripts-quiz',
      kind: 'quiz',
      prompt: 'What is the practical value of the `scripts` section?',
      choices: [
        'It makes the code run faster',
        'It gives the project named entry points, so anyone can run `npm run dev` without knowing the underlying command',
        'It is required before npm install works',
        'It replaces the need for a lockfile',
      ],
      answer: 1,
      explain:
        'Scripts are documentation that executes. Instead of a README saying "run vite build && electron .", the project exposes `npm start`. They also run with node_modules/.bin on PATH, so locally-installed tools are callable by bare name without a global install — which is why projects can pin their own tool versions.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'http-api',
  title: 'Building an HTTP API',
  minutes: 20,
  body: `
## What a web server actually is

A program that listens on a TCP port, reads a request, and writes a response. The
whole of HTTP is text over a socket. Everything else — routing, JSON bodies,
middleware — is convenience built on top of those four steps.

## A server with zero dependencies

    const http = require("node:http");

    const server = http.createServer((req, res) => {
      // req  = what they asked for   (req.url, req.method, req.headers)
      // res  = what you send back
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    });

    server.listen(3000, () => console.log("listening on 3000"));

The callback runs **once per request**. \`res.end()\` is what actually sends it — a
handler that never calls \`end\` leaves the client hanging until it times out, which
is the most common "my API is broken" cause.

## Routing by hand

    const server = http.createServer((req, res) => {
      if (req.method === "GET" && req.url === "/health") {
        return json(res, 200, { ok: true });
      }
      if (req.method === "GET" && req.url.startsWith("/hosts")) {
        return json(res, 200, hosts);
      }
      json(res, 404, { error: "not found" });
    });

    function json(res, status, body) {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    }

You can feel the problem: a dozen routes and this becomes unreadable. That is the
gap Express fills.

## The same thing in Express

    const express = require("express");
    const app = express();

    app.use(express.json());                 // parse JSON request bodies

    app.get("/health", (req, res) => res.json({ ok: true }));

    app.get("/hosts/:id", (req, res) => {
      res.json({ id: req.params.id });       // :id becomes req.params.id
    });

    app.post("/hosts", (req, res) => {
      const { ip } = req.body;               // thanks to express.json()
      if (!ip) return res.status(400).json({ error: "ip required" });
      res.status(201).json({ ip });
    });

    app.listen(3000);

\`npm install express\` and it is yours. Express is a thin layer — routing, params,
body parsing, middleware — over exactly the \`http\` module above. Knowing what is
underneath is why you will debug it faster than people who only ever learned
Express.

## Status codes that matter

    200 OK                  it worked
    201 Created             it worked and made something
    204 No Content          it worked, nothing to return
    400 Bad Request         the CLIENT sent something invalid
    401 Unauthorized        you are not authenticated
    403 Forbidden           authenticated, but not allowed
    404 Not Found
    429 Too Many Requests   rate limited
    500 Internal Server Error   YOUR code broke

4xx means the caller's fault, 5xx means yours. Returning 200 with
\`{"error": "..."}\` in the body is a real and common mistake: every client,
proxy, and monitoring tool reads the status code, not your body.

401 vs 403 is worth knowing precisely: 401 means "I do not know who you are",
403 means "I know exactly who you are and the answer is still no".

## Middleware

    app.use((req, res, next) => {
      console.error(\`\${req.method} \${req.url}\`);
      next();                       // pass control on — forgetting this HANGS the request
    });

Middleware runs in order, in front of your routes: logging, authentication, rate
limiting, CORS. Each one either responds or calls \`next()\`.

## Security, since this is where it bites

- **Never build SQL by concatenating user input** — parameterised queries only.
- **Validate every input.** \`req.body\` is whatever the caller chose to send.
- **Do not echo raw user input into HTML** — that is stored XSS.
- **Secrets live in environment variables**, never in the repo.
- **Rate limit anything that authenticates**, or your own \`auth.log\` starts
  looking like the one you have been grepping all week.

You are learning both sides of this at once, which is an advantage: the defensive
habits make sense when you have seen the offensive version.
`,
  exercises: [
    {
      id: 'http-server',
      kind: 'node',
      prompt:
        'Create an `http` server that responds to any request with JSON `{"status":"ok"}` and status 200. Listen on port 0 (the OS picks a free one), make a request to your own server, log the response body, then close the server. Expected output: `{"status":"ok"}`',
      starter: `const http = require("node:http");

const server = http.createServer((req, res) => {
  // respond here
});

server.listen(0, () => {
  const port = server.address().port;
  http.get(\`http://127.0.0.1:\${port}/\`, (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      console.log(body);
      server.close();
    });
  });
});
`,
      solution: `const http = require("node:http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok" }));
});

server.listen(0, () => {
  const port = server.address().port;
  http.get(\`http://127.0.0.1:\${port}/\`, (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      console.log(body);
      server.close();
    });
  });
});
`,
      hints: [
        'res.writeHead(200, { "Content-Type": "application/json" })',
        'res.end(JSON.stringify({ status: "ok" })) — end() is what actually sends it.',
      ],
      check: ({ result }) =>
        result.stdout.trim() === '{"status":"ok"}'
          ? { pass: true, message: 'You just wrote a web server with no dependencies. Express is a convenience layer on exactly this.' }
          : { pass: false, message: `Expected {"status":"ok"} — got: ${result.stdout.trim() || result.stderr.slice(0, 200)}` },
    },
    {
      id: 'routing',
      kind: 'node',
      prompt:
        'Extend it: respond to `/health` with 200 and `{"ok":true}`, and to anything else with 404 and `{"error":"not found"}`. Make two requests — one to `/health`, one to `/nope` — and log `<status> <body>` for each, health first.',
      starter: `const http = require("node:http");

const server = http.createServer((req, res) => {
  // route on req.url
});

function get(port, path) {
  return new Promise((resolve) => {
    http.get(\`http://127.0.0.1:\${port}\${path}\`, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve(\`\${res.statusCode} \${body}\`));
    });
  });
}

server.listen(0, async () => {
  const port = server.address().port;
  console.log(await get(port, "/health"));
  console.log(await get(port, "/nope"));
  server.close();
});
`,
      solution: `const http = require("node:http");

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") return json(res, 200, { ok: true });
  json(res, 404, { error: "not found" });
});

function get(port, path) {
  return new Promise((resolve) => {
    http.get(\`http://127.0.0.1:\${port}\${path}\`, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve(\`\${res.statusCode} \${body}\`));
    });
  });
}

server.listen(0, async () => {
  const port = server.address().port;
  console.log(await get(port, "/health"));
  console.log(await get(port, "/nope"));
  server.close();
});
`,
      hints: [
        'Check req.url === "/health" first and return early.',
        'A small json(res, status, body) helper keeps the handler readable.',
      ],
      check: ({ result, h }) => {
        const lines = h.lines(result.stdout);
        const want = ['200 {"ok":true}', '404 {"error":"not found"}'];
        if (lines.length !== 2) return { pass: false, message: `Expected 2 lines, got ${lines.length}. ${result.stderr.slice(0, 150)}` };
        const bad = want.findIndex((w, i) => lines[i] !== w);
        return bad === -1
          ? { pass: true, message: 'Right status codes for the right reasons — a 404 in the status line, not hidden in a 200 body.' }
          : { pass: false, message: `Line ${bad + 1} should be ${want[bad]}, got ${lines[bad]}` };
      },
    },
    {
      id: 'status-quiz',
      kind: 'quiz',
      prompt: 'A caller sends a valid token but asks for someone else\'s record. Which status?',
      choices: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
      answer: 2,
      explain:
        '401 means "I do not know who you are" — no credentials, or invalid ones. 403 means "I know who you are, and you are not allowed this". Here authentication succeeded and authorisation failed, so it is 403. (Some APIs deliberately return 404 instead, to avoid confirming that the record exists at all — a reasonable choice when the existence of the resource is itself sensitive.)',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'node-cli',
  title: 'Project: the same triage tool in Node',
  minutes: 20,
  body: `
## Why rebuild something you already built

You wrote this tool in Python two tracks ago. Writing it again in Node is the
fastest way to see which parts of that first version were *Python* and which parts
were *programming*. The structure survives; only the punctuation changes.

That transfer is the whole point of learning a second language, and it is why the
third one takes a weekend instead of a month.

## The brief, again

Read \`lab/logs/auth.log\`, find failed SSH logins, rank the sources:

    [!] 10.10.10.99  4 failed
    [!] 10.10.10.42  1 failed
    2 unique sources, 5 total failures

## The Node shape

    const fs = require("node:fs");

    function parseFailures(path) {
      return fs.readFileSync(path, "utf8")
        .split("\\n")
        .filter(line => line.includes("Failed password"))
        .map(line => {
          const parts = line.split(/\\s+/);
          return parts[parts.indexOf("from") + 1];
        });
    }

    function rank(ips) {
      const tally = ips.reduce((acc, ip) => {
        acc[ip] = (acc[ip] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(tally).sort((a, b) => b[1] - a[1]);
    }

Compare that to the Python. \`filter\` + \`map\` is the list comprehension.
\`reduce\` into an object is \`Counter\`. \`Object.entries\` plus a comparator is
\`.most_common()\`. Different names, identical ideas.

The sort comparator \`(a, b) => b[1] - a[1]\` deserves a look: each entry is
\`[ip, count]\`, so \`[1]\` is the count, and subtracting in that order sorts
descending. Getting a sort backwards is a universal experience; when it happens,
swap \`a\` and \`b\`.

## Then take it further, on your own machine

- \`process.argv.slice(2)\` for the log path, defaulting to the lab file.
- A \`--json\` flag that prints \`JSON.stringify(results, null, 2)\`.
- Add \`"bin": { "triage": "./index.js" }\` to package.json, put
  \`#!/usr/bin/env node\` on line one (the same shebang rule from bash), run
  \`npm link\`, and now \`triage\` is a command on your PATH.

That last step is how every CLI tool you have ever installed from npm works.
`,
  exercises: [
    {
      id: 'node-triage',
      kind: 'node',
      prompt:
        'Build the tool against `lab/logs/auth.log`. Print one `[!] <ip>  <n> failed` line per source, highest first (two spaces before the count), then `2 unique sources, 5 total failures`.',
      starter: `const fs = require("node:fs");

function parseFailures(path) {
  // read, keep "Failed password" lines, pull the word after "from"
  return [];
}

function rank(ips) {
  // tally into an object, then Object.entries(...).sort(...)
  return [];
}

function main() {
  const ips = parseFailures("lab/logs/auth.log");
  const ranked = rank(ips);
  // print each line, then the summary
}

main();
`,
      solution: `const fs = require("node:fs");

function parseFailures(path) {
  return fs
    .readFileSync(path, "utf8")
    .split("\\n")
    .filter((line) => line.includes("Failed password"))
    .map((line) => {
      const parts = line.trim().split(/\\s+/);
      return parts[parts.indexOf("from") + 1];
    });
}

function rank(ips) {
  const tally = ips.reduce((acc, ip) => {
    acc[ip] = (acc[ip] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(tally).sort((a, b) => b[1] - a[1]);
}

function main() {
  const ips = parseFailures("lab/logs/auth.log");
  const ranked = rank(ips);
  for (const [ip, count] of ranked) {
    console.log(\`[!] \${ip}  \${count} failed\`);
  }
  console.log(\`\${ranked.length} unique sources, \${ips.length} total failures\`);
}

main();
`,
      hints: [
        'readFileSync(path, "utf8").split("\\n") then .filter(...) then .map(...)',
        'split(/\\s+/) splits on any run of whitespace; indexOf("from") + 1 is the IP.',
        'Object.entries(tally) gives [key, value] pairs; sort with (a, b) => b[1] - a[1] for descending.',
      ],
      check: ({ code, result, h }) => {
        if (!/function\s+parseFailures/.test(code) || !/function\s+rank/.test(code))
          return { pass: false, message: 'Keep parseFailures() and rank() as separate functions — mirroring the Python version is the point.' };
        const lines = h.lines(result.stdout);
        const want = ['[!] 10.10.10.99  4 failed', '[!] 10.10.10.42  1 failed', '2 unique sources, 5 total failures'];
        if (lines.length !== 3) return { pass: false, message: `Expected 3 lines, got ${lines.length}. ${result.stderr.slice(0, 150)}` };
        const bad = want.findIndex((w, i) => lines[i] !== w);
        return bad === -1
          ? { pass: true, message: 'Same tool, same structure, second language. That is what fluency is made of.' }
          : { pass: false, message: `Line ${bad + 1} should be "${want[bad]}" — got "${lines[bad]}"` };
      },
    },
  ],
},

  ],
};
