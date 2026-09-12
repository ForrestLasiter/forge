/**
 * Track 2 — Python from zero.
 *
 * Exercises run with `python3 <tempfile>` and cwd set to ~/.forge/workspace,
 * so `open("lab/logs/auth.log")` inside a lesson resolves to the same lab files
 * the Linux track uses. Reusing one dataset across two languages is deliberate:
 * it makes the "when do I reach for a script instead of a pipeline?" question
 * concrete.
 */

module.exports = {
  id: 'python',
  title: 'Python from zero',
  blurb: 'Syntax, data structures, functions, files, errors, modules and a real log-parsing tool.',
  colour: '#fbbf24',
  lessons: [

// ---------------------------------------------------------------------------
{
  id: 'first-program',
  title: 'Values, variables and printing',
  minutes: 14,
  body: `
## Why Python, and why on Kali

Python is already installed on Kali and most of the tooling around you is written
in it. It is the language where "I need to do this 500 times" stops being a chore.
The shell is better at gluing programs together; Python is better the moment you
need data structures, parsing, or anything you would be ashamed to write in awk.

Run a file with \`python3 script.py\`. That is all there is to the workflow.

## print, and the fact that everything is an object

    print("hello")
    print("a", "b")          # -> a b        (space between, newline at end)
    print("a", "b", sep="-") # -> a-b
    print("no newline", end="")

## Variables are labels, not boxes

    target = "10.10.10.5"
    port = 22
    open_ports = [22, 80, 443]

No type declaration and no \`var\`/\`let\`. The name \`target\` is a label you stuck on
a string object. Assigning again just moves the label:

    x = [1, 2, 3]
    y = x          # y is ANOTHER LABEL ON THE SAME LIST, not a copy
    y.append(4)
    print(x)       # -> [1, 2, 3, 4]   <-- surprises everyone once

That is the single most important thing to internalise early. If you want a copy,
ask for one: \`y = x.copy()\` or \`y = list(x)\`.

## The types you will use constantly

    str     "10.10.10.5"      text
    int     22                whole number
    float   1.5               decimal
    bool    True / False      note the capital letters
    None    None              "no value" — not zero, not empty string
    list    [1, 2, 3]         ordered, changeable
    dict    {"port": 22}      key -> value lookups
    tuple   (1, 2)            ordered, FROZEN
    set     {1, 2, 3}         unordered, no duplicates

\`type(x)\` tells you what something is. \`int("22")\` and \`str(22)\` convert. Python
will **not** convert for you:

    "Port " + 22        # TypeError
    "Port " + str(22)   # "Port 22"
    f"Port {22}"        # "Port 22"   <- just use this

## f-strings

Put an \`f\` in front of the quote and \`{}\` becomes a window into your code:

    host = "kali"
    port = 22
    print(f"Connecting to {host}:{port}")
    print(f"{port * 2}")            # expressions work
    print(f"{3.14159:.2f}")         # -> 3.14   formatting after the colon
    print(f"{host=}")               # -> host='kali'   brilliant for debugging

That last trick, \`{variable=}\`, prints the name *and* the value. It replaces about
half the \`print\` statements you would otherwise write while debugging.

## Comments and input

    # everything after a hash is ignored

    name = input("Your name: ")     # ALWAYS returns a string
    age = int(input("Age: "))       # convert if you need a number

\`input()\` returning a string even when the user typed digits is the source of the
classic bug where \`"10" > "9"\` is False (string comparison is alphabetical).
`,
  exercises: [
    {
      id: 'hello',
      kind: 'python',
      prompt: 'Print exactly: `forge online`',
      starter: '',
      solution: 'print("forge online")',
      hints: ['print("...")'],
      check: ({ result }) =>
        result.stdout.trim() === 'forge online'
          ? { pass: true, message: 'That is a complete Python program.' }
          : { pass: false, message: `Expected "forge online", got ${JSON.stringify(result.stdout.trim())}` },
    },
    {
      id: 'fstring',
      kind: 'python',
      prompt:
        'Make two variables — `host` set to `"10.10.10.5"` and `port` set to the number `22` — then use a single f-string to print `Scanning 10.10.10.5 on port 22`.',
      starter: 'host = \nport = \n',
      solution: 'host = "10.10.10.5"\nport = 22\nprint(f"Scanning {host} on port {port}")',
      hints: ['port should be an int, not a string — no quotes.', 'print(f"Scanning {host} on port {port}")'],
      check: ({ code, result }) => {
        if (!/f["']/.test(code)) return { pass: false, message: 'Use an f-string (a quote preceded by f).' };
        return result.stdout.trim() === 'Scanning 10.10.10.5 on port 22'
          ? { pass: true, message: 'f-strings are the only string formatting you need in modern Python.' }
          : { pass: false, message: `Expected "Scanning 10.10.10.5 on port 22", got ${JSON.stringify(result.stdout.trim())}` };
      },
    },
    {
      id: 'alias-quiz',
      kind: 'quiz',
      prompt: 'What does this print?\n\n```python\na = [1, 2]\nb = a\nb.append(3)\nprint(a)\n```',
      choices: ['[1, 2]', '[1, 2, 3]', '[3]', 'TypeError'],
      answer: 1,
      explain:
        '`b = a` does not copy the list — it creates a second name for the same list object in memory. Mutating through either name is visible through both. Use `b = a.copy()` when you want an independent list. This is the same distinction as a symlink versus `cp` on the filesystem.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'control-flow',
  title: 'Decisions and loops',
  minutes: 15,
  body: `
## Indentation is the syntax

Python has no braces. The indentation **is** the block structure. Four spaces is
the convention; be consistent or the interpreter refuses to run the file.

    if port == 22:
        print("ssh")
        print("still inside the if")
    print("outside again")

An \`IndentationError\` is Python telling you your intent and your whitespace
disagree. It is a feature: badly indented Python cannot lie about what it does.

## if / elif / else

    status = 403

    if status == 200:
        print("ok")
    elif status == 403:
        print("forbidden — something is there but you cannot see it")
    elif status == 404:
        print("not found")
    else:
        print(f"unhandled: {status}")

Comparisons: \`==\` \`!=\` \`<\` \`<=\` \`>\` \`>=\`. Note \`=\` assigns, \`==\` compares — the
most common beginner typo in every language.

Combine with \`and\`, \`or\`, \`not\` (words, not \`&&\`/\`||\`):

    if port > 0 and port < 65536:
    if 0 < port < 65536:        # Python lets you chain. Nothing else does.

## Truthiness

Python treats these as False: \`False\`, \`None\`, \`0\`, \`""\`, \`[]\`, \`{}\`, \`()\`.
Everything else is True. So:

    if results:          # "if the list is not empty"
    if not name:         # "if the name is empty or None"

That reads better than \`if len(results) > 0\` and is what you will see in real code.

## for loops iterate over things, not counters

    for port in [22, 80, 443]:
        print(port)

    for char in "kali":
        print(char)

    for i in range(5):          # 0 1 2 3 4  — stop is EXCLUSIVE
        print(i)

    for i in range(1, 5):       # 1 2 3 4
    for i in range(0, 10, 2):   # 0 2 4 6 8   (start, stop, step)

\`range(5)\` giving 0–4 and not 1–5 is deliberate: it makes \`range(len(x))\` line up
with list indexes, and \`range(a, b)\` have exactly \`b - a\` items.

    for i, port in enumerate([22, 80]):    # index AND value
        print(i, port)

\`enumerate\` is the right answer whenever you were about to write \`range(len(...))\`.

## while loops run until a condition goes false

    attempts = 0
    while attempts < 3:
        print(f"attempt {attempts}")
        attempts += 1

If the condition never becomes false, the program hangs — which in Forge means
the 10-second timeout kills it. Nine times in ten the cause is forgetting the
line that changes the variable.

## break, continue, else

    for ip in targets:
        if ip == "10.10.10.99":
            continue          # skip just this one, keep looping
        if found_it:
            break             # abandon the loop entirely

Python also allows \`else\` on a loop, which runs **only if the loop finished
without breaking** — genuinely useful for search loops:

    for ip in targets:
        if is_vulnerable(ip):
            print("found one")
            break
    else:
        print("scanned everything, nothing vulnerable")
`,
  exercises: [
    {
      id: 'fizz-ports',
      kind: 'python',
      prompt:
        'Loop over the numbers 1 through 5 inclusive. For each one print `port <n>: closed`, except for 3, where you print `port 3: OPEN`.',
      starter: 'for n in range(...):\n    ',
      solution:
        'for n in range(1, 6):\n    if n == 3:\n        print(f"port {n}: OPEN")\n    else:\n        print(f"port {n}: closed")',
      hints: [
        'range(1, 6) gives 1,2,3,4,5 — the stop value is excluded.',
        'Use if / else inside the loop.',
      ],
      check: ({ result, h }) => {
        const lines = h.lines(result.stdout);
        const want = ['port 1: closed', 'port 2: closed', 'port 3: OPEN', 'port 4: closed', 'port 5: closed'];
        if (lines.length !== 5) return { pass: false, message: `Expected 5 lines, got ${lines.length}. range(1, 6) — not range(5).` };
        const bad = want.findIndex((w, i) => lines[i] !== w);
        return bad === -1
          ? { pass: true, message: 'Loop plus branch. That is most of programming.' }
          : { pass: false, message: `Line ${bad + 1} should be "${want[bad]}", got "${lines[bad]}"` };
      },
    },
    {
      id: 'countdown',
      kind: 'python',
      prompt:
        'Using a `while` loop, count down from 3 to 1, printing each number on its own line, then print `go`.',
      starter: 'n = 3\nwhile ',
      solution: 'n = 3\nwhile n > 0:\n    print(n)\n    n -= 1\nprint("go")',
      hints: ['The condition is n > 0.', 'Do not forget n -= 1 inside the loop, or it never ends.'],
      check: ({ code, result, h }) => {
        if (!/\bwhile\b/.test(code)) return { pass: false, message: 'This one specifically wants a while loop.' };
        const lines = h.lines(result.stdout);
        const ok = JSON.stringify(lines) === JSON.stringify(['3', '2', '1', 'go']);
        return ok
          ? { pass: true, message: 'The decrement line is the one everybody forgets exactly once.' }
          : { pass: false, message: `Expected 3, 2, 1, go on separate lines. Got: ${lines.join(' | ')}` };
      },
    },
    {
      id: 'range-quiz',
      kind: 'quiz',
      prompt: 'How many numbers does `range(2, 10, 3)` produce, and what are they?',
      choices: ['3 numbers: 2, 5, 8', '4 numbers: 2, 5, 8, 10', '8 numbers: 2 through 9', '3 numbers: 3, 6, 9'],
      answer: 0,
      explain:
        'range(start, stop, step) begins at start, adds step each time, and stops *before* reaching stop. 2, then 5, then 8 — the next would be 11, which is past 10, so it stops. The exclusive stop is what makes range(len(items)) produce exactly the valid indexes.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'collections',
  title: 'Lists, dicts, sets and comprehensions',
  minutes: 18,
  body: `
## Lists — ordered and changeable

    ports = [22, 80, 443]
    ports.append(8080)          # add to the end
    ports.insert(0, 21)         # add at a position
    ports.remove(80)            # remove by VALUE (errors if absent)
    last = ports.pop()          # remove and return the last one
    len(ports)                  # how many
    22 in ports                 # True  <- membership test, very readable

Indexing starts at 0, and negatives count from the end:

    ports[0]      first
    ports[-1]     last          <- much better than ports[len(ports)-1]
    ports[1:3]    items 1 and 2 (stop is exclusive, as always)
    ports[:2]     first two
    ports[-2:]    last two
    ports[::-1]   reversed copy

Slicing never errors on out-of-range, which is why \`text[:50]\` is a safe way to
truncate anything.

    sorted(ports)               returns a NEW sorted list
    ports.sort()                sorts IN PLACE and returns None

Confusing those two is a classic: \`ports = ports.sort()\` sets ports to None.

## Dicts — lookup by key

Your main tool. A dict maps keys to values with instant lookup no matter how big
it gets.

    host = {"ip": "10.10.10.5", "os": "linux", "ports": [22, 80]}

    host["ip"]                  -> "10.10.10.5"   (KeyError if missing)
    host.get("os")              -> "linux"        (None if missing — safer)
    host.get("os", "unknown")   -> default if missing
    host["banner"] = "OpenSSH"  add or overwrite
    del host["os"]
    "ip" in host                membership tests the KEYS

    for key in host: ...
    for key, value in host.items(): ...     <- what you almost always want
    host.keys() / host.values()

**Counting things** is the job dicts were born for:

    counts = {}
    for ip in all_ips:
        counts[ip] = counts.get(ip, 0) + 1

That \`.get(ip, 0)\` pattern — "the count so far, or zero if this is the first time"
— is the whole trick. (\`collections.Counter\` does it in one line, and you will
meet it in the modules lesson.)

## Sets — uniqueness and fast membership

    seen = set()
    seen.add("10.10.10.5")
    unique_ips = set(all_ips)          # instant de-duplication
    len(set(all_ips))                  # how many distinct

    a & b     in both (intersection)
    a | b     in either (union)
    a - b     in a but not b           <- "what is new since last scan?"

\`sort -u\` from the Linux track is \`set()\` here. \`a - b\` is a diff between two
scans, in one character.

## Tuples — frozen lists

    point = (10, 20)
    ip, port = ("10.10.10.5", 22)      # unpacking

Immutable, so they can be dict keys and cannot be changed by accident. Functions
returning several values return a tuple.

## Comprehensions — the thing that makes Python feel like Python

A loop that builds a list, written as one expression:

    squares = [n * n for n in range(5)]                    # [0,1,4,9,16]
    open_only = [p for p in results if p["state"] == "open"]
    ips = [line.split()[0] for line in lines]

Read it left to right: *what to collect*, *where from*, *which ones to keep*.

    {p["ip"] for p in hosts}                    set comprehension
    {h["ip"]: h["os"] for h in hosts}           dict comprehension

The rule of thumb: if it fits on one line and you can still read it, use a
comprehension. If you need two conditions and a nested loop, write the ordinary
for loop — clever is not the goal.
`,
  exercises: [
    {
      id: 'list-basics',
      kind: 'python',
      prompt:
        'Start with `ports = [22, 80, 443]`. Append `8080`, then print the list length on one line and the **last** element on the next.',
      starter: 'ports = [22, 80, 443]\n',
      solution: 'ports = [22, 80, 443]\nports.append(8080)\nprint(len(ports))\nprint(ports[-1])',
      hints: ['.append() adds to the end.', 'ports[-1] is the last item.'],
      check: ({ result, h }) => {
        const lines = h.lines(result.stdout);
        return JSON.stringify(lines) === JSON.stringify(['4', '8080'])
          ? { pass: true, message: 'ports[-1] beats ports[len(ports)-1] every time.' }
          : { pass: false, message: `Expected "4" then "8080". Got: ${lines.join(' | ')}` };
      },
    },
    {
      id: 'count-dict',
      kind: 'python',
      prompt:
        'Given `ips = ["10.0.0.1", "10.0.0.2", "10.0.0.1", "10.0.0.1"]`, build a dict counting how many times each appears, then print it. Expected output: `{\'10.0.0.1\': 3, \'10.0.0.2\': 1}`',
      starter: 'ips = ["10.0.0.1", "10.0.0.2", "10.0.0.1", "10.0.0.1"]\ncounts = {}\n',
      solution:
        'ips = ["10.0.0.1", "10.0.0.2", "10.0.0.1", "10.0.0.1"]\ncounts = {}\nfor ip in ips:\n    counts[ip] = counts.get(ip, 0) + 1\nprint(counts)',
      hints: [
        'Loop over ips.',
        'counts.get(ip, 0) gives the count so far, or 0 the first time you see it.',
        'counts[ip] = counts.get(ip, 0) + 1',
      ],
      check: ({ result }) => {
        const t = result.stdout.trim();
        const ok = t === "{'10.0.0.1': 3, '10.0.0.2': 1}";
        return ok
          ? { pass: true, message: 'You just wrote `sort | uniq -c` in Python — and unlike the pipeline, you can now act on the numbers.' }
          : { pass: false, message: `Expected {'10.0.0.1': 3, '10.0.0.2': 1}, got: ${t}` };
      },
    },
    {
      id: 'comprehension',
      kind: 'python',
      prompt:
        'Given `results = [{"port": 22, "state": "open"}, {"port": 80, "state": "closed"}, {"port": 443, "state": "open"}]`, use a **list comprehension** to build a list of just the port numbers that are open, and print it. Expected: `[22, 443]`',
      starter:
        'results = [{"port": 22, "state": "open"}, {"port": 80, "state": "closed"}, {"port": 443, "state": "open"}]\n',
      solution:
        'results = [{"port": 22, "state": "open"}, {"port": 80, "state": "closed"}, {"port": 443, "state": "open"}]\nopen_ports = [r["port"] for r in results if r["state"] == "open"]\nprint(open_ports)',
      hints: [
        'Shape: [ WHAT for ITEM in LIST if CONDITION ]',
        '[r["port"] for r in results if r["state"] == "open"]',
      ],
      check: ({ code, result }) => {
        if (!/\[.*for .* in .*\]/s.test(code)) return { pass: false, message: 'This one asks specifically for a list comprehension.' };
        return result.stdout.trim() === '[22, 443]'
          ? { pass: true, message: 'Filter-and-extract in one line. You will write this shape constantly.' }
          : { pass: false, message: `Expected [22, 443], got: ${result.stdout.trim()}` };
      },
    },
    {
      id: 'set-quiz',
      kind: 'quiz',
      prompt: 'You scanned a subnet yesterday and today. Which expression gives you the hosts that appeared today but were not there yesterday?',
      choices: ['today & yesterday', 'today | yesterday', 'today - yesterday', 'yesterday - today'],
      answer: 2,
      explain:
        'Set difference: everything in `today` that is not in `yesterday`. `&` gives what both scans saw, `|` gives everything either scan saw, and `yesterday - today` gives the hosts that disappeared — also worth checking, for different reasons.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'functions',
  title: 'Functions',
  minutes: 15,
  body: `
## Why bother

A function is a name for a piece of behaviour. Three payoffs: you write it once,
you can test it on its own, and the name documents the intent so the calling code
reads like a sentence.

    def scan_port(host, port):
        """Return True if the port looks open."""
        return port in (22, 80, 443)

    if scan_port("10.10.10.5", 22):
        print("open")

- \`def\` starts it, the parameters are in the parentheses, the body is indented.
- The string on the first line is a **docstring** — \`help(scan_port)\` prints it.
- \`return\` sends a value back **and exits immediately**.
- A function with no \`return\` returns \`None\`.

## Arguments

    def connect(host, port=22, timeout=3):
        ...

    connect("10.10.10.5")                       # uses both defaults
    connect("10.10.10.5", 8080)                 # positional
    connect("10.10.10.5", timeout=10)           # keyword — skip the middle one
    connect(port=22, host="10.10.10.5")         # order is irrelevant with keywords

Keyword arguments at the call site are free documentation. \`connect(h, 3, True)\`
tells the reader nothing; \`connect(h, timeout=3, verbose=True)\` tells them
everything.

**The mutable default trap**, which bites everyone once:

    def add(item, bucket=[]):     # WRONG — that list is created ONCE, at def time
        bucket.append(item)
        return bucket

    add(1)   # [1]
    add(2)   # [1, 2]  <- the same list, still there from last call

    def add(item, bucket=None):   # RIGHT
        if bucket is None:
            bucket = []
        bucket.append(item)
        return bucket

## Returning more than one thing

    def parse(line):
        parts = line.split()
        return parts[0], parts[-1]      # really returns a tuple

    first, last = parse("a b c")

## Scope

Names created inside a function are local to it and vanish when it returns.
A function can *read* a module-level name but assigning to one creates a new local
unless you say \`global\` — which you should almost never do. Pass values in, return
values out; that is what makes a function testable.

## Type hints

    def scan_port(host: str, port: int, timeout: float = 3.0) -> bool:
        ...

Python ignores these at runtime. They exist for humans and for your editor, which
will start catching mistakes before you run anything. Add them to anything you
will still be reading next month.
`,
  exercises: [
    {
      id: 'define-fn',
      kind: 'python',
      prompt:
        'Write a function `banner(host, port=22)` that **returns** the string `<host>:<port>` — then print `banner("10.10.10.5")` and `banner("10.10.10.5", 8080)` on two lines.',
      starter: 'def banner(host, port=22):\n    \n\n',
      solution:
        'def banner(host, port=22):\n    return f"{host}:{port}"\n\nprint(banner("10.10.10.5"))\nprint(banner("10.10.10.5", 8080))',
      hints: ['Use return, not print, inside the function.', 'return f"{host}:{port}"'],
      check: ({ code, result, h }) => {
        if (!/def\s+banner\s*\(/.test(code)) return { pass: false, message: 'Define a function called banner.' };
        if (!/return/.test(code)) return { pass: false, message: 'The function must RETURN the string, not print it.' };
        const lines = h.lines(result.stdout);
        return JSON.stringify(lines) === JSON.stringify(['10.10.10.5:22', '10.10.10.5:8080'])
          ? { pass: true, message: 'A default that the caller can override — the most useful three characters in a signature.' }
          : { pass: false, message: `Expected "10.10.10.5:22" then "10.10.10.5:8080". Got: ${lines.join(' | ')}` };
      },
    },
    {
      id: 'filter-fn',
      kind: 'python',
      prompt:
        'Write a function `open_ports(results)` that takes a list of dicts like `{"port": 22, "state": "open"}` and returns a list of the port numbers whose state is `"open"`. Test it by printing `open_ports([{"port": 22, "state": "open"}, {"port": 80, "state": "closed"}])` — expected `[22]`.',
      starter: 'def open_ports(results):\n    \n\n',
      solution:
        'def open_ports(results):\n    return [r["port"] for r in results if r["state"] == "open"]\n\nprint(open_ports([{"port": 22, "state": "open"}, {"port": 80, "state": "closed"}]))',
      hints: ['You already wrote the comprehension last lesson — wrap it in a def and return it.'],
      check: ({ code, result }) => {
        if (!/def\s+open_ports\s*\(/.test(code)) return { pass: false, message: 'Define a function called open_ports.' };
        return result.stdout.trim() === '[22]'
          ? { pass: true, message: 'Now it has a name and can be reused and tested. That is the whole point.' }
          : { pass: false, message: `Expected [22], got: ${result.stdout.trim()}` };
      },
    },
    {
      id: 'mutable-quiz',
      kind: 'quiz',
      prompt: 'What does the second call print?\n\n```python\ndef add(x, bucket=[]):\n    bucket.append(x)\n    return bucket\n\nprint(add(1))\nprint(add(2))\n```',
      choices: ['[1] then [2]', '[1] then [1, 2]', '[1, 2] then [1, 2]', 'TypeError'],
      answer: 1,
      explain:
        'The default value is evaluated once, when the `def` line runs — not on each call. So every call without an explicit bucket shares one list, which accumulates. The fix is `bucket=None` plus `if bucket is None: bucket = []` inside, which creates a fresh list per call.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'files-errors',
  title: 'Files and error handling',
  minutes: 16,
  body: `
## Reading files the right way

    with open("lab/logs/auth.log") as f:
        contents = f.read()

The \`with\` block closes the file for you — even if the code inside raises an
exception. Without it, a crash leaves the file handle open, and a loop that opens
thousands of files without closing them eventually hits the OS limit and fails in
a way that looks unrelated to the real bug. Always use \`with\`.

    f.read()             the whole thing as one string
    f.readlines()        a list of lines (each still ends with \\n)
    for line in f:       stream one line at a time — works on a 10GB file

That last form matters. \`.read()\` on a huge log loads it all into RAM; iterating
the file object reads a buffer at a time and stays flat.

    line.strip()         remove leading/trailing whitespace INCLUDING the newline
    line.split()         split on any whitespace -> list of fields
    line.split(",")      split on commas
    "x" in line          substring test — this is your grep

## Writing

    with open("out.txt", "w") as f:     # "w" TRUNCATES an existing file
        f.write("hello\\n")             # write() does NOT add a newline

    with open("out.txt", "a") as f:     # "a" appends
        f.write("another line\\n")

\`"w"\` and \`"a"\` map exactly onto \`>\` and \`>>\` from the shell. Same trap, too:
\`"w"\` silently destroys what was there.

## pathlib, the modern way to handle paths

    from pathlib import Path

    p = Path("lab") / "logs" / "auth.log"      # the / operator joins paths
    p.exists()
    p.name          "auth.log"
    p.suffix        ".log"
    p.read_text()   whole file as a string, no with-block needed
    Path("lab").glob("**/*.log")               every .log at any depth

\`Path("lab") / "logs"\` builds the right separator for the OS, which is why you
should never build paths with \`"lab" + "/" + "logs"\`.

## Exceptions: the program says no

    try:
        with open("nope.txt") as f:
            data = f.read()
    except FileNotFoundError:
        print("that file is not there")
    except PermissionError:
        print("it exists but you cannot read it")
    else:
        print("worked — this runs only if no exception happened")
    finally:
        print("this runs no matter what")

Catch **specific** exceptions. A bare \`except:\` swallows everything including
your own typos and Ctrl-C, and turns a five-second bug into an afternoon.

    ValueError          int("abc")
    KeyError            d["missing"]
    IndexError          lst[99]
    TypeError           "a" + 1
    FileNotFoundError   open("nope")
    ZeroDivisionError   1 / 0

## Raising your own

    if port < 1 or port > 65535:
        raise ValueError(f"port out of range: {port}")

Failing loudly and early beats returning None and letting the caller discover the
problem three functions later. This is the Python spelling of \`set -e\` and
\`exit 1\` from the bash lesson: a program that cannot do its job should say so.
`,
  exercises: [
    {
      id: 'read-log',
      kind: 'python',
      prompt:
        'Open `lab/logs/auth.log`, count how many lines contain the text `Failed password`, and print just that number. (Use a `with` block.)',
      starter: 'count = 0\nwith open("lab/logs/auth.log") as f:\n    ',
      solution:
        'count = 0\nwith open("lab/logs/auth.log") as f:\n    for line in f:\n        if "Failed password" in line:\n            count += 1\nprint(count)',
      hints: [
        'Iterate the file object directly: for line in f:',
        '"Failed password" in line is your grep.',
      ],
      check: ({ code, result }) => {
        if (!/with\s+open/.test(code)) return { pass: false, message: 'Use a `with open(...)` block so the file gets closed.' };
        return result.stdout.trim() === '5'
          ? { pass: true, message: 'Same answer `grep -c` gave you — but now you can also act on each match.' }
          : { pass: false, message: `Expected 5, got: ${result.stdout.trim()}` };
      },
    },
    {
      id: 'extract-ips',
      kind: 'python',
      prompt:
        'From `lab/logs/auth.log`, collect the **unique** IPs that appear after the word `from` on lines containing `Failed password`, then print them sorted, one per line. (Expect `10.10.10.42` then `10.10.10.99`.)',
      starter: 'ips = set()\nwith open("lab/logs/auth.log") as f:\n    ',
      solution:
        'ips = set()\nwith open("lab/logs/auth.log") as f:\n    for line in f:\n        if "Failed password" in line:\n            parts = line.split()\n            ips.add(parts[parts.index("from") + 1])\nfor ip in sorted(ips):\n    print(ip)',
      hints: [
        'line.split() gives you the words as a list.',
        'parts.index("from") tells you where the word "from" is; the IP is the next item.',
        'Use a set so duplicates collapse, then sorted() to order them.',
      ],
      check: ({ result, h }) => {
        const lines = h.lines(result.stdout);
        return JSON.stringify(lines) === JSON.stringify(['10.10.10.42', '10.10.10.99'])
          ? { pass: true, message: 'A four-stage shell pipeline, now in a form you can extend with logic the pipeline could never express.' }
          : { pass: false, message: `Expected 10.10.10.42 then 10.10.10.99. Got: ${lines.join(' | ')}` };
      },
    },
    {
      id: 'try-except',
      kind: 'python',
      prompt:
        'Write code that tries to open `lab/does-not-exist.txt` and, instead of crashing, prints exactly `missing file`. Catch the specific exception, not a bare except.',
      starter: 'try:\n    ',
      solution:
        'try:\n    with open("lab/does-not-exist.txt") as f:\n        f.read()\nexcept FileNotFoundError:\n    print("missing file")',
      hints: ['The exception is FileNotFoundError.'],
      check: ({ code, result }) => {
        if (/except\s*:/.test(code)) return { pass: false, message: 'Catch FileNotFoundError specifically — a bare `except:` hides your own bugs too.' };
        if (!/FileNotFoundError/.test(code)) return { pass: false, message: 'Catch FileNotFoundError by name.' };
        return result.stdout.trim() === 'missing file' && result.exitCode === 0
          ? { pass: true, message: 'Handled, not crashed — and only this one failure mode is handled, which is the point.' }
          : { pass: false, message: `Expected the program to print "missing file" and exit cleanly. Got: ${result.stdout.trim()} ${result.stderr.slice(0, 120)}` };
      },
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'modules-venv',
  title: 'Modules, the standard library, and virtual environments',
  minutes: 16,
  body: `
## Importing

    import os
    import json
    from pathlib import Path
    from collections import Counter
    import socket as sock          # alias

\`import x\` gives you \`x.thing\`. \`from x import thing\` puts \`thing\` straight into
your namespace. Prefer the first for anything unfamiliar — \`json.loads(...)\` tells
the reader where it came from; a bare \`loads(...)\` does not.

## Standard library worth knowing today

    os / os.path        environment variables, process bits
    pathlib             modern paths (previous lesson)
    sys                 sys.argv, sys.exit(), sys.stderr
    json                json.loads(text) / json.dumps(obj, indent=2)
    re                  regular expressions
    socket              raw TCP — this is how a port scanner works
    subprocess          run other programs
    argparse            proper command line interfaces
    collections         Counter, defaultdict
    datetime            timestamps
    ipaddress           parse and iterate networks, correctly

Two that will save you real time:

    from collections import Counter
    Counter(all_ips).most_common(3)     # the top-3 offenders, in one line

    import ipaddress
    for ip in ipaddress.ip_network("10.10.10.0/29"):
        print(ip)                        # never do CIDR maths by hand again

    import re
    re.findall(r"\\d+\\.\\d+\\.\\d+\\.\\d+", text)     # every IP in any text

The \`r"..."\` is a raw string: backslashes stay literal instead of being treated as
escapes. Always use it for regex patterns.

## subprocess: calling your Linux tools from Python

    import subprocess
    out = subprocess.run(["ip", "-br", "a"], capture_output=True, text=True)
    print(out.stdout)

Pass a **list** of arguments, not one string, and never \`shell=True\` with anything
a user supplied — that is command injection, the same class of bug you will one
day be paid to find.

## __name__ == "__main__"

    def main():
        print("working")

    if __name__ == "__main__":
        main()

When you run a file directly, Python sets \`__name__\` to \`"__main__"\`. When someone
*imports* it, \`__name__\` is the module's name instead. So this guard means "only
do the work if I am the program being run, not if I am being imported" — which is
what lets one file be both a tool and a reusable library.

## argparse: stop parsing sys.argv by hand

    import argparse

    parser = argparse.ArgumentParser(description="Tiny port scanner")
    parser.add_argument("host")
    parser.add_argument("-p", "--ports", default="22,80,443")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    print(args.host, args.ports, args.verbose)

You get \`--help\`, type checking and error messages for free. Ten lines of
hand-written \`sys.argv\` handling never gets you that.

## Virtual environments — and why Kali refuses \`pip install\`

Your system Python belongs to apt. When pip writes into it, apt's idea of what is
installed and reality drift apart, and eventually something in the desktop stack
breaks. Debian and Kali now block it outright with an "externally-managed-
environment" error.

The answer is one directory per project:

    python3 -m venv .venv          # create it
    source .venv/bin/activate      # switch this shell into it
    pip install requests           # goes into .venv, not the system
    deactivate                     # step back out

\`pip freeze > requirements.txt\` records exactly what you installed;
\`pip install -r requirements.txt\` rebuilds it on another machine. Add \`.venv/\` to
\`.gitignore\` — you commit the recipe, not the ingredients.

For *tools* rather than projects (like a CLI you want on your PATH everywhere),
use \`pipx install <tool>\`, which makes the venv for you and links the binary.
`,
  exercises: [
    {
      id: 'counter',
      kind: 'python',
      prompt:
        'Use `collections.Counter` on `ips = ["a", "b", "a", "c", "a", "b"]` to print the two most common values with their counts. Expected: `[(\'a\', 3), (\'b\', 2)]`',
      starter: 'from collections import Counter\n\nips = ["a", "b", "a", "c", "a", "b"]\n',
      solution:
        'from collections import Counter\n\nips = ["a", "b", "a", "c", "a", "b"]\nprint(Counter(ips).most_common(2))',
      hints: ['Counter(list).most_common(n)'],
      check: ({ code, result }) => {
        if (!/Counter/.test(code)) return { pass: false, message: 'Use Counter from collections.' };
        return result.stdout.trim() === "[('a', 3), ('b', 2)]"
          ? { pass: true, message: 'That replaced the whole count-then-sort dict dance from two lessons ago.' }
          : { pass: false, message: `Expected [('a', 3), ('b', 2)], got: ${result.stdout.trim()}` };
      },
    },
    {
      id: 'regex-ips',
      kind: 'python',
      prompt:
        'Use the `re` module to find every IPv4 address in `lab/logs/access.log` and print the number of **unique** ones. (Expected: `2`)',
      starter: 'import re\n\n',
      solution:
        'import re\n\ntext = open("lab/logs/access.log").read()\nfound = re.findall(r"\\d+\\.\\d+\\.\\d+\\.\\d+", text)\nprint(len(set(found)))',
      hints: [
        're.findall(pattern, text) returns every match as a list.',
        'Pattern: r"\\d+\\.\\d+\\.\\d+\\.\\d+" — \\d is a digit, \\. is a literal dot.',
        'set() de-duplicates, len() counts.',
      ],
      check: ({ code, result }) => {
        if (!/\bre\b/.test(code)) return { pass: false, message: 'This one wants the re module.' };
        return result.stdout.trim() === '2'
          ? { pass: true, message: 'One regex replaced grep -oE. Note the r"" prefix — without it the backslashes get eaten.' }
          : { pass: false, message: `Expected 2, got: ${result.stdout.trim()}` };
      },
    },
    {
      id: 'main-quiz',
      kind: 'quiz',
      prompt: 'Why wrap your entry point in `if __name__ == "__main__":`?',
      choices: [
        'It makes the script run faster',
        'So the file can be imported as a library without executing its top-level work',
        'It is required for any script with functions',
        'It enables argparse',
      ],
      answer: 1,
      explain:
        'Importing a module runs every top-level statement in it. Without the guard, `import myscanner` would immediately start scanning. With it, the work only happens when the file is the one being executed — so the same file serves as both a command-line tool and a library other code can import.',
    },
    {
      id: 'venv-quiz',
      kind: 'quiz',
      prompt: 'Kali refuses `sudo pip install requests` with "externally-managed-environment". Why is that protection, not obstruction?',
      choices: [
        'pip is deprecated in favour of apt',
        'pip writing into the apt-managed system Python can overwrite files apt owns and break system tools that depend on it',
        'requests is not available on pip',
        'It only applies when running as root',
      ],
      answer: 1,
      explain:
        'Your desktop, your package manager and several Kali tools all run on the system Python. pip has no knowledge of apt, so it will happily replace a library apt installed with an incompatible version, and apt will have no idea. Per-project venvs (or pipx for tools) keep your installs in a directory nothing else depends on.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'classes',
  title: 'Classes, when you actually need them',
  minutes: 14,
  body: `
## The honest framing

You do not need classes for most scripts. A function that takes data and returns
data is simpler, easier to test, and easier to read. Reach for a class when you
have **state and behaviour that belong together** and you want several independent
copies of it.

A scanner holding a target, a timeout, and a growing list of results is a good
class. A function that formats a string is not.

## The shape

    class Host:
        def __init__(self, ip, os_guess="unknown"):
            self.ip = ip
            self.os_guess = os_guess
            self.open_ports = []

        def add_port(self, port):
            self.open_ports.append(port)

        def summary(self):
            return f"{self.ip} ({self.os_guess}): {len(self.open_ports)} open"

    h = Host("10.10.10.5", "linux")
    h.add_port(22)
    print(h.summary())

- \`class\` names use CapWords by convention.
- \`__init__\` runs when you create an instance. It is a constructor, not a
  "new" — the object already exists; \`__init__\` fills it in.
- \`self\` is the instance, and it is the **explicit first parameter of every
  method**. Python passes it for you when you call \`h.add_port(22)\`; you never
  pass it yourself. Forgetting to write \`self\` in the definition is the single
  most common class-related error.
- Attributes live on \`self\`, so each \`Host\` has its own \`open_ports\`.

## Dunder methods make your class behave like a built-in

    class Host:
        def __init__(self, ip):
            self.ip = ip

        def __repr__(self):
            return f"Host({self.ip!r})"       # what the REPL and print(list) show

        def __eq__(self, other):
            return self.ip == other.ip        # makes == meaningful

        def __len__(self):
            return len(self.open_ports)       # makes len(host) work

Define \`__repr__\` on every class you write. Without it, printing a list of hosts
gives you \`[<__main__.Host object at 0x7f...>]\`, which tells you nothing at the
exact moment you need information.

## Inheritance, sparingly

    class WindowsHost(Host):
        def __init__(self, ip):
            super().__init__(ip)
            self.os_guess = "windows"

\`super()\` calls the parent's version. Inheritance is genuinely useful for
"is-a" relationships and genuinely overused everywhere else. If you find yourself
four levels deep, the answer was probably a plain function taking a parameter.

## dataclasses: the 80% case, with none of the boilerplate

    from dataclasses import dataclass, field

    @dataclass
    class Host:
        ip: str
        os_guess: str = "unknown"
        open_ports: list = field(default_factory=list)

    h = Host("10.10.10.5")
    print(h)        # Host(ip='10.10.10.5', os_guess='unknown', open_ports=[])

That gives you \`__init__\`, \`__repr__\` and \`__eq__\` for free. Note
\`field(default_factory=list)\` — it exists precisely to dodge the mutable-default
trap you met in the functions lesson. For "a bundle of related values", a
dataclass is almost always the right call.
`,
  exercises: [
    {
      id: 'first-class',
      kind: 'python',
      prompt:
        'Write a class `Host` with `__init__(self, ip)` that stores `ip` and an empty list `open_ports`. Add a method `add_port(self, port)` and a method `summary(self)` returning `"<ip>: <n> open"`. Then create `Host("10.10.10.5")`, add ports 22 and 80, and print the summary. Expected: `10.10.10.5: 2 open`',
      starter: 'class Host:\n    def __init__(self, ip):\n        \n',
      solution:
        'class Host:\n    def __init__(self, ip):\n        self.ip = ip\n        self.open_ports = []\n\n    def add_port(self, port):\n        self.open_ports.append(port)\n\n    def summary(self):\n        return f"{self.ip}: {len(self.open_ports)} open"\n\nh = Host("10.10.10.5")\nh.add_port(22)\nh.add_port(80)\nprint(h.summary())',
      hints: [
        'Every method needs self as its first parameter.',
        'Store state as self.ip and self.open_ports inside __init__.',
        'len(self.open_ports) gives the count.',
      ],
      check: ({ code, result }) => {
        if (!/class\s+Host/.test(code)) return { pass: false, message: 'Define a class called Host.' };
        return result.stdout.trim() === '10.10.10.5: 2 open'
          ? { pass: true, message: 'State and the behaviour that acts on it, bundled. That is the entire idea.' }
          : { pass: false, message: `Expected "10.10.10.5: 2 open", got: ${result.stdout.trim()}` };
      },
    },
    {
      id: 'dataclass',
      kind: 'python',
      prompt:
        'Rewrite it as a `@dataclass` named `Finding` with fields `port: int` and `service: str = "unknown"`. Create `Finding(22, "ssh")` and print it. Expected: `Finding(port=22, service=\'ssh\')`',
      starter: 'from dataclasses import dataclass\n\n@dataclass\nclass Finding:\n    ',
      solution:
        'from dataclasses import dataclass\n\n@dataclass\nclass Finding:\n    port: int\n    service: str = "unknown"\n\nprint(Finding(22, "ssh"))',
      hints: ['Fields are declared as annotations under the class line, no __init__ needed.'],
      check: ({ code, result }) => {
        if (!/@dataclass/.test(code)) return { pass: false, message: 'Use the @dataclass decorator.' };
        return result.stdout.trim() === "Finding(port=22, service='ssh')"
          ? { pass: true, message: 'Three lines gave you __init__, __repr__ and __eq__.' }
          : { pass: false, message: `Expected Finding(port=22, service='ssh'), got: ${result.stdout.trim()}` };
      },
    },
    {
      id: 'self-quiz',
      kind: 'quiz',
      prompt: 'What is `self`?',
      choices: [
        'A keyword like `this` that Python provides automatically',
        'The instance the method was called on, passed explicitly as the first parameter',
        'A reference to the class itself',
        'Optional syntax you can omit',
      ],
      answer: 1,
      explain:
        'Unlike `this` in JavaScript, `self` is an ordinary parameter — Python just fills it in for you when you call `obj.method()`, which is literally shorthand for `Class.method(obj)`. The name `self` is convention, not syntax, but never rename it. And because it is a real parameter, omitting it from the definition produces the very common "takes 0 positional arguments but 1 was given" error.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'project-triage',
  title: 'Project: a log triage tool',
  minutes: 25,
  body: `
## The brief

Write a real tool that reads an SSH auth log and reports brute-force sources. This
pulls together every previous lesson: files, dicts, sets, functions, sorting,
f-strings, and the \`__main__\` guard.

You already solved the small version with a shell pipeline. The Python version
earns its keep the moment you want a threshold, a JSON output mode, or a lookup
against a blocklist — none of which fit in a pipeline.

## The target output

Given the lab's \`auth.log\`, the tool should print:

    [!] 10.10.10.99  4 failed
    [!] 10.10.10.42  1 failed
    2 unique sources, 5 total failures

Sorted by count, highest first.

## How to build it (do this in the editor, step by step)

1. A function \`parse_failures(path)\` that opens the file and returns a list of the
   IPs that follow \`from\` on lines containing \`Failed password\`.
2. A function \`rank(ips)\` that returns a list of \`(ip, count)\` tuples, highest
   count first. \`Counter(...).most_common()\` does it in one call.
3. A \`main()\` that calls both, prints each line in the format above, then the
   summary line.
4. The \`if __name__ == "__main__": main()\` guard at the bottom.

Keeping parsing and ranking in separate functions is not ceremony: it means you
can point \`parse_failures\` at a different log format later without touching the
ranking, and you can test each half on its own.

## Where to take it afterwards (on your own machine)

- Add \`argparse\` so the log path and a \`--threshold\` are command-line options.
- Add \`--json\` and print \`json.dumps(results, indent=2)\` instead.
- Point it at your real \`/var/log/auth.log\`.
- Have it emit ready-to-paste \`iptables\` or \`ufw\` deny rules for anything over the
  threshold.

That last one is where a learning exercise turns into something you actually run.
`,
  exercises: [
    {
      id: 'triage-tool',
      kind: 'python',
      prompt:
        'Build the tool described above against `lab/logs/auth.log`. Print one `[!] <ip>  <n> failed` line per source (highest count first, two spaces before the count), then `2 unique sources, 5 total failures`.',
      starter: `from collections import Counter


def parse_failures(path):
    ips = []
    # open the file, keep lines containing "Failed password",
    # and append the word after "from"
    return ips


def rank(ips):
    return Counter(ips).most_common()


def main():
    ips = parse_failures("lab/logs/auth.log")
    # print one line per source, then the summary


if __name__ == "__main__":
    main()
`,
      solution: `from collections import Counter


def parse_failures(path):
    ips = []
    with open(path) as f:
        for line in f:
            if "Failed password" in line:
                parts = line.split()
                ips.append(parts[parts.index("from") + 1])
    return ips


def rank(ips):
    return Counter(ips).most_common()


def main():
    ips = parse_failures("lab/logs/auth.log")
    ranked = rank(ips)
    for ip, count in ranked:
        print(f"[!] {ip}  {count} failed")
    print(f"{len(ranked)} unique sources, {len(ips)} total failures")


if __name__ == "__main__":
    main()
`,
      hints: [
        'parse_failures: the same split()/index("from") trick from the files lesson, appending to a list (not a set — you need the duplicates to count them).',
        'rank: Counter(ips).most_common() already returns (ip, count) sorted highest first.',
        'main: `for ip, count in ranked:` unpacks each tuple. The summary uses len(ranked) and len(ips).',
      ],
      check: ({ code, result, h }) => {
        if (!/def\s+parse_failures/.test(code) || !/def\s+main/.test(code))
          return { pass: false, message: 'Keep the parse_failures() and main() functions — the structure is part of the exercise.' };
        if (!/__main__/.test(code)) return { pass: false, message: 'Keep the if __name__ == "__main__": guard.' };
        const lines = h.lines(result.stdout);
        const want = ['[!] 10.10.10.99  4 failed', '[!] 10.10.10.42  1 failed', '2 unique sources, 5 total failures'];
        if (lines.length !== 3) return { pass: false, message: `Expected 3 lines of output, got ${lines.length}.` };
        const bad = want.findIndex((w, i) => lines[i] !== w);
        return bad === -1
          ? { pass: true, message: 'That is a genuine tool. Point it at /var/log/auth.log on a real box and it works unchanged.' }
          : { pass: false, message: `Line ${bad + 1} should be "${want[bad]}" — got "${lines[bad]}". (Two spaces before the count.)` };
      },
    },
  ],
},

  ],
};
