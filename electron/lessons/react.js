/**
 * Track 4 — React.
 *
 * These exercises are graded differently from the others. There is no `check`
 * function here, because a React component only exists once it has been rendered
 * into a DOM. So the renderer (src/components/ReactPreview.jsx) compiles your
 * JSX with Babel, mounts it, then evaluates the declarative `assertions` below
 * against the real DOM — including clicking buttons and typing into inputs.
 *
 * Assertion types:
 *   { type: 'textIncludes',    value }                  rendered text contains value
 *   { type: 'textNotIncludes', value }
 *   { type: 'exists',          selector }
 *   { type: 'count',           selector, value }        exactly N matching elements
 *   { type: 'attr',            selector, name, value }
 *   { type: 'click',           selector, times?, then } click, then text contains `then`
 *   { type: 'type',            selector, text, then }   type into an input, then check text
 *
 * Every component must be named exactly as `componentName` says.
 */

module.exports = {
  id: 'react',
  title: 'React',
  blurb: 'Components, props, state, effects, forms and a findings dashboard you build yourself.',
  colour: '#38bdf8',
  lessons: [

// ---------------------------------------------------------------------------
{
  id: 'react-why',
  title: 'What React is for, and JSX',
  minutes: 15,
  body: `
## The problem

Without a framework, keeping a page in sync with your data means writing the
update by hand for every change:

    document.getElementById("count").textContent = count;
    document.getElementById("status").className = count > 5 ? "warn" : "ok";

With twenty pieces of state and forty elements, you are maintaining a web of
"when X changes, also update Y and Z" — and the bugs are always the pair you
forgot.

React inverts it. You write a function that says **what the page should look like
for the current data**, and React works out the minimum set of DOM changes needed
to get there. You stop describing transitions and start describing states.

    function Counter({ count }) {
      return <p className={count > 5 ? "warn" : "ok"}>Count: {count}</p>;
    }

## Components are functions that return markup

    function Banner() {
      return <h1>Forge</h1>;
    }

- The name **must start with a capital letter**. Lowercase means "HTML tag" to
  JSX, so \`<banner />\` looks for an unknown HTML element and silently renders
  nothing. This is the single most common first-hour bug.
- It returns one element. Wrap siblings in a \`<div>\` or in an empty
  **fragment** \`<>...</>\` when you do not want an extra div in the DOM.
- Use it as \`<Banner />\`.

## JSX is not HTML

JSX is syntax that compiles to function calls. \`<h1>Forge</h1>\` becomes
\`React.createElement("h1", null, "Forge")\`. Because it compiles to JavaScript,
its rules come from JavaScript:

    className     not class     (class is a reserved word)
    htmlFor       not for
    onClick       not onclick   (camelCase, and it takes a function, not a string)
    style={{ color: "red" }}    an object, not a CSS string
    {/* comment */}             comments go inside braces
    <img />                     every tag must close

## Curly braces are a window into JavaScript

Inside JSX, \`{ }\` means "evaluate this expression and put the result here".

    function Host() {
      const ip = "10.10.10.5";
      const ports = [22, 80];
      return (
        <div>
          <h2>{ip}</h2>
          <p>{ports.length} open ports</p>
          <p>{ports.length > 1 ? "multiple" : "one"}</p>
        </div>
      );
    }

**Expressions only, not statements.** \`{if (x) ...}\` is a syntax error. Use the
ternary \`cond ? a : b\`, or \`cond && <thing />\` for "render this only if".

One trap with \`&&\`: if the left side is the number \`0\`, React renders "0" rather
than nothing. \`{items.length && <List />}\` prints a stray 0 on an empty list.
Write \`{items.length > 0 && <List />}\`.

Returning \`null\` from a component renders nothing at all, which is the clean way
to say "not now".
`,
  exercises: [
    {
      id: 'first-component',
      kind: 'react',
      componentName: 'App',
      prompt: 'Write a component `App` that renders an `<h1>` containing the text `Forge`.',
      starter: 'function App() {\n  return ;\n}',
      solution: 'function App() {\n  return <h1>Forge</h1>;\n}',
      hints: ['return <h1>Forge</h1>;', 'The component name must be capitalised.'],
      assertions: [
        { type: 'exists', selector: 'h1' },
        { type: 'textIncludes', value: 'Forge' },
      ],
    },
    {
      id: 'jsx-expressions',
      kind: 'react',
      componentName: 'App',
      prompt:
        'In `App`, declare `const ip = "10.10.10.5"` and `const ports = [22, 80, 443]`. Render an `<h2>` with the ip, and a `<p>` reading `3 open ports` — using the array\'s length, not a hard-coded 3.',
      starter: 'function App() {\n  const ip = "10.10.10.5";\n  const ports = [22, 80, 443];\n  return (\n    <div>\n      \n    </div>\n  );\n}',
      solution:
        'function App() {\n  const ip = "10.10.10.5";\n  const ports = [22, 80, 443];\n  return (\n    <div>\n      <h2>{ip}</h2>\n      <p>{ports.length} open ports</p>\n    </div>\n  );\n}',
      hints: ['Curly braces drop a JavaScript expression into the markup: {ip}', '{ports.length} open ports'],
      assertions: [
        { type: 'exists', selector: 'h2' },
        { type: 'textIncludes', value: '10.10.10.5' },
        { type: 'textIncludes', value: '3 open ports' },
      ],
    },
    {
      id: 'capital-quiz',
      kind: 'quiz',
      prompt: 'You wrote `<banner />` and nothing appears, with no error. Why?',
      choices: [
        'The component needs to be exported',
        'JSX treats a lowercase tag as a plain HTML element, so it looked for an unknown <banner> tag instead of your component',
        'Components cannot be used more than once',
        'You need to import React explicitly',
      ],
      answer: 1,
      explain:
        'JSX decides by the first letter: lowercase compiles to the string "banner" (an HTML tag name), capitalised compiles to a reference to your variable. An unknown HTML tag renders as an empty inline element, so you get silence rather than an error. Capitalise every component name — always.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'props',
  title: 'Props, composition and lists',
  minutes: 16,
  body: `
## Props are the arguments

A component is a function; props are what you pass it. They arrive as one object,
and you almost always destructure them in the parameter list:

    function HostCard({ ip, os, open = 0 }) {
      return (
        <div className="card">
          <h3>{ip}</h3>
          <p>{os} — {open} open</p>
        </div>
      );
    }

    <HostCard ip="10.10.10.5" os="linux" open={2} />

Strings pass as \`prop="text"\`. Anything else — numbers, booleans, arrays,
objects, functions — goes in braces: \`open={2}\`, \`active={true}\`,
\`onSelect={handleSelect}\`. A bare \`active\` with no value means \`true\`.

**Props are read-only.** A component must never modify the props it received.
Data flows one way: down from parent to child. When a child needs to change
something, the parent passes down a *function* the child can call — you will do
exactly this in the state lesson.

## children

Anything between the tags arrives as the \`children\` prop:

    function Panel({ title, children }) {
      return (
        <section>
          <h2>{title}</h2>
          {children}
        </section>
      );
    }

    <Panel title="Findings">
      <p>Nothing yet.</p>
    </Panel>

That is **composition**, and it is how React apps stay flexible without
inheritance. \`Panel\` knows nothing about what it wraps.

## Rendering a list

There is no loop syntax in JSX. You produce an array of elements with \`.map\` —
the same \`.map\` from the JavaScript track:

    function HostList({ hosts }) {
      return (
        <ul>
          {hosts.map(host => (
            <li key={host.ip}>{host.ip}</li>
          ))}
        </ul>
      );
    }

## key, and why React nags about it

\`key\` must be a **stable, unique identifier** for each item. React uses it to
match elements between renders: when the list changes, the key tells React
"this is the same item that moved" versus "this is a new item".

Without keys, React falls back to position. Delete the first row of a list and
every row shifts up one — React then thinks each row's *content changed*, so any
state inside those rows (a focused input, a checked box, a half-typed value)
attaches to the wrong item.

**Do not use the array index as a key** in any list that can reorder, filter or
have items removed — it is exactly the positional matching that causes the bug.
Use a real id: an IP, a database id, a generated uuid.

## Conditional rendering

    {host.up && <span className="badge">UP</span>}
    {host.up ? <Online /> : <Offline />}
    {hosts.length === 0 && <p>No hosts yet.</p>}

## Splitting components

Split when a piece has its own name and its own reason to change, or when you
need it twice. Do not split just because a function is getting long — three tiny
components that are only ever used together are harder to read than one clear
one. "Would I describe this to a colleague as a thing?" is a decent test.
`,
  exercises: [
    {
      id: 'props-basic',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Write a `HostCard({ ip, os })` component rendering `<h3>{ip}</h3>` and `<p>{os}</p>`. Then write `App` that renders two of them: `10.10.10.5`/`linux` and `10.10.10.99`/`windows`.',
      starter: 'function HostCard({ ip, os }) {\n  return null;\n}\n\nfunction App() {\n  return (\n    <div>\n      \n    </div>\n  );\n}',
      solution:
        'function HostCard({ ip, os }) {\n  return (\n    <div>\n      <h3>{ip}</h3>\n      <p>{os}</p>\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <div>\n      <HostCard ip="10.10.10.5" os="linux" />\n      <HostCard ip="10.10.10.99" os="windows" />\n    </div>\n  );\n}',
      hints: ['Pass strings as ip="10.10.10.5".', 'Use the component twice inside App.'],
      assertions: [
        { type: 'count', selector: 'h3', value: 2 },
        { type: 'textIncludes', value: '10.10.10.5' },
        { type: 'textIncludes', value: 'windows' },
      ],
    },
    {
      id: 'list-keys',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Given `const hosts = [{ip: "10.0.0.1"}, {ip: "10.0.0.2"}, {ip: "10.0.0.3"}]`, render a `<ul>` with one `<li>` per host showing its ip. Give each `<li>` a proper `key`.',
      starter:
        'function App() {\n  const hosts = [{ip: "10.0.0.1"}, {ip: "10.0.0.2"}, {ip: "10.0.0.3"}];\n  return (\n    <ul>\n      \n    </ul>\n  );\n}',
      solution:
        'function App() {\n  const hosts = [{ip: "10.0.0.1"}, {ip: "10.0.0.2"}, {ip: "10.0.0.3"}];\n  return (\n    <ul>\n      {hosts.map(h => (\n        <li key={h.ip}>{h.ip}</li>\n      ))}\n    </ul>\n  );\n}',
      hints: ['{hosts.map(h => <li key={h.ip}>{h.ip}</li>)}', 'The ip is unique, so it makes a good key.'],
      assertions: [
        { type: 'count', selector: 'li', value: 3 },
        { type: 'textIncludes', value: '10.0.0.2' },
      ],
    },
    {
      id: 'conditional',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Given `const hosts = []`, render `<p>No hosts yet.</p>` when the list is empty, and a `<ul>` of items when it is not. (With an empty array, only the paragraph should appear — and no stray `0`.)',
      starter: 'function App() {\n  const hosts = [];\n  return (\n    <div>\n      \n    </div>\n  );\n}',
      solution:
        'function App() {\n  const hosts = [];\n  return (\n    <div>\n      {hosts.length === 0 && <p>No hosts yet.</p>}\n      {hosts.length > 0 && (\n        <ul>\n          {hosts.map(h => <li key={h.ip}>{h.ip}</li>)}\n        </ul>\n      )}\n    </div>\n  );\n}',
      hints: [
        '{condition && <element />} renders the element only when the condition is true.',
        'Compare the length explicitly (=== 0 / > 0) so a bare 0 never leaks into the output.',
      ],
      assertions: [
        { type: 'textIncludes', value: 'No hosts yet.' },
        { type: 'textNotIncludes', value: '0' },
      ],
    },
    {
      id: 'key-quiz',
      kind: 'quiz',
      prompt: 'Why is the array index a poor `key` for a list you can filter or delete from?',
      choices: [
        'Indexes are slower to compare than strings',
        'The index describes a position, not an item — so after a removal every item gets a different key and React attaches existing DOM and state to the wrong rows',
        'React forbids numeric keys',
        'Indexes break the map callback',
      ],
      answer: 1,
      explain:
        'Keys are how React matches this render\'s items against the last one. A stable id means "this is still the same item, it just moved". An index means "this is whatever is in slot 2 now" — so deleting the first row makes every subsequent row look like it changed content, and any DOM state inside them (focus, cursor position, an uncontrolled input\'s text) sticks to the wrong item. For a list that never reorders, the index is harmless.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'state',
  title: 'State and events with useState',
  minutes: 18,
  body: `
## Why an ordinary variable does not work

    function Counter() {
      let count = 0;                                  // resets on every render
      return <button onClick={() => count++}>{count}</button>;   // and nothing re-renders
    }

Two problems: the variable is recreated each time the function runs, and changing
it does not tell React to run the function again. **State** solves both.

    import { useState } from "react";

    function Counter() {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
    }

- \`useState(initial)\` returns a pair: the current value, and a setter.
- The array destructuring names them; \`count\`/\`setCount\` is the convention.
- Calling the setter tells React: this value changed, **re-run this component**.
- The initial value is used on the first render only.

## Events

    <button onClick={handleClick}>              pass the FUNCTION
    <button onClick={handleClick()}>            WRONG — calls it during render
    <button onClick={() => remove(host.id)}>    wrap it when you need an argument

    <input onChange={e => setText(e.target.value)} />
    <form onSubmit={e => { e.preventDefault(); save(); }}>

\`e.preventDefault()\` on a form submit stops the browser's default full-page
reload. Without it, your app reloads and all state vanishes — a five-minute
mystery the first time.

## State updates are asynchronous and batched

    setCount(count + 1);
    console.log(count);      // still the OLD value

React does not change \`count\` — it schedules a re-render, and the *next* run of
your function gets the new value. So this does not do what it looks like:

    setCount(count + 1);
    setCount(count + 1);     // both read the same stale count: net +1

Use the **updater function** whenever the new value depends on the old:

    setCount(c => c + 1);
    setCount(c => c + 1);    // +2, because each receives the latest value

## Never mutate state

React decides whether to re-render by comparing the old value to the new one by
*identity*. Mutating an object or array in place leaves the identity unchanged,
so React sees nothing and your screen does not update.

    hosts.push(newHost);           // WRONG — same array, no re-render
    setHosts([...hosts, newHost]); // right — a new array

    host.os = "windows";                     // WRONG
    setHost({ ...host, os: "windows" });     // right

    setHosts(hosts.filter(h => h.ip !== ip));                       // remove
    setHosts(hosts.map(h => h.ip === ip ? { ...h, up: true } : h)); // update one

This is the \`{ ...old, field: new }\` pattern from the JavaScript track, and it is
now load-bearing. Every list operation in React is \`map\`, \`filter\` or spread —
never \`push\`, \`splice\` or direct assignment.

## Where state should live

Put state in the **lowest component that needs it**. When two siblings need the
same value, move it up to their closest common parent and pass it down — "lifting
state up". The parent owns the value and passes both the value and a setter
function to the children:

    function Parent() {
      const [selected, setSelected] = useState(null);
      return (
        <>
          <HostList onSelect={setSelected} />
          <Details ip={selected} />
        </>
      );
    }

Data flows down as props, events flow up as function calls. That one sentence is
the whole architecture.

## Derived values are not state

    const [hosts, setHosts] = useState([]);
    const upCount = hosts.filter(h => h.up).length;     // just compute it

Do not add a \`upCount\` state and try to keep it in sync — that is the class of
bug React exists to eliminate. If you can calculate it from existing state during
render, calculate it.
`,
  exercises: [
    {
      id: 'counter',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Build `App` with a count starting at 0 and a `<button>` reading `Count: 0` that increases by one each click.',
      starter: 'function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={}>\n      \n    </button>\n  );\n}',
      solution:
        'function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Count: {count}\n    </button>\n  );\n}',
      hints: [
        'onClick takes a function — wrap the call in an arrow: () => setCount(count + 1)',
        'Render the value with {count} inside the button.',
      ],
      assertions: [
        { type: 'textIncludes', value: 'Count: 0' },
        { type: 'click', selector: 'button', then: 'Count: 1' },
        { type: 'click', selector: 'button', times: 2, then: 'Count: 3' },
      ],
    },
    {
      id: 'add-to-list',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Start with `useState(["10.0.0.1"])`. Render a `<ul>` of the hosts and a `<button>Add</button>` that appends `"10.0.0.2"` **without mutating** the existing array. After one click there should be two `<li>` elements.',
      starter: 'function App() {\n  const [hosts, setHosts] = useState(["10.0.0.1"]);\n  return (\n    <div>\n      \n    </div>\n  );\n}',
      solution:
        'function App() {\n  const [hosts, setHosts] = useState(["10.0.0.1"]);\n  return (\n    <div>\n      <ul>\n        {hosts.map(ip => (\n          <li key={ip}>{ip}</li>\n        ))}\n      </ul>\n      <button onClick={() => setHosts([...hosts, "10.0.0.2"])}>Add</button>\n    </div>\n  );\n}',
      hints: [
        'setHosts([...hosts, "10.0.0.2"]) makes a NEW array — push would not re-render.',
        'Render the list with hosts.map(...) and give each li a key.',
      ],
      assertions: [
        { type: 'count', selector: 'li', value: 1 },
        { type: 'click', selector: 'button', then: '10.0.0.2' },
        { type: 'count', selector: 'li', value: 2 },
      ],
    },
    {
      id: 'updater-quiz',
      kind: 'quiz',
      prompt: 'Clicking this button once increases the count by how much?\n\n```jsx\nonClick={() => { setCount(count + 1); setCount(count + 1); }}\n```',
      choices: ['2', '1', '0', 'It throws an error'],
      answer: 1,
      explain:
        '`count` is a value captured when this render ran — it does not change mid-handler. Both calls compute the same "old + 1" and the second simply overwrites the first, so the net effect is +1. `setCount(c => c + 1)` twice gives +2, because React passes each updater the most recent value rather than the one captured at render time.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'effects',
  title: 'useEffect: talking to the world outside React',
  minutes: 18,
  body: `
## What an effect is for

Rendering should be pure: same props and state in, same markup out, nothing else
touched. Anything that reaches *outside* that — a network request, a timer, a
subscription, a direct DOM API, localStorage — is a **side effect**, and it
belongs in \`useEffect\`.

    import { useState, useEffect } from "react";

    function Clock() {
      const [now, setNow] = useState(new Date());

      useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);     // cleanup
      }, []);                               // dependency array

      return <p>{now.toLocaleTimeString()}</p>;
    }

Three parts, and each one matters.

## The dependency array

    useEffect(() => { ... });              // after EVERY render — almost always a bug
    useEffect(() => { ... }, []);          // once, after the first render
    useEffect(() => { ... }, [hostId]);    // whenever hostId changes

The rule: list every value from your component that the effect reads. If the
effect fetches \`/hosts/\${hostId}\`, \`hostId\` must be in the array, or the effect
will keep showing data for the first host forever.

Omitting the array entirely runs the effect after every render — and if the effect
sets state, that render triggers another effect, and you have an infinite loop.
When a React app pegs a CPU core, this is why.

## Cleanup

If the effect returns a function, React calls it before the effect runs again and
when the component unmounts. Anything you started, stop:

    useEffect(() => {
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }, []);

Without cleanup, every mount leaves another interval running forever. In a
long-lived dashboard that is a genuine memory leak.

## Fetching data

    function HostDetail({ ip }) {
      const [data, setData] = useState(null);
      const [error, setError] = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        let cancelled = false;
        setLoading(true);

        fetch(\`/api/hosts/\${ip}\`)
          .then(r => {
            if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
            return r.json();
          })
          .then(json => { if (!cancelled) setData(json); })
          .catch(err => { if (!cancelled) setError(err.message); })
          .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
      }, [ip]);

      if (loading) return <p>Loading…</p>;
      if (error) return <p>Failed: {error}</p>;
      return <pre>{JSON.stringify(data, null, 2)}</pre>;
    }

The \`cancelled\` flag handles the race: if \`ip\` changes while a request is in
flight, the old response must not overwrite the new one. Always model all three
states — loading, error, data. A UI that only handles the happy path is the most
common thing reviewers send back.

> \`fetch\` talks to a server. The API you built with \`node:http\` in the previous
> track is exactly the kind of thing on the other end — that is the full stack,
> and you have now written both halves.

## Effects you do not need

This is where beginners overuse the hook. You do **not** need an effect to:

- **compute a value from state** — just calculate it during render;
- **respond to a click** — do it in the event handler;
- **reset state when a prop changes** — pass a different \`key\` to the component
  and React remounts it with fresh state.

A good rule: if the effect does not touch anything outside React, it probably
should not be an effect.

## Strict mode runs effects twice

In development, React deliberately mounts, unmounts and remounts each component
once. Effects run twice and you see two of everything in the console. That is not
a bug — it is React surfacing missing cleanup. If running twice breaks your
effect, your effect was already broken.
`,
  exercises: [
    {
      id: 'effect-mount',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Use `useState` and `useEffect` so that `App` renders `<p>loading</p>` first and then, in an effect that runs exactly once, sets the status to `ready` so it renders `<p>ready</p>`.',
      starter:
        'function App() {\n  const [status, setStatus] = useState("loading");\n\n  useEffect(() => {\n    \n  }, );\n\n  return <p>{status}</p>;\n}',
      solution:
        'function App() {\n  const [status, setStatus] = useState("loading");\n\n  useEffect(() => {\n    setStatus("ready");\n  }, []);\n\n  return <p>{status}</p>;\n}',
      hints: [
        'Call setStatus("ready") inside the effect body.',
        'The empty dependency array [] means "run once after the first render".',
        'Leaving the array out entirely would loop forever.',
      ],
      assertions: [
        { type: 'textIncludes', value: 'ready' },
        { type: 'textNotIncludes', value: 'loading' },
      ],
    },
    {
      id: 'effect-cleanup',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Build a ticker: state `ticks` starting at 0, an effect that starts a 20ms `setInterval` incrementing it with the **updater form**, and a cleanup that clears the interval. Render `<p>ticks: {ticks}</p>`.',
      starter:
        'function App() {\n  const [ticks, setTicks] = useState(0);\n\n  useEffect(() => {\n    const id = setInterval(() => , 20);\n    return ;\n  }, []);\n\n  return <p>ticks: {ticks}</p>;\n}',
      solution:
        'function App() {\n  const [ticks, setTicks] = useState(0);\n\n  useEffect(() => {\n    const id = setInterval(() => setTicks(t => t + 1), 20);\n    return () => clearInterval(id);\n  }, []);\n\n  return <p>ticks: {ticks}</p>;\n}',
      hints: [
        'setTicks(t => t + 1) — the updater form, because the new value depends on the old one.',
        'Return () => clearInterval(id) so the timer stops when the component goes away.',
      ],
      assertions: [
        { type: 'codeIncludes', value: 'clearInterval' },
        { type: 'codeIncludes', value: 'setInterval' },
        { type: 'wait', ms: 120 },
        { type: 'textNotIncludes', value: 'ticks: 0' },
      ],
    },
    {
      id: 'deps-quiz',
      kind: 'quiz',
      prompt: 'An effect fetches `/api/hosts/${id}` but the dependency array is `[]`. What goes wrong?',
      choices: [
        'It runs on every render and loops',
        'It fetches once for the first id and never refetches when id changes, so the UI shows stale data',
        'It throws a React error',
        'Nothing — [] is correct for fetches',
      ],
      answer: 1,
      explain:
        'An empty array says "this effect depends on nothing, so run it once". But the effect reads `id`, so that is false. The component re-renders with a new id, the effect does not re-run, and you keep displaying the first host\'s data. The rule is mechanical: every value from the component that the effect reads goes in the array — `[id]` here. The eslint react-hooks/exhaustive-deps rule enforces exactly this and is worth enabling.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'forms',
  title: 'Forms, controlled inputs and filtering',
  minutes: 16,
  body: `
## Controlled inputs

A **controlled** input takes its value from state, so React is the single source
of truth:

    const [query, setQuery] = useState("");

    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="Filter hosts"
    />

Every keystroke fires \`onChange\`, which sets state, which re-renders, which puts
the new value back in the box. It feels circular and it is — that loop is what
lets any other part of the app read or change the field.

**The classic trap:** \`value={query}\` with no \`onChange\` makes a field you cannot
type in, because React keeps resetting it to the state value. React warns about
this in the console. If you genuinely want an uncontrolled field with an initial
value, use \`defaultValue\`.

Other input types:

    <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />
    <select value={sel} onChange={e => setSel(e.target.value)}> ... </select>
    <textarea value={text} onChange={e => setText(e.target.value)} />

Note \`checked\`, not \`value\`, for checkboxes, and that \`<textarea>\` takes a
\`value\` prop rather than children — a deliberate divergence from HTML.

## Forms

    function AddHost({ onAdd }) {
      const [ip, setIp] = useState("");

      function handleSubmit(e) {
        e.preventDefault();
        if (!ip.trim()) return;
        onAdd(ip.trim());
        setIp("");
      }

      return (
        <form onSubmit={handleSubmit}>
          <input value={ip} onChange={e => setIp(e.target.value)} />
          <button type="submit">Add</button>
        </form>
      );
    }

Use a real \`<form>\` with \`onSubmit\` rather than only an \`onClick\` on the button:
you get Enter-to-submit and screen-reader semantics for free. \`e.preventDefault()\`
stops the page reload. Clearing the field after a successful submit is a small
thing users notice immediately.

## Filtering: derive, do not duplicate

    const [hosts] = useState(initialHosts);
    const [query, setQuery] = useState("");

    const visible = hosts.filter(h =>
      h.ip.toLowerCase().includes(query.toLowerCase())
    );

\`visible\` is **not** state. It is recalculated on every render from the two things
that are. Storing a \`filteredHosts\` state and trying to keep it in sync with both
\`hosts\` and \`query\` is the bug this avoids — and it is the single most common
piece of unnecessary state in beginner React.

The test: *can I compute this from what I already have?* If yes, compute it.

## Multiple fields in one state object

    const [form, setForm] = useState({ ip: "", port: "" });

    function update(field, value) {
      setForm(prev => ({ ...prev, [field]: value }));
    }

    <input value={form.ip} onChange={e => update("ip", e.target.value)} />

\`[field]\` in braces is a **computed key** — it uses the variable's value as the
property name. Combined with the spread, that one function updates any field
without mutating the object.

## Accessibility, briefly

    <label htmlFor="ip">Target IP</label>
    <input id="ip" value={ip} onChange={...} />

A \`<label>\` tied to its input makes the label clickable, gives screen readers
something to announce, and takes four seconds. Buttons that are \`<div onClick>\`
are not keyboard reachable — use a real \`<button>\`.
`,
  exercises: [
    {
      id: 'controlled-input',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Render a controlled `<input>` whose state starts empty, plus a `<p>` showing `typed: <value>`. Typing `kali` should make the paragraph read `typed: kali`.',
      starter:
        'function App() {\n  const [text, setText] = useState("");\n  return (\n    <div>\n      <input  />\n      <p>typed: {text}</p>\n    </div>\n  );\n}',
      solution:
        'function App() {\n  const [text, setText] = useState("");\n  return (\n    <div>\n      <input value={text} onChange={e => setText(e.target.value)} />\n      <p>typed: {text}</p>\n    </div>\n  );\n}',
      hints: [
        'value={text} makes it controlled.',
        'onChange={e => setText(e.target.value)} is what lets you type at all.',
      ],
      assertions: [
        { type: 'exists', selector: 'input' },
        { type: 'type', selector: 'input', text: 'kali', then: 'typed: kali' },
      ],
    },
    {
      id: 'filter-list',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Given `const hosts = ["10.0.0.1", "10.0.0.2", "192.168.1.7"]`, render a filter `<input>` and a `<ul>` showing only the hosts containing the typed text. Do **not** store the filtered list in state. Typing `192` should leave exactly one `<li>`.',
      starter:
        'function App() {\n  const hosts = ["10.0.0.1", "10.0.0.2", "192.168.1.7"];\n  const [query, setQuery] = useState("");\n  \n  return (\n    <div>\n      <input  />\n      <ul>\n        \n      </ul>\n    </div>\n  );\n}',
      solution:
        'function App() {\n  const hosts = ["10.0.0.1", "10.0.0.2", "192.168.1.7"];\n  const [query, setQuery] = useState("");\n  const visible = hosts.filter(h => h.includes(query));\n\n  return (\n    <div>\n      <input value={query} onChange={e => setQuery(e.target.value)} />\n      <ul>\n        {visible.map(h => (\n          <li key={h}>{h}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}',
      hints: [
        'Compute `visible` during render — it is derived, not state.',
        'hosts.filter(h => h.includes(query))',
        'Then map `visible`, not `hosts`.',
      ],
      assertions: [
        { type: 'count', selector: 'li', value: 3 },
        { type: 'type', selector: 'input', text: '192', then: '192.168.1.7' },
        { type: 'count', selector: 'li', value: 1 },
      ],
    },
    {
      id: 'derived-quiz',
      kind: 'quiz',
      prompt: 'Why is `const visible = hosts.filter(...)` better than keeping `visible` in state and updating it with an effect?',
      choices: [
        'It uses less memory',
        'There is only one source of truth, so the filtered view can never fall out of sync with the data or the query',
        'Effects cannot call filter',
        'State can only hold primitives',
      ],
      answer: 1,
      explain:
        'Duplicated state has to be kept in sync by hand, and every new way the source can change is another place you must remember to update the copy. Deriving during render means the filtered view is recomputed from the current data and query every time, so it is correct by construction. It is also faster than an effect, which would render once with stale data before correcting itself.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'react-project',
  title: 'Project: a findings dashboard',
  minutes: 25,
  body: `
## The brief

Build a single \`App\` that manages a list of findings — the kind of thing you would
keep during an engagement. It brings together every hook and pattern in this
track.

Requirements:

1. State: a list of findings, each \`{ id, host, severity, resolved }\`, seeded with
   two items.
2. A text \`<input>\` that filters the list by host as you type (**derived**, never
   stored in state).
3. A \`<ul>\` rendering the visible findings, each \`<li>\` keyed by \`id\`.
4. Each row has a **Resolve** button that flips only that finding's \`resolved\`
   flag — immutably.
5. A summary paragraph reading \`<n> open\` where n counts unresolved findings —
   also derived.

## The two patterns doing all the work

**Updating one item in a list, immutably:**

    setFindings(findings.map(f =>
      f.id === id ? { ...f, resolved: !f.resolved } : f
    ));

Read it as: build a new array; for the matching item substitute a copy with one
field changed; leave everything else exactly as it was. Note that non-matching
items are passed through by reference — React sees they are identical and skips
re-rendering them. Correctness and performance from the same line.

**Deriving instead of storing:**

    const visible = findings.filter(f => f.host.includes(query));
    const openCount = findings.filter(f => !f.resolved).length;

Neither is state. Both are recomputed every render from the two things that are
(\`findings\` and \`query\`), so they cannot go stale.

## A hint on the click handler

\`onClick\` needs a function, and you need to pass the id, so wrap it:

    <button onClick={() => toggle(f.id)}>Resolve</button>

Writing \`onClick={toggle(f.id)}\` calls the function during render instead — which
sets state during render, which re-renders, which calls it again. That is the
"Too many re-renders" error, and now you know exactly what causes it.

## Where to take it next

Split the row into its own \`<FindingRow>\` component taking props and a callback.
Add the form from the last lesson to create new findings. Then persist to
\`localStorage\` in a \`useEffect\` — and you have a small real application.

Connect that to the \`node:http\` API you wrote in the last track and you have
built both halves of a full-stack tool, on your own machine, from nothing.
`,
  exercises: [
    {
      id: 'dashboard',
      kind: 'react',
      componentName: 'App',
      prompt:
        'Build the dashboard described above. Seed with `{id:1, host:"10.0.0.1", severity:"high", resolved:false}` and `{id:2, host:"192.168.1.7", severity:"low", resolved:false}`. Show `<p>2 open</p>`, filter on typing, and let a Resolve button flip one finding.',
      starter: `function App() {
  const [findings, setFindings] = useState([
    { id: 1, host: "10.0.0.1", severity: "high", resolved: false },
    { id: 2, host: "192.168.1.7", severity: "low", resolved: false },
  ]);
  const [query, setQuery] = useState("");

  // derive: visible + openCount

  function toggle(id) {
    // flip resolved on just this one, immutably
  }

  return (
    <div>
      <input  />
      <ul>

      </ul>
      <p> open</p>
    </div>
  );
}`,
      solution: `function App() {
  const [findings, setFindings] = useState([
    { id: 1, host: "10.0.0.1", severity: "high", resolved: false },
    { id: 2, host: "192.168.1.7", severity: "low", resolved: false },
  ]);
  const [query, setQuery] = useState("");

  const visible = findings.filter(f => f.host.includes(query));
  const openCount = findings.filter(f => !f.resolved).length;

  function toggle(id) {
    setFindings(findings.map(f =>
      f.id === id ? { ...f, resolved: !f.resolved } : f
    ));
  }

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Filter by host"
      />
      <ul>
        {visible.map(f => (
          <li key={f.id}>
            {f.host} — {f.severity} — {f.resolved ? "resolved" : "open"}
            <button onClick={() => toggle(f.id)}>Resolve</button>
          </li>
        ))}
      </ul>
      <p>{openCount} open</p>
    </div>
  );
}`,
      hints: [
        'visible and openCount are both plain consts computed during render.',
        'toggle: setFindings(findings.map(f => f.id === id ? { ...f, resolved: !f.resolved } : f))',
        'Wrap the click: onClick={() => toggle(f.id)} — not onClick={toggle(f.id)}.',
      ],
      assertions: [
        { type: 'count', selector: 'li', value: 2 },
        { type: 'textIncludes', value: '2 open' },
        { type: 'click', selector: 'li button', then: '1 open' },
        { type: 'type', selector: 'input', text: '192', then: '192.168.1.7' },
        { type: 'count', selector: 'li', value: 1 },
      ],
    },
  ],
},

  ],
};
