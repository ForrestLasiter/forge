# Curriculum

<!-- GENERATED FILE — edit the lesson files, then run `npm run docs`. -->

**5 tracks · 35 lessons · 108 graded exercises · ~10 hours of reading** (plus however long the exercises take you, which is the part that matters).

Exercise kinds: 37 quiz · 17 terminal · 17 python · 13 node · 12 react · 12 powershell

The tracks are ordered deliberately. The Linux shell first, because everything
else runs on it, with PowerShell alongside it as the cross-platform counterpart.
Python next, because most of the tooling around you is written in it. Then
JavaScript, because React needs it. Then React. You can jump around, but later
tracks assume the earlier ones.

The shell, PowerShell, Python and Node tracks share one dataset — a small fake
SSH auth log in your workspace. You solve the same log-triage problem four ways.
Seeing one problem in four languages is the fastest way to tell what is
*language* and what is *programming*. Forge runs on Windows and Linux, and so do
both shells — PowerShell 7 on Linux, bash on Windows via Git for Windows.

---

## Kali & the Linux command line

*The shell, the filesystem, permissions, processes, networking and your first bash scripts.*

8 lessons · 28 exercises · ~116 minutes of reading

| # | Lesson | Exercises | Covers |
|---|---|---|---|
| 01 | **Orientation: what the shell actually is** | 2 terminal, 1 quiz | When you open a terminal on Kali you are not "opening Linux". |
| 02 | **Reading, creating and destroying files** | 3 terminal, 1 quiz | cat is for short files. |
| 03 | **grep, find and the pipe: turning noise into answers** | 3 terminal, 1 quiz | The pipe connects A's stdout directly to B's stdin. |
| 04 | **Users, permissions and sudo** | 1 terminal, 2 quiz | ls -l starts each line with something like -rwxr-xr--. |
| 05 | **Processes and services** | 2 terminal, 2 quiz | A program is a file on disk. |
| 06 | **Networking from the command line** | 3 terminal, 1 quiz | ifconfig is what the old tutorials show. |
| 07 | **Packages, updates and keeping Kali healthy** | 2 quiz, 1 terminal | update and upgrade sound like synonyms and are not. |
| 08 | **Your first bash scripts** | 2 terminal, 1 quiz | A shell script is a text file of commands the shell reads instead of your |

<details><summary>Every exercise in this track</summary>

**Orientation: what the shell actually is**

- `pwd` *(terminal)* — Print the directory you are currently standing in. (One command.)
- `ls-la` *(terminal)* — List the contents of the `lab` directory in long format, including hidden files.
- `path-quiz` *(quiz)* — You are in `/home/anon/Documents`. Which command gets you to `/home/anon/lab`?

**Reading, creating and destroying files**

- `cat-log` *(terminal)* — Display the contents of `lab/logs/auth.log`.
- `tail-three` *(terminal)* — Show only the **last 3 lines** of `lab/logs/auth.log`.
- `make-and-write` *(terminal)* — In one submission: create the directory `lab/recon` (creating parents if needed), then write the single line `10.10.10.99` into a new file `lab/recon/suspect…
- `redirect-quiz` *(quiz)* — What is the difference between `nmap 10.10.10.0/24 > scan.txt` and `nmap 10.10.10.0/24 >> scan.txt`?

**grep, find and the pipe: turning noise into answers**

- `count-failed` *(terminal)* — Count how many lines in `lab/logs/auth.log` contain the text `Failed password`. Print just the number.
- `find-logs` *(terminal)* — Find every file under `lab` whose name ends in `.log`.
- `unique-attackers` *(terminal)* — Build a pipeline that prints the **unique IP addresses that failed a password** in `lab/logs/auth.log` — one per line, nothing else. (Two addresses, in any o…
- `uniq-quiz` *(quiz)* — Why does `uniq -c` almost always need a `sort` in front of it?

**Users, permissions and sudo**

- `chmod-700` *(terminal)* — Create a file `lab/recon/keys.txt`, then set its permissions so **only the owner** can read and write it, and nobody can execute it.
- `octal-quiz` *(quiz)* — A shell script shows as `-rw-r--r--`. You run `./script.sh` and get "Permission denied". What is wrong?
- `suid-quiz` *(quiz)* — Why do pentesters run `find / -perm -4000 -type f 2>/dev/null` early on a compromised box?

**Processes and services**

- `ps-self` *(terminal)* — Print the PID of the shell that is running your command, and nothing else. (`$$` holds it.)
- `ps-count` *(terminal)* — Use `ps` and a pipe to print how many processes are currently running on this machine.
- `signal-quiz` *(quiz)* — A capture is writing to a .pcap file. Why should you `kill` it rather than `kill -9`?
- `systemd-quiz` *(quiz)* — You ran `sudo systemctl start ssh` and SSH works. After a reboot it is dead again. Why?

**Networking from the command line**

- `resolv` *(terminal)* — Show which DNS resolver(s) this machine is configured to use.
- `ip-brief` *(terminal)* — List this machine's network interfaces and addresses in the brief one-line-per-interface format.
- `client-ips` *(terminal)* — From `lab/logs/access.log`, print each unique client IP **prefixed by how many requests it made**, most active first. (The IP is the first field of every line.)
- `dns-quiz` *(quiz)* — `ping 1.1.1.1` works. `ping google.com` says "Name or service not known". What is broken?

**Packages, updates and keeping Kali healthy**

- `apt-quiz-1` *(quiz)* — What does `sudo apt update` actually do?
- `apt-quiz-2` *(quiz)* — Why is `full-upgrade` recommended over `upgrade` specifically on Kali?
- `disk-check` *(terminal)* — Show disk usage for all mounted filesystems in human-readable units (GB/MB rather than blocks).

**Your first bash scripts**

- `write-script` *(terminal)* — Create an executable script at `lab/recon/hello.sh` that has a proper bash shebang and prints exactly `forge ready`. Then run it, so `forge ready` appears in…
- `loop-targets` *(terminal)* — Loop over every line in `lab/configs/targets.txt` and print `Scanning <ip>` for each one (5 lines of output).
- `set-e-quiz` *(quiz)* — What does `set -e` at the top of a script do, and why does it matter?

</details>

---

## Python from zero

*Syntax, data structures, functions, files, errors, modules and a real log-parsing tool.*

8 lessons · 24 exercises · ~133 minutes of reading

| # | Lesson | Exercises | Covers |
|---|---|---|---|
| 01 | **Values, variables and printing** | 2 python, 1 quiz | Python is already installed on Kali and most of the tooling around you is written |
| 02 | **Decisions and loops** | 2 python, 1 quiz | Python has no braces. |
| 03 | **Lists, dicts, sets and comprehensions** | 3 python, 1 quiz | Indexing starts at 0, and negatives count from the end: |
| 04 | **Functions** | 2 python, 1 quiz | A function is a name for a piece of behaviour. |
| 05 | **Files and error handling** | 3 python | The with block closes the file for you — even if the code inside raises an |
| 06 | **Modules, the standard library, and virtual environments** | 2 python, 2 quiz | import x gives you x.thing. |
| 07 | **Classes, when you actually need them** | 2 python, 1 quiz | You do not need classes for most scripts. |
| 08 | **Project: a log triage tool** | 1 python | Write a real tool that reads an SSH auth log and reports brute-force sources. |

<details><summary>Every exercise in this track</summary>

**Values, variables and printing**

- `hello` *(python)* — Print exactly: `forge online`
- `fstring` *(python)* — Make two variables — `host` set to `"10.10.10.5"` and `port` set to the number `22` — then use a single f-string to print `Scanning 10.10.10.5 on port 22`.
- `alias-quiz` *(quiz)* — What does this print? ```python a = [1, 2] b = a b.append(3) print(a) ```

**Decisions and loops**

- `fizz-ports` *(python)* — Loop over the numbers 1 through 5 inclusive. For each one print `port <n>: closed`, except for 3, where you print `port 3: OPEN`.
- `countdown` *(python)* — Using a `while` loop, count down from 3 to 1, printing each number on its own line, then print `go`.
- `range-quiz` *(quiz)* — How many numbers does `range(2, 10, 3)` produce, and what are they?

**Lists, dicts, sets and comprehensions**

- `list-basics` *(python)* — Start with `ports = [22, 80, 443]`. Append `8080`, then print the list length on one line and the **last** element on the next.
- `count-dict` *(python)* — Given `ips = ["10.0.0.1", "10.0.0.2", "10.0.0.1", "10.0.0.1"]`, build a dict counting how many times each appears, then print it. Expected output: `{'10.0.0.…
- `comprehension` *(python)* — Given `results = [{"port": 22, "state": "open"}, {"port": 80, "state": "closed"}, {"port": 443, "state": "open"}]`, use a **list comprehension** to build a l…
- `set-quiz` *(quiz)* — You scanned a subnet yesterday and today. Which expression gives you the hosts that appeared today but were not there yesterday?

**Functions**

- `define-fn` *(python)* — Write a function `banner(host, port=22)` that **returns** the string `<host>:<port>` — then print `banner("10.10.10.5")` and `banner("10.10.10.5", 8080)` on …
- `filter-fn` *(python)* — Write a function `open_ports(results)` that takes a list of dicts like `{"port": 22, "state": "open"}` and returns a list of the port numbers whose state is …
- `mutable-quiz` *(quiz)* — What does the second call print? ```python def add(x, bucket=[]): bucket.append(x) return bucket print(add(1)) print(add(2)) ```

**Files and error handling**

- `read-log` *(python)* — Open `lab/logs/auth.log`, count how many lines contain the text `Failed password`, and print just that number. (Use a `with` block.)
- `extract-ips` *(python)* — From `lab/logs/auth.log`, collect the **unique** IPs that appear after the word `from` on lines containing `Failed password`, then print them sorted, one per…
- `try-except` *(python)* — Write code that tries to open `lab/does-not-exist.txt` and, instead of crashing, prints exactly `missing file`. Catch the specific exception, not a bare except.

**Modules, the standard library, and virtual environments**

- `counter` *(python)* — Use `collections.Counter` on `ips = ["a", "b", "a", "c", "a", "b"]` to print the two most common values with their counts. Expected: `[('a', 3), ('b', 2)]`
- `regex-ips` *(python)* — Use the `re` module to find every IPv4 address in `lab/logs/access.log` and print the number of **unique** ones. (Expected: `2`)
- `main-quiz` *(quiz)* — Why wrap your entry point in `if __name__ == "__main__":`?
- `venv-quiz` *(quiz)* — Kali refuses `sudo pip install requests` with "externally-managed-environment". Why is that protection, not obstruction?

**Classes, when you actually need them**

- `first-class` *(python)* — Write a class `Host` with `__init__(self, ip)` that stores `ip` and an empty list `open_ports`. Add a method `add_port(self, port)` and a method `summary(sel…
- `dataclass` *(python)* — Rewrite it as a `@dataclass` named `Finding` with fields `port: int` and `service: str = "unknown"`. Create `Finding(22, "ssh")` and print it. Expected: `Fin…
- `self-quiz` *(quiz)* — What is `self`?

**Project: a log triage tool**

- `triage-tool` *(python)* — Build the tool described above against `lab/logs/auth.log`. Print one `[!] <ip> <n> failed` line per source (highest count first, two spaces before the count…

</details>

---

## JavaScript & Node

*The language, arrays and objects, async/await, the Node runtime, npm, and an HTTP API.*

7 lessons · 21 exercises · ~122 minutes of reading

| # | Lesson | Exercises | Covers |
|---|---|---|---|
| 01 | **JavaScript: the language itself** | 3 node, 1 quiz | JavaScript began as the language inside a web browser. |
| 02 | **Arrays, objects and the methods that matter** | 3 node, 1 quiz | These replace most loops you would otherwise write, and they are everywhere in |
| 03 | **Asynchronous JavaScript** | 2 node, 1 quiz | JavaScript runs your code on a single thread. |
| 04 | **The Node runtime: files, paths and processes** | 2 node, 1 quiz | Node decides which one a .js file is by looking at "type" in the nearest |
| 05 | **npm, package.json and dependencies** | 3 quiz | npm run dev runs whatever that script says. |
| 06 | **Building an HTTP API** | 2 node, 1 quiz | A program that listens on a TCP port, reads a request, and writes a response. |
| 07 | **Project: the same triage tool in Node** | 1 node | You wrote this tool in Python two tracks ago. |

<details><summary>Every exercise in this track</summary>

**JavaScript: the language itself**

- `hello-node` *(node)* — Print exactly: `forge online`
- `template-literal` *(node)* — Declare `host` as `"10.10.10.5"` and `port` as `22` using `const`, then use a template literal to log `Scanning 10.10.10.5 on port 22`.
- `arrow-fn` *(node)* — Write an arrow function `banner` taking `host` and `port` (defaulting to 22) that **returns** `"<host>:<port>"`. Log `banner("10.10.10.5")` then `banner("10.…
- `equality-quiz` *(quiz)* — What does `"0" == 0` evaluate to, and `"0" === 0`?

**Arrays, objects and the methods that matter**

- `map-filter` *(node)* — Given `results = [{port: 22, state: "open"}, {port: 80, state: "closed"}, {port: 443, state: "open"}]`, log an array of just the open port numbers. Expected:…
- `reduce-tally` *(node)* — Given `ips = ["a", "b", "a", "c", "a"]`, use `reduce` to build a tally object and log it. Expected: `{ a: 3, b: 1, c: 1 }`
- `spread-update` *(node)* — Given `const host = { ip: "10.0.0.1", os: "linux" };` create a **new** object `updated` that is the same but with `os` set to `"windows"`, without modifying …
- `sort-quiz` *(quiz)* — What does `[10, 9, 100].sort()` return?

**Asynchronous JavaScript**

- `await-basic` *(node)* — Write a `sleep(ms)` helper that returns a Promise, then in an async `main()` log `start`, await a 50ms sleep, and log `end`. Call `main()`.
- `promise-all` *(node)* — Write `async function check(port)` that awaits a 30ms sleep and returns `` `port ${port} checked` ``. Use `Promise.all` to run it for ports 22, 80 and 443 **…
- `pending-quiz` *(quiz)* — Your code logs `Promise { <pending> }` instead of the data. What happened?

**The Node runtime: files, paths and processes**

- `read-file-node` *(node)* — Read `lab/logs/auth.log` and log how many lines contain `Failed password`. (Expected: `5`)
- `path-join` *(node)* — Use the `path` module to build the path `lab/logs/auth.log` from its three parts and log it. Then log just the file extension of that path.
- `sync-quiz` *(quiz)* — Why is `fs.readFileSync` fine in a one-off script but a bug inside a web server?

**npm, package.json and dependencies**

- `semver-quiz` *(quiz)* — Your package.json says `"express": "^4.18.0"`. Which versions will npm install?
- `lockfile-quiz` *(quiz)* — Why commit `package-lock.json` but not `node_modules/`?
- `scripts-quiz` *(quiz)* — What is the practical value of the `scripts` section?

**Building an HTTP API**

- `http-server` *(node)* — Create an `http` server that responds to any request with JSON `{"status":"ok"}` and status 200. Listen on port 0 (the OS picks a free one), make a request t…
- `routing` *(node)* — Extend it: respond to `/health` with 200 and `{"ok":true}`, and to anything else with 404 and `{"error":"not found"}`. Make two requests — one to `/health`, …
- `status-quiz` *(quiz)* — A caller sends a valid token but asks for someone else's record. Which status?

**Project: the same triage tool in Node**

- `node-triage` *(node)* — Build the tool against `lab/logs/auth.log`. Print one `[!] <ip> <n> failed` line per source, highest first (two spaces before the count), then `2 unique sour…

</details>

---

## React

*Components, props, state, effects, forms and a findings dashboard you build yourself.*

6 lessons · 17 exercises · ~108 minutes of reading

| # | Lesson | Exercises | Covers |
|---|---|---|---|
| 01 | **What React is for, and JSX** | 2 react, 1 quiz | Without a framework, keeping a page in sync with your data means writing the |
| 02 | **Props, composition and lists** | 3 react, 1 quiz | A component is a function; props are what you pass it. |
| 03 | **State and events with useState** | 2 react, 1 quiz | Two problems: the variable is recreated each time the function runs, and changing |
| 04 | **useEffect: talking to the world outside React** | 2 react, 1 quiz | Rendering should be pure: same props and state in, same markup out, nothing else |
| 05 | **Forms, controlled inputs and filtering** | 2 react, 1 quiz | A controlled input takes its value from state, so React is the single source |
| 06 | **Project: a findings dashboard** | 1 react | Build a single App that manages a list of findings — the kind of thing you would |

<details><summary>Every exercise in this track</summary>

**What React is for, and JSX**

- `first-component` *(react)* — Write a component `App` that renders an `<h1>` containing the text `Forge`.
- `jsx-expressions` *(react)* — In `App`, declare `const ip = "10.10.10.5"` and `const ports = [22, 80, 443]`. Render an `<h2>` with the ip, and a `<p>` reading `3 open ports` — using the a…
- `capital-quiz` *(quiz)* — You wrote `<banner />` and nothing appears, with no error. Why?

**Props, composition and lists**

- `props-basic` *(react)* — Write a `HostCard({ ip, os })` component rendering `<h3>{ip}</h3>` and `<p>{os}</p>`. Then write `App` that renders two of them: `10.10.10.5`/`linux` and `10…
- `list-keys` *(react)* — Given `const hosts = [{ip: "10.0.0.1"}, {ip: "10.0.0.2"}, {ip: "10.0.0.3"}]`, render a `<ul>` with one `<li>` per host showing its ip. Give each `<li>` a pro…
- `conditional` *(react)* — Given `const hosts = []`, render `<p>No hosts yet.</p>` when the list is empty, and a `<ul>` of items when it is not. (With an empty array, only the paragrap…
- `key-quiz` *(quiz)* — Why is the array index a poor `key` for a list you can filter or delete from?

**State and events with useState**

- `counter` *(react)* — Build `App` with a count starting at 0 and a `<button>` reading `Count: 0` that increases by one each click.
- `add-to-list` *(react)* — Start with `useState(["10.0.0.1"])`. Render a `<ul>` of the hosts and a `<button>Add</button>` that appends `"10.0.0.2"` **without mutating** the existing ar…
- `updater-quiz` *(quiz)* — Clicking this button once increases the count by how much? ```jsx onClick={() => { setCount(count + 1); setCount(count + 1); }} ```

**useEffect: talking to the world outside React**

- `effect-mount` *(react)* — Use `useState` and `useEffect` so that `App` renders `<p>loading</p>` first and then, in an effect that runs exactly once, sets the status to `ready` so it r…
- `effect-cleanup` *(react)* — Build a ticker: state `ticks` starting at 0, an effect that starts a 20ms `setInterval` incrementing it with the **updater form**, and a cleanup that clears …
- `deps-quiz` *(quiz)* — An effect fetches `/api/hosts/${id}` but the dependency array is `[]`. What goes wrong?

**Forms, controlled inputs and filtering**

- `controlled-input` *(react)* — Render a controlled `<input>` whose state starts empty, plus a `<p>` showing `typed: <value>`. Typing `kali` should make the paragraph read `typed: kali`.
- `filter-list` *(react)* — Given `const hosts = ["10.0.0.1", "10.0.0.2", "192.168.1.7"]`, render a filter `<input>` and a `<ul>` showing only the hosts containing the typed text. Do **…
- `derived-quiz` *(quiz)* — Why is `const visible = hosts.filter(...)` better than keeping `visible` in state and updating it with an effect?

**Project: a findings dashboard**

- `dashboard` *(react)* — Build the dashboard described above. Seed with `{id:1, host:"10.0.0.1", severity:"high", resolved:false}` and `{id:2, host:"192.168.1.7", severity:"low", res…

</details>

---

## PowerShell

*Cmdlets, the object pipeline, filtering, files and a real log-triage tool — on Windows or Linux.*

6 lessons · 18 exercises · ~95 minutes of reading

| # | Lesson | Exercises | Covers |
|---|---|---|---|
| 01 | **Cmdlets, output and variables** | 2 powershell, 1 quiz | PowerShell is the shell that ships with every Windows box, and PowerShell 7 |
| 02 | **Everything is an object** | 2 powershell, 1 quiz | In bash, a command prints text and the next command re-parses that text. |
| 03 | **Filtering: Where-Object and Select-String** | 2 powershell, 1 quiz | matching lines (as MatchInfo objects). |
| 04 | **Files, text and a little regex** | 2 powershell, 1 quiz | Set-Content replaces; Add-Content appends. |
| 05 | **Variables, logic and loops** | 2 powershell, 1 quiz | Remember the word-operators from the filtering lesson: -eq, not ==. |
| 06 | **A real triage tool** | 2 powershell, 1 quiz | You now have every piece to turn a raw log into an answer a human can act on. |

<details><summary>Every exercise in this track</summary>

**Cmdlets, output and variables**

- `hello` *(powershell)* — Print exactly: `forge online`
- `interp` *(powershell)* — Make two variables — `$target` set to `"10.10.10.5"` and `$port` set to the number `22` — then print `Scanning 10.10.10.5 on port 22` using string interpolat…
- `discover` *(quiz)* — You want to find the cmdlet that lists running processes but cannot remember its name. What gets you there fastest?

**Everything is an object**

- `count-files` *(powershell)* — Print the number of files (not folders) anywhere under the `lab` directory. Use the pipeline — do not count them by hand.
- `largest` *(powershell)* — Print the **name** of the single largest file under `lab` (by size), and nothing else.
- `why-objects` *(quiz)* — Why does `Get-ChildItem \| Sort-Object Length` keep working even if a future PowerShell changes how a directory listing is displayed?

**Filtering: Where-Object and Select-String**

- `failed-count` *(powershell)* — Print how many lines in `lab/logs/auth.log` contain `Failed password`. (You counted these in bash with `grep -c` — this is the PowerShell version.)
- `filter-ip` *(powershell)* — The file `lab/configs/targets.txt` has one IP per line. Print only the one whose last octet is `99`.
- `dollar-underscore` *(quiz)* — Inside `Where-Object { $_ -gt 100 }`, what is `$_`?

**Files, text and a little regex**

- `write-file` *(powershell)* — Create the file `lab/loot/found.txt` containing exactly the single line `pwned`. (This exercise is graded on the file you create, not on printed output.)
- `unique-attackers` *(powershell)* — From `lab/logs/auth.log`, print how many **distinct** source IPs appear in `Failed password` lines. Capture the IP with a regex group, de-duplicate, then count.
- `set-vs-add` *(quiz)* — You want to keep appending new lines to a running report file across many runs. Which cmdlet?

**Variables, logic and loops**

- `sum-ports` *(powershell)* — Make an array of the numbers `22`, `80` and `443`, then print their **sum** using the pipeline.
- `service-lookup` *(powershell)* — The file `lab/configs/services.conf` has `name=port` lines. Print just the port number for `https` (the digits only, no `https=`).
- `no-ampersand` *(quiz)* — On the built-in Windows PowerShell 5.1, `Get-Process && Get-Service` does what?

**A real triage tool**

- `summary-line` *(powershell)* — From `lab/logs/auth.log`, print one line in exactly this shape: `<N> failed logins from <M> hosts`, where N is the number of `Failed password` lines and M is…
- `noisiest` *(powershell)* — Print just the single source IP responsible for the **most** `Failed password` attempts in `lab/logs/auth.log`.
- `when-powershell` *(quiz)* — You have a stream of records where you keep needing the same three fields by name. When is PowerShell the better reach than a bash pipeline?

</details>

---

## Adding your own

See [CONTRIBUTING.md](../CONTRIBUTING.md). The short version: copy a lesson
object in `electron/lessons/<track>.js`, write a `check` function, then run
`npm test` — it executes your reference solution through the real grader and
fails if it does not pass its own checker.
