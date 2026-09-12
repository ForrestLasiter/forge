/**
 * Track 1 — Kali / Linux command line.
 *
 * Every `check` here runs in the Electron main process with the learner's
 * command already executed. `result.stdout` is what they saw; `h` is the helper
 * bag from lessons/index.js.
 *
 * Exercises that need a binary Kali has but a minimal container may not declare
 * `requires: ['ip']` so the verifier can skip them instead of failing.
 */

module.exports = {
  id: 'linux',
  title: 'Kali & the Linux command line',
  blurb: 'The shell, the filesystem, permissions, processes, networking and your first bash scripts.',
  colour: '#5eead4',
  lessons: [

// ---------------------------------------------------------------------------
{
  id: 'orientation',
  title: 'Orientation: what the shell actually is',
  minutes: 12,
  body: `
## What you are looking at

When you open a terminal on Kali you are not "opening Linux". You are starting a
program called a **shell** — on Kali that is **zsh**. The shell's whole job is a
loop:

1. print a prompt
2. read a line you type
3. split that line into a command and its arguments
4. find a program with that name and run it
5. wait, print whatever it produced, go back to 1

That is it. \`ls\` is not a feature of the shell — it is a separate program at
\`/usr/bin/ls\` that the shell found and launched. Understanding this one fact
explains almost every confusing thing that happens later: "command not found"
means step 4 failed, and \`$PATH\` is the list of folders it searched.

## The filesystem is one tree

Windows has C:\\ and D:\\. Linux has exactly one tree starting at \`/\`. Everything —
your files, your hard drive, even your USB stick — hangs somewhere off that root.

    /            the root of everything
    /home/anon   your home directory (yours on Kali is /home/anon)
    /etc         system-wide configuration, all plain text
    /usr/bin     most of the programs you run
    /var/log     logs
    /tmp         scratch space, wiped on reboot
    /proc        not real files — a live window into the running kernel

\`~\` is shorthand for your home directory. \`.\` means "right here" and \`..\` means
"one level up".

## Absolute vs relative paths — the distinction that trips everyone

A path starting with \`/\` is **absolute**: it means the same thing no matter where
you are standing. Anything else is **relative**: it is interpreted from your
current directory.

    /home/anon/lab/logs/auth.log    absolute — always this file
    lab/logs/auth.log               relative — only works if you are in /home/anon

This is why a script that works when you run it from your home folder breaks when
cron runs it: cron starts somewhere else, and every relative path now points
somewhere else too.

## The four commands you will type ten thousand times

    pwd            print working directory — "where am I standing?"
    ls             list what is here
    cd <dir>       change directory
    man <command>  read the manual for a command

\`ls\` on its own is nearly useless. The flags are the point:

    ls -l          long format: permissions, owner, size, date
    ls -a          include hidden files (anything starting with a dot)
    ls -lh         long format with human-readable sizes (4.0K not 4096)
    ls -la         the combination you will actually use

Flags can be bundled: \`ls -l -a -h\` and \`ls -lah\` are the same thing.

## man is not a last resort

\`man ls\` opens the manual. Press \`/\` to search, \`n\` for the next hit, \`q\` to quit.
Every professional you will ever work with reads man pages constantly. Reaching
for one is a sign of competence, not confusion.

> **About Forge's terminal:** the box below runs each command in a fresh
> \`bash -lc\` inside a sandbox at \`~/.forge/workspace\`. It has no interactive
> terminal, so \`man\`, \`vim\`, \`top\` and \`less\` will not display here — run those
> in your real terminal. Everything else works normally, and nothing you do in
> here can touch the rest of your disk.
`,
  exercises: [
    {
      id: 'pwd',
      kind: 'shell',
      prompt: 'Print the directory you are currently standing in. (One command.)',
      starter: '',
      solution: 'pwd',
      hints: ['Three letters.', 'It stands for "print working directory".'],
      check: ({ code, result, h }) =>
        h.uses(code, 'pwd') && result.stdout.includes('.forge/workspace')
          ? { pass: true, message: 'That path is your sandbox. Every command in this track starts here.' }
          : { pass: false, message: 'Expected the `pwd` command, and output containing your workspace path.' },
    },
    {
      id: 'ls-la',
      kind: 'shell',
      prompt: 'List the contents of the `lab` directory in long format, including hidden files.',
      starter: 'ls ',
      solution: 'ls -la lab',
      hints: [
        'You need two flags: one for long format, one for "all".',
        'They can be bundled into one word after the dash.',
        'ls -la lab',
      ],
      check: ({ code, result }) => {
        const flags = (code.match(/-[a-zA-Z]+/g) || []).join('');
        const hasL = flags.includes('l');
        const hasA = flags.includes('a');
        const sawContents = ['logs', 'configs', 'loot'].every((d) => result.stdout.includes(d));
        if (!hasL || !hasA) return { pass: false, message: 'Use both the long-format flag (-l) and the all flag (-a).' };
        if (!sawContents) return { pass: false, message: 'You listed something, but not the lab directory — check the path.' };
        return { pass: true, message: 'Note the first column: that is the permission string. Lesson 4 decodes it.' };
      },
    },
    {
      id: 'path-quiz',
      kind: 'quiz',
      prompt: 'You are in `/home/anon/Documents`. Which command gets you to `/home/anon/lab`?',
      choices: ['cd lab', 'cd ../lab', 'cd /lab', 'cd ~lab'],
      answer: 1,
      explain:
        '`cd lab` would look for /home/anon/Documents/lab, which does not exist. `..` goes up one level to /home/anon first, then down into lab. `cd /lab` is an absolute path to a directory at the root of the filesystem. `cd ~/lab` (with the slash) would also work — the tilde expands to your home directory.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'files',
  title: 'Reading, creating and destroying files',
  minutes: 14,
  body: `
## Reading

    cat file           dump the whole file to the screen
    less file          page through it (q quits, / searches)
    head -n 5 file     first 5 lines
    tail -n 5 file     last 5 lines
    tail -f file       follow the file live as it grows  <- how you watch logs
    wc -l file         count lines

\`cat\` is for short files. Using it on a 200MB log is how you lose your terminal
for thirty seconds. \`head\` and \`tail\` are how you peek safely.

## Creating and moving

    touch file         create an empty file (or update its timestamp)
    mkdir dir          make a directory
    mkdir -p a/b/c     make the whole chain, and don't complain if it exists
    cp src dst         copy
    cp -r srcdir dst   copy a directory and everything in it
    mv src dst         move — this is also how you rename
    rm file            delete
    rm -r dir          delete a directory and everything in it

There is no recycle bin. \`rm\` is permanent and silent. The habit that saves you:
run \`ls\` with the same pattern first, look at what it lists, *then* change \`ls\`
to \`rm\`.

\`mv\` doing double duty as rename confuses people, but it is consistent: renaming
is just moving a file to a new name in the same directory.

## Redirection: where output goes

Every program starts life with three open channels:

    stdin   (0)  where it reads input from       default: your keyboard
    stdout  (1)  where normal output goes        default: your screen
    stderr  (2)  where error messages go         default: your screen

Because errors travel on a separate channel from results, you can keep the
results and throw the noise away — which is exactly what you want when a scan
prints a thousand "permission denied" lines.

    command > file      send stdout to file (OVERWRITES it)
    command >> file     append stdout to file
    command 2> file     send stderr to file
    command > out 2>&1  send both to the same place
    command 2>/dev/null throw errors away entirely
    command < file      feed the file in as stdin

\`/dev/null\` is a real device file that discards everything written to it. It is
the Linux trash chute.

## Wildcards belong to the shell, not the command

    *        any run of characters
    ?        exactly one character
    [abc]    one character from the set

When you type \`ls *.log\`, \`ls\` never sees the star. The **shell** expands it into
\`ls access.log auth.log\` before \`ls\` starts. This matters the day you write
\`find . -name *.log\` and it breaks — there you must quote it, \`-name "*.log"\`, so
the star reaches \`find\` intact.
`,
  exercises: [
    {
      id: 'cat-log',
      kind: 'shell',
      prompt: 'Display the contents of `lab/logs/auth.log`.',
      starter: '',
      solution: 'cat lab/logs/auth.log',
      hints: ['Three letters, short for "concatenate".'],
      check: ({ result }) =>
        result.stdout.includes('Accepted password for anon')
          ? { pass: true, message: 'That is a real-shaped SSH auth log. You will be mining it for the next two lessons.' }
          : { pass: false, message: 'Did not see the log contents. Check the path: lab/logs/auth.log' },
    },
    {
      id: 'tail-three',
      kind: 'shell',
      prompt: 'Show only the **last 3 lines** of `lab/logs/auth.log`.',
      starter: '',
      solution: 'tail -n 3 lab/logs/auth.log',
      hints: ['tail', 'The flag for "number of lines" is -n.'],
      check: ({ result, h }) => {
        const lines = h.lines(result.stdout);
        if (lines.length !== 3) return { pass: false, message: `Got ${lines.length} lines, expected exactly 3.` };
        return result.stdout.includes('10.10.10.42')
          ? { pass: true, message: 'Right end of the file. `tail -f` on the same file is how you watch an attack live.' }
          : { pass: false, message: 'Three lines, but from the wrong end of the file — that looks like `head`.' };
      },
    },
    {
      id: 'make-and-write',
      kind: 'shell',
      prompt:
        'In one submission: create the directory `lab/recon` (creating parents if needed), then write the single line `10.10.10.99` into a new file `lab/recon/suspect.txt`.',
      starter: '',
      solution: 'mkdir -p lab/recon\necho "10.10.10.99" > lab/recon/suspect.txt',
      hints: [
        'Two commands. Put them on separate lines, or join them with &&.',
        'mkdir -p makes parent directories and does not error if it already exists.',
        'Use echo with > to write output into a file.',
      ],
      check: ({ h }) => {
        if (!h.exists('lab/recon')) return { pass: false, message: 'lab/recon does not exist yet.' };
        const body = h.read('lab/recon/suspect.txt').trim();
        if (!body) return { pass: false, message: 'lab/recon/suspect.txt is missing or empty.' };
        return body === '10.10.10.99'
          ? { pass: true, message: 'You just created state on disk. Everything from here builds on that.' }
          : { pass: false, message: `File contains "${body}", expected exactly 10.10.10.99` };
      },
    },
    {
      id: 'redirect-quiz',
      kind: 'quiz',
      prompt: 'What is the difference between `nmap 10.10.10.0/24 > scan.txt` and `nmap 10.10.10.0/24 >> scan.txt`?',
      choices: [
        'No difference, >> is just older syntax',
        '> overwrites scan.txt, >> appends to the end of it',
        '> writes stdout, >> writes stderr',
        '> is synchronous, >> runs in the background',
      ],
      answer: 1,
      explain:
        'A single > truncates the file to zero bytes before writing. Running the same scan twice with > leaves you with only the second result. >> appends, which is what you want when a loop writes one line per host.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'search-pipes',
  title: 'grep, find and the pipe: turning noise into answers',
  minutes: 16,
  body: `
## The pipe is the whole philosophy

    command A | command B

The pipe connects A's stdout directly to B's stdin. No temp file, no waiting for
A to finish — the data streams. This is the core Unix idea: lots of small tools
that each do one thing, snapped together to answer a question nobody wrote a tool
for.

    cat access.log | grep 403 | wc -l

"Show me the log, keep only 403 lines, count them." Three tiny programs, one
answer.

## grep — find lines that match

    grep "Failed" auth.log         lines containing Failed
    grep -i "failed" auth.log      case-insensitive
    grep -c "Failed" auth.log      count matching lines instead of printing them
    grep -v "Failed" auth.log      INVERT: lines that do NOT match
    grep -r "password" /etc        search recursively through a directory
    grep -n "Failed" auth.log      show line numbers
    grep -o "10\\.[0-9.]*" auth.log  print only the matching part, not the line

\`-o\` is the one people discover late and then use forever. It turns grep from a
line filter into a data extractor.

## Regular expressions, the 20% that covers 80%

With \`grep -E\` (extended regex, worth always using):

    .        any single character
    *        zero or more of the previous thing
    +        one or more
    ?        zero or one
    [0-9]    any digit
    ^        start of line
    $        end of line
    \\.       a literal dot (backslash escapes it)

So \`grep -oE "[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+"\` pulls every IPv4 address out of
any text at all.

## find — locate files by property

grep searches *inside* files. find searches *for* files.

    find . -name "*.log"          by name (quote the pattern!)
    find . -type f                files only    (-type d = directories)
    find . -size +10M             bigger than 10MB
    find . -mmin -30              modified in the last 30 minutes
    find . -perm -4000            SUID binaries  <- classic privilege-escalation hunt
    find . -name "*.log" -exec wc -l {} \\;   run a command on each result

That last one matters: \`{}\` is a placeholder for each file found, and \`\\;\` ends
the command.

## sort, uniq, awk, cut — the rest of the pipeline

    sort           alphabetical; -n numeric; -r reverse; -u unique
    uniq -c        count consecutive duplicates (ALWAYS sort first)
    cut -d: -f1    split each line on ':' and keep field 1
    awk '{print $3}'   print the 3rd whitespace-separated field
    tr ' ' '\\n'    translate characters — here, one word per line

**The "top offenders" pipeline** is worth memorising, because you will rebuild it
for the rest of your career:

    grep "Failed password" auth.log \\
      | grep -oE "from [0-9.]+" \\
      | awk '{print $2}' \\
      | sort \\
      | uniq -c \\
      | sort -rn

Extract, normalise, sort, count, rank. Same five steps every time.
`,
  exercises: [
    {
      id: 'count-failed',
      kind: 'shell',
      prompt: 'Count how many lines in `lab/logs/auth.log` contain the text `Failed password`. Print just the number.',
      starter: '',
      solution: 'grep -c "Failed password" lab/logs/auth.log',
      hints: ['grep has a flag that counts instead of printing.', 'It is -c.'],
      check: ({ result }) =>
        result.stdout.trim() === '5'
          ? { pass: true, message: 'Five failed logins. `grep -c` beats `grep ... | wc -l` — one process instead of two.' }
          : { pass: false, message: `Expected the single number 4, got: ${JSON.stringify(result.stdout.trim())}` },
    },
    {
      id: 'find-logs',
      kind: 'shell',
      prompt: 'Find every file under `lab` whose name ends in `.log`.',
      starter: '',
      solution: 'find lab -name "*.log"',
      hints: ['find <where> -name <pattern>', 'Quote the pattern so the shell does not expand the star first.'],
      check: ({ result, h }) => {
        const lines = h.lines(result.stdout);
        const ok = lines.length === 2 && lines.some((l) => l.endsWith('auth.log')) && lines.some((l) => l.endsWith('access.log'));
        return ok
          ? { pass: true, message: 'Two logs. Swap -name for -perm -4000 and this same command hunts SUID binaries.' }
          : { pass: false, message: `Expected exactly the 2 .log files. Got ${lines.length} line(s).` };
      },
    },
    {
      id: 'unique-attackers',
      kind: 'shell',
      prompt:
        'Build a pipeline that prints the **unique IP addresses that failed a password** in `lab/logs/auth.log` — one per line, nothing else. (Two addresses, in any order.)',
      starter: 'grep "Failed password" lab/logs/auth.log \\\n  | ',
      solution:
        'grep "Failed password" lab/logs/auth.log | grep -oE "from [0-9.]+" | awk \'{print $2}\' | sort -u',
      hints: [
        'Step 1: keep only the failure lines.',
        'Step 2: extract the address. `grep -oE "from [0-9.]+"` gets you "from 10.10.10.99".',
        'Step 3: awk \'{print $2}\' drops the word "from". Step 4: sort -u removes duplicates.',
      ],
      check: ({ result, h }) => {
        const lines = h.lines(result.stdout);
        const want = new Set(['10.10.10.42', '10.10.10.99']);
        const got = new Set(lines);
        if (lines.length !== 2) return { pass: false, message: `Expected 2 lines, got ${lines.length}. Did you forget sort -u?` };
        const same = [...want].every((x) => got.has(x));
        return same
          ? { pass: true, message: 'That is the shape of every log-triage task you will ever be handed.' }
          : { pass: false, message: `Expected 10.10.10.42 and 10.10.10.99, got: ${lines.join(', ')}` };
      },
    },
    {
      id: 'uniq-quiz',
      kind: 'quiz',
      prompt: 'Why does `uniq -c` almost always need a `sort` in front of it?',
      choices: [
        'uniq is alphabetical and sort makes it faster',
        'uniq only collapses duplicates that are adjacent lines',
        'sort removes blank lines that would break uniq',
        'It does not — the sort is a habit with no effect',
      ],
      answer: 1,
      explain:
        'uniq compares each line only against the one before it. Given A B A it reports three distinct lines, because the two As are never neighbours. Sorting puts identical lines together so uniq can actually collapse and count them.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'permissions',
  title: 'Users, permissions and sudo',
  minutes: 15,
  body: `
## Reading the permission string

\`ls -l\` starts each line with something like \`-rwxr-xr--\`. Ten characters, four
groups:

    -     rwx      r-x      r--
    type  owner    group    everyone else

- **type**: \`-\` regular file, \`d\` directory, \`l\` symlink
- then three triplets of **r**ead, **w**rite, e**x**ecute

For a **file**: r = read contents, w = modify, x = run it as a program.
For a **directory** the meanings shift, and this is the part that catches people:
r = list the names inside, w = create/delete entries, **x = enter it at all**.
A directory with r but no x lets you see the filenames and touch nothing.

## Octal, because everyone speaks it

Each triplet is three bits: r=4, w=2, x=1. Add them up.

    7 = rwx      6 = rw-      5 = r-x      4 = r--      0 = ---

    chmod 755 script.sh    rwxr-xr-x   owner does everything, everyone reads+runs
    chmod 644 notes.txt    rw-r--r--   the default for a normal file
    chmod 700 secrets/     rwx------   only you, nobody else even looks
    chmod 600 id_rsa       rw-------   REQUIRED for SSH private keys

That last one is not a suggestion. SSH refuses a key file that anyone else can
read, and the error message does not say so clearly.

Symbolic form works too and reads better for small changes:

    chmod +x script.sh     add execute for everyone
    chmod u+x script.sh    add execute for the owner only
    chmod o-r file         remove read from "others"

## Ownership

    chown user file          change owner            (needs root)
    chown user:group file    change owner and group  (needs root)
    id                       who am I, and what groups am I in?
    whoami                   just the username

Group membership is how Linux grants shared access without handing out root. On
Kali, being in the \`sudo\` group is what lets you run \`sudo\` at all.

## sudo, and why Kali stopped logging you in as root

Old Kali logged you straight in as root. Since 2020 the default user is a normal
account (\`anon\` on your ThinkPad) and you elevate per-command with \`sudo\`.

That change was not bureaucracy. Running as root full-time means every browser
tab, every script you piped from the internet, and every typo runs with the
authority to destroy the machine. \`sudo\` makes privilege a deliberate, logged act
— and \`/var/log/auth.log\` records each one, which is exactly the file you were
grepping last lesson.

    sudo command          run one command as root
    sudo -i               become root interactively (use sparingly)
    sudo !!               re-run the last command with sudo — the best shortcut in Linux

## SUID: the flag that makes privilege escalation possible

An \`s\` where an \`x\` should be in the owner triplet (\`-rwsr-xr-x\`) is the **SUID**
bit: the program runs as its *owner*, not as you. \`/usr/bin/passwd\` needs it, to
write to a file you cannot write to.

It is also the first thing an attacker enumerates, because a SUID binary owned by
root that can read arbitrary files, or spawn a shell, is a free promotion:

    find / -perm -4000 -type f 2>/dev/null

Note the \`2>/dev/null\` — without it, the permission-denied noise buries the
answer. You learned that operator two lessons ago; this is the job it was hired
for.
`,
  exercises: [
    {
      id: 'chmod-700',
      kind: 'shell',
      prompt:
        'Create a file `lab/recon/keys.txt`, then set its permissions so **only the owner** can read and write it, and nobody can execute it.',
      starter: '',
      solution: 'touch lab/recon/keys.txt\nchmod 600 lab/recon/keys.txt',
      hints: [
        'mkdir -p lab/recon first if it is not there from the last lesson.',
        'Owner read+write = 4+2 = 6. Group and other get nothing = 0.',
        'chmod 600',
      ],
      check: ({ h }) => {
        const fsMod = require('fs');
        const p = require('path').join(h.ws, 'lab/recon/keys.txt');
        if (!fsMod.existsSync(p)) return { pass: false, message: 'lab/recon/keys.txt does not exist.' };
        const mode = (fsMod.statSync(p).mode & 0o777).toString(8).padStart(3, '0');
        return mode === '600'
          ? { pass: true, message: 'Exactly the mode SSH demands of a private key.' }
          : { pass: false, message: `Permissions are ${mode}, expected 600.` };
      },
    },
    {
      id: 'octal-quiz',
      kind: 'quiz',
      prompt: 'A shell script shows as `-rw-r--r--`. You run `./script.sh` and get "Permission denied". What is wrong?',
      choices: [
        'The file is owned by root',
        'The execute bit is not set — you need chmod +x',
        'Scripts must live in /usr/bin',
        'The shebang line is missing',
      ],
      answer: 1,
      explain:
        'rw-r--r-- is 644: read and write for you, read for everyone, execute for nobody. Linux will not run a file as a program without the x bit. `chmod +x script.sh` makes it 755. (A missing shebang is a real and separate problem — you meet it in the scripting lesson.)',
    },
    {
      id: 'suid-quiz',
      kind: 'quiz',
      prompt: 'Why do pentesters run `find / -perm -4000 -type f 2>/dev/null` early on a compromised box?',
      choices: [
        'To list every file root owns',
        'To find SUID binaries, which run with their owner\'s privileges and may be abusable for escalation',
        'To find files modified in the last 4000 minutes',
        'To measure how much disk root is using',
      ],
      answer: 1,
      explain:
        'The 4000 is the SUID bit in octal. A SUID-root binary runs as root regardless of who launched it, so any such binary that can read files, write files or spawn a shell is a potential path from normal user to root. GTFOBins is the public catalogue of which ones are abusable.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'processes',
  title: 'Processes and services',
  minutes: 13,
  body: `
## What a process is

A program is a file on disk. A **process** is a running copy of it, with its own
memory, its own PID (process ID), and a parent that started it. Everything on
your Kali box descends from PID 1, which is systemd.

    ps aux                 every process on the system, detailed
    ps -ef                 the same idea, different (older) format
    ps -eo pid,ppid,comm   pick exactly the columns you want
    pstree                 the parent/child tree, drawn
    top                    live view, updating
    htop                   the same but readable (sudo apt install htop)

\`ps aux | grep ssh\` is the single most-typed process command in existence.

## Killing things

    kill <pid>          send SIGTERM — "please shut down cleanly"
    kill -9 <pid>       send SIGKILL — "die now", no cleanup possible
    killall firefox     by name instead of PID
    pkill -f "python3 scan.py"   match the whole command line

**Always try plain \`kill\` first.** SIGTERM is a request the program can catch: it
gets to flush its files, close sockets and exit tidily. SIGKILL is handled by the
kernel and the process never learns it happened — half-written files and orphaned
locks are on you. A process that ignores SIGTERM repeatedly is usually stuck in
the kernel (state \`D\`), and SIGKILL will not move it either.

## Jobs: foreground and background

    command &          start it in the background
    Ctrl-Z             suspend the foreground job
    bg                 resume the suspended job in the background
    fg                 bring it back to the foreground
    jobs               list this shell's jobs
    nohup command &    keep it alive after you close the terminal

Long scans belong in the background, or better, in \`tmux\` — because a background
job still dies with its parent shell if you close the window without \`nohup\`.

## Services (systemd)

Background programs the system manages are **units**:

    systemctl status ssh          is it running, and the last few log lines
    sudo systemctl start ssh      start now
    sudo systemctl stop ssh       stop now
    sudo systemctl enable ssh     start automatically at boot
    sudo systemctl disable ssh    do not start at boot
    systemctl list-units --failed everything broken right now

\`start\`/\`stop\` are about *now*; \`enable\`/\`disable\` are about *boot*. Mixing those
two up is the most common systemd mistake, and it produces the maddening symptom
of a service that works until you reboot.

    journalctl -u ssh             all logs for that unit
    journalctl -b                 everything since this boot
    journalctl -f                 follow live
    journalctl -b --since "10 min ago"

On Kali, SSH is deliberately shipped disabled. That is why a fresh install will
not accept connections until you \`enable\` it.
`,
  exercises: [
    {
      id: 'ps-self',
      kind: 'shell',
      prompt: 'Print the PID of the shell that is running your command, and nothing else. (`$$` holds it.)',
      starter: '',
      solution: 'echo $$',
      hints: ['The shell stores its own PID in the variable $$.', 'echo $$'],
      check: ({ result }) => {
        const t = result.stdout.trim();
        return /^\d+$/.test(t)
          ? { pass: true, message: `PID ${t}. Every process you launch from a shell becomes its child.` }
          : { pass: false, message: `Expected a single number, got: ${JSON.stringify(t)}` };
      },
    },
    {
      id: 'ps-count',
      kind: 'shell',
      prompt: 'Use `ps` and a pipe to print how many processes are currently running on this machine.',
      starter: '',
      solution: 'ps -e | wc -l',
      hints: ['ps -e lists every process.', 'Pipe it into a line counter.'],
      check: ({ code, result }) => {
        const n = parseInt(result.stdout.trim(), 10);
        if (!/\bps\b/.test(code)) return { pass: false, message: 'Use ps as the source of the list.' };
        return Number.isInteger(n) && n > 0
          ? { pass: true, message: `${n} lines — remember one of them is the header row, a classic off-by-one.` }
          : { pass: false, message: 'Expected a single count. Pipe ps into wc -l.' };
      },
    },
    {
      id: 'signal-quiz',
      kind: 'quiz',
      prompt: 'A capture is writing to a .pcap file. Why should you `kill` it rather than `kill -9`?',
      choices: [
        'kill -9 is slower',
        'SIGTERM lets it flush its buffer and close the file properly; SIGKILL can leave the capture truncated',
        'kill -9 requires root',
        'There is no difference for file writes',
      ],
      answer: 1,
      explain:
        'SIGTERM is deliverable to the program, which can run its shutdown handler — flush buffers, write the file footer, close cleanly. SIGKILL is executed by the kernel; the process gets no notice and anything still in its userspace buffer is gone. That is how you end up with a pcap that no tool will open.',
    },
    {
      id: 'systemd-quiz',
      kind: 'quiz',
      prompt: 'You ran `sudo systemctl start ssh` and SSH works. After a reboot it is dead again. Why?',
      choices: [
        'The reboot corrupted the config',
        '`start` only affects the current session; `enable` is what sets it to launch at boot',
        'You needed `sudo systemctl restart ssh`',
        'Kali blocks SSH permanently',
      ],
      answer: 1,
      explain:
        'start/stop act on the running system. enable/disable create or remove the symlink that systemd reads at boot. You almost always want `sudo systemctl enable --now ssh`, which does both in one command.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'networking',
  title: 'Networking from the command line',
  minutes: 16,
  body: `
## Your own machine first

    ip a                    every interface and its addresses (short: ip -br a)
    ip r                    the routing table — where traffic goes
    ip -br link             interfaces up/down, one line each

\`ifconfig\` is what the old tutorials show. It is deprecated and not even installed
on a modern Kali by default. Learn \`ip\`.

Read \`ip r\` from the top: the line beginning \`default via 192.168.1.1 dev wlan0\`
means "anything I don't have a more specific route for, hand to 192.168.1.1 over
wlan0". That address is your gateway, and it is the first thing you ping when
something is broken.

## The four-step triage that finds almost every network fault

Work outward. Stop at the first step that fails — that is your problem.

    1. ip -br a              do I even have an address?      (no -> DHCP/driver/NM)
    2. ping -c3 <gateway>    can I reach the router?         (no -> layer 2, wifi assoc)
    3. ping -c3 1.1.1.1      can I reach the internet by IP? (no -> routing/NAT/firewall)
    4. ping -c3 google.com   does DNS resolve?               (no -> DNS only)

If step 3 works and step 4 does not, you have a DNS problem and nothing else —
a distinction that saves an hour of blind restarting.

## Who is listening on this box

    ss -tulpn      TCP + UDP, listening only, numeric ports, with the owning process

Memorise that flag bundle. \`t\` TCP, \`u\` UDP, \`l\` listening, \`p\` process (needs
sudo to show other users'), \`n\` numeric. \`netstat\` did this job for twenty years
and is also deprecated in favour of \`ss\`.

## DNS

    dig google.com            full answer with sections
    dig +short google.com     just the address
    dig @1.1.1.1 example.com  ask a specific resolver
    dig -x 1.1.1.1            reverse lookup
    host google.com           quick and simple
    cat /etc/resolv.conf      which resolver this machine was told to use

\`nslookup\` is the Windows habit; \`dig\` is what you want on Linux because it shows
you which server answered and whether the answer was authoritative.

## Talking to services

    curl -I https://example.com        headers only
    curl -s https://api/x | jq         silent, piped into a JSON formatter
    curl -X POST -d 'a=1' https://x    send a POST
    wget -r https://site               recursive download

## And the one you actually came for

    nmap -sn 10.10.10.0/24              who is alive on this subnet (no port scan)
    nmap -sV -p- 10.10.10.5             every port, identify the service versions
    nmap -sC -sV -oA scan 10.10.10.5    default scripts + versions, save all formats

\`-oA\` writes .nmap, .gnmap and .xml at once. Future-you, trying to reconstruct
what you found three weeks ago, will be grateful.

> **Only scan things you are authorised to scan.** Your pfSense lab network on
> 10.10.10.x is yours. Someone else's network is a crime in most jurisdictions,
> regardless of intent.
`,
  exercises: [
    {
      id: 'resolv',
      kind: 'shell',
      prompt: 'Show which DNS resolver(s) this machine is configured to use.',
      starter: '',
      solution: 'cat /etc/resolv.conf',
      hints: ['It is a plain text file in /etc.', 'cat /etc/resolv.conf'],
      check: ({ result }) =>
        /nameserver/i.test(result.stdout)
          ? { pass: true, message: 'If step 4 of the triage fails and this file is empty or wrong, you just found it.' }
          : { pass: false, message: 'Expected output containing a "nameserver" line from /etc/resolv.conf.' },
    },
    {
      id: 'ip-brief',
      kind: 'shell',
      requires: ['ip'],
      prompt: 'List this machine\'s network interfaces and addresses in the brief one-line-per-interface format.',
      starter: '',
      solution: 'ip -br a',
      hints: ['The command is `ip`.', '`a` is short for address, and there is a -br (brief) flag.'],
      check: ({ code, result }) =>
        /\bip\b/.test(code) && /-br/.test(code) && result.exitCode === 0 && result.stdout.trim().length > 0
          ? { pass: true, message: 'Step 1 of the triage, in one line. Anything showing DOWN or with no address is your suspect.' }
          : { pass: false, message: 'Expected `ip -br a` (or `ip -br address`) producing output.' },
    },
    {
      id: 'client-ips',
      kind: 'shell',
      prompt:
        'From `lab/logs/access.log`, print each unique client IP **prefixed by how many requests it made**, most active first. (The IP is the first field of every line.)',
      starter: '',
      solution: "awk '{print $1}' lab/logs/access.log | sort | uniq -c | sort -rn",
      hints: [
        'awk \'{print $1}\' grabs the first field of each line.',
        'Then the memorised chain: sort | uniq -c | sort -rn',
      ],
      check: ({ result, h }) => {
        const lines = h.lines(result.stdout);
        if (lines.length !== 2) return { pass: false, message: `Expected 2 lines (two distinct IPs), got ${lines.length}.` };
        const first = lines[0].replace(/\s+/g, ' ').trim();
        const second = lines[1].replace(/\s+/g, ' ').trim();
        const ok = first === '3 10.10.10.99' && second === '2 10.10.10.5';
        return ok
          ? { pass: true, message: '10.10.10.99 asked for /admin, /.env and /wp-login.php. That is a scanner, and you just ranked it first.' }
          : { pass: false, message: `Expected "3 10.10.10.99" then "2 10.10.10.5". Got: ${lines.join(' | ')}` };
      },
    },
    {
      id: 'dns-quiz',
      kind: 'quiz',
      prompt: '`ping 1.1.1.1` works. `ping google.com` says "Name or service not known". What is broken?',
      choices: [
        'The default gateway',
        'DNS resolution only — routing and connectivity are fine',
        'The network cable or wifi association',
        'The firewall is dropping ICMP',
      ],
      answer: 1,
      explain:
        'Reaching 1.1.1.1 by raw IP proves your address, gateway, routing and internet path all work. The only extra thing the second command needs is turning a name into an address. So the fault is isolated to DNS: check /etc/resolv.conf, then try `dig @1.1.1.1 google.com` to see whether an external resolver answers.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'packages',
  title: 'Packages, updates and keeping Kali healthy',
  minutes: 12,
  body: `
## apt in six commands

    sudo apt update                 refresh the list of what is available
    sudo apt upgrade                install newer versions of what you have
    sudo apt full-upgrade           same, but allowed to remove packages to resolve conflicts
    sudo apt install <pkg>          install
    sudo apt remove <pkg>           uninstall, keep config files
    sudo apt purge <pkg>            uninstall, delete config too
    apt search <term>               find a package
    apt show <pkg>                  what is this thing
    apt list --installed            everything you have

\`update\` and \`upgrade\` sound like synonyms and are not. \`update\` only downloads
the catalogue; it installs nothing. \`upgrade\` installs, using whatever catalogue
it last saw. Running \`upgrade\` without a recent \`update\` installs stale versions
or fails on 404s, which is why every tutorial writes them as a pair:

    sudo apt update && sudo apt full-upgrade -y

## The Kali-specific part: it is a rolling release

Kali does not have versioned releases you upgrade between every two years. It
rolls continuously. Two consequences:

1. **Update often or not at all.** A Kali box left alone for six months and then
   upgraded in one go is the classic way to break it. Weekly is fine.
2. **Use \`full-upgrade\`, not \`upgrade\`.** A rolling distro regularly needs to
   remove an old package to install a new one, and plain \`upgrade\` refuses to
   remove anything, so it silently holds packages back.

If \`apt update\` complains about an expired key, the fix is to install the current
\`kali-archive-keyring\` package — never to disable signature checking.

## Metapackages

Kali ships bundles instead of making you name 600 tools:

    kali-linux-headless      the default minimal set
    kali-linux-default       what the installer gives you
    kali-linux-large         a much bigger tool set
    kali-tools-web           just the web app testing tools
    kali-tools-wireless      just the wireless tools

\`apt install kali-tools-wireless\` gets you aircrack-ng, kismet, reaver and the
rest in one line.

## When apt is not the source

    pipx install <tool>     Python CLI tools, each in its own isolated venv
    pip install --user      only inside a venv; Kali now BLOCKS system-wide pip
    git clone + make        many pentest tools ship this way
    docker run              disposable, isolated, leaves no trace on the host

Modern Debian marks the system Python as "externally managed" and refuses
\`sudo pip install\`. That is protecting you: pip overwriting a file apt owns is how
you end up with a system Python that no longer boots your desktop. Use \`pipx\` for
tools and a \`venv\` for projects — you will build one in the Python track.

## Housekeeping

    sudo apt autoremove          delete packages nothing needs any more
    sudo apt clean               empty the downloaded .deb cache
    df -h                        disk free, human readable
    du -sh ~/*                   what is eating your home directory

On a 256GB SSD with a rolling distro, \`apt clean\` between big upgrades is worth
real gigabytes.
`,
  exercises: [
    {
      id: 'apt-quiz-1',
      kind: 'quiz',
      prompt: 'What does `sudo apt update` actually do?',
      choices: [
        'Installs the newest version of every installed package',
        'Downloads the current package catalogue from the repositories; installs nothing',
        'Upgrades Kali to the next release',
        'Removes packages that are no longer needed',
      ],
      answer: 1,
      explain:
        'update refreshes metadata only — it is asking "what exists out there now?". upgrade / full-upgrade is what changes files on your disk. Doing upgrade without a fresh update is how you get 404s on package downloads.',
    },
    {
      id: 'apt-quiz-2',
      kind: 'quiz',
      prompt: 'Why is `full-upgrade` recommended over `upgrade` specifically on Kali?',
      choices: [
        'It is faster',
        'Kali rolls continuously, and resolving new dependencies often requires removing an old package — which plain `upgrade` refuses to do',
        'upgrade does not work on Debian-based systems',
        'full-upgrade skips the signature check',
      ],
      answer: 1,
      explain:
        'plain upgrade will never remove a package, so when a new version needs a conflicting old one gone it just holds the update back. Over a rolling release those held-back packages accumulate until the system is inconsistent. full-upgrade is allowed to remove, which keeps the tree resolvable.',
    },
    {
      id: 'disk-check',
      kind: 'shell',
      prompt: 'Show disk usage for all mounted filesystems in human-readable units (GB/MB rather than blocks).',
      starter: '',
      solution: 'df -h',
      hints: ['Two letters, then a flag.', 'df -h'],
      check: ({ code, result }) =>
        /\bdf\b/.test(code) && /-h/.test(code) && /Size|Avail/i.test(result.stdout)
          ? { pass: true, message: 'Watch the % Use column on / — a full root filesystem breaks apt in confusing ways.' }
          : { pass: false, message: 'Expected `df -h` and its usual table output.' },
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'bash-scripting',
  title: 'Your first bash scripts',
  minutes: 18,
  body: `
## From commands to a program

A shell script is a text file of commands the shell reads instead of your
keyboard. Three ingredients:

    #!/usr/bin/env bash      1. the shebang
    set -euo pipefail        2. the safety line
    ...your commands...      3. the actual work

**The shebang** is the first two bytes of the file, \`#!\`, followed by the
interpreter. When you run \`./scan.sh\`, the kernel reads those two bytes and
launches that interpreter with your file as its argument. Without it, the kernel
does not know what this file *is*.

Why \`/usr/bin/env bash\` rather than \`/bin/bash\`? \`env\` looks up bash on \`$PATH\`,
so the script works on systems where bash lives somewhere else. It is the portable
habit.

**The safety line** is the single biggest upgrade to your scripts:

    set -e            exit immediately if any command fails
    set -u            error on an undefined variable instead of using ""
    set -o pipefail   a pipeline fails if ANY stage fails, not just the last

Without \`-e\`, a script whose \`cd /target\` failed cheerfully runs the next line —
\`rm -rf *\` — in the wrong directory. Without \`-u\`, a typo in \`$OUTDIR\` becomes an
empty string and you write to \`/\`. These three options have saved more machines
than any tool in Kali.

Then make it runnable: \`chmod +x scan.sh\`, and run it as \`./scan.sh\` — the \`./\`
is required because \`.\` is not on your \`$PATH\`, deliberately, so that a malicious
\`ls\` dropped in a directory cannot hijack your next command.

## Variables

    TARGET="10.10.10.5"       no spaces around = , ever
    echo "Scanning $TARGET"   expand with $
    echo "\${TARGET}_scan"      braces when the name touches other characters

**Always quote your variables.** \`rm $FILE\` where FILE is \`my notes.txt\` deletes
two things called "my" and "notes.txt". \`rm "$FILE"\` deletes the one you meant.

    $(command)     run it, substitute its output   <- use this
    \`command\`      the old backtick form           <- do not, it does not nest
    $1 $2 $3       arguments passed to the script
    $#             how many arguments
    $?             exit status of the last command: 0 = success
    $@             all arguments

## Conditionals

    if [[ -f "$FILE" ]]; then
      echo "exists"
    elif [[ -d "$FILE" ]]; then
      echo "it is a directory"
    else
      echo "missing"
    fi

    -f  is a regular file        -d  is a directory
    -z  string is empty          -n  string is non-empty
    -eq -ne -lt -gt              numeric comparison
    ==  !=                       string comparison

Use \`[[ ]]\` (bash) rather than \`[ ]\` (POSIX). It handles unquoted variables and
empty strings without exploding, and supports \`&&\`/\`||\` inside.

## Loops

    for ip in 10.10.10.1 10.10.10.5; do
      echo "Checking $ip"
    done

    for ip in $(cat targets.txt); do ... done      # fine for simple word lists

    while read -r line; do                          # the correct way for files
      echo "Line: $line"
    done < targets.txt

The \`while read\` form handles lines containing spaces; the \`for $(cat ...)\` form
splits on every space. For a file of IPs either works; for a file of anything else,
use \`while read\`.

## A real script

    #!/usr/bin/env bash
    set -euo pipefail

    TARGETS="\${1:-targets.txt}"        # first argument, defaulting to targets.txt
    OUT="scan-$(date +%F).txt"

    if [[ ! -f "$TARGETS" ]]; then
      echo "No such file: $TARGETS" >&2   # errors go to stderr
      exit 1                              # non-zero exit = failure
    fi

    while read -r ip; do
      echo "[*] $ip" | tee -a "$OUT"
    done < "$TARGETS"

\`\${1:-default}\` means "argument 1, or this fallback if it is unset". \`>&2\` sends
that message to stderr so it is visible even when someone pipes your script's
output into a file. \`tee -a\` writes to the screen *and* appends to a file.

Every one of these habits — quote it, check it exists, exit non-zero on failure,
errors to stderr — carries straight into the Python you write next.
`,
  exercises: [
    {
      id: 'write-script',
      kind: 'shell',
      prompt:
        'Create an executable script at `lab/recon/hello.sh` that has a proper bash shebang and prints exactly `forge ready`. Then run it, so `forge ready` appears in the output below.',
      starter: `cat > lab/recon/hello.sh <<'EOF'
#!/usr/bin/env bash
EOF
`,
      solution: `mkdir -p lab/recon
cat > lab/recon/hello.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "forge ready"
EOF
chmod +x lab/recon/hello.sh
./lab/recon/hello.sh`,
      hints: [
        'A heredoc (cat > file <<\'EOF\' ... EOF) writes a multi-line file in one go.',
        'Do not forget chmod +x, or running it gives Permission denied.',
        'Run it with ./lab/recon/hello.sh — the ./ is required.',
      ],
      check: ({ result, h }) => {
        const src = h.read('lab/recon/hello.sh');
        if (!src) return { pass: false, message: 'lab/recon/hello.sh was not created.' };
        if (!src.startsWith('#!')) return { pass: false, message: 'The file exists but does not start with a shebang (#!).' };
        const fsMod = require('fs');
        const p = require('path').join(h.ws, 'lab/recon/hello.sh');
        const mode = fsMod.statSync(p).mode & 0o111;
        if (!mode) return { pass: false, message: 'The script is not executable — chmod +x it.' };
        if (!result.stdout.includes('forge ready'))
          return { pass: false, message: 'The script exists and is executable, but "forge ready" was not printed. Did you run it?' };
        return { pass: true, message: 'Shebang, execute bit, and you invoked it with ./ — that is the whole ritual.' };
      },
    },
    {
      id: 'loop-targets',
      kind: 'shell',
      prompt:
        'Loop over every line in `lab/configs/targets.txt` and print `Scanning <ip>` for each one (5 lines of output).',
      starter: '',
      solution: 'while read -r ip; do echo "Scanning $ip"; done < lab/configs/targets.txt',
      hints: [
        'while read -r line; do ... done < file',
        'Remember to quote the variable inside echo.',
      ],
      check: ({ result, h }) => {
        const lines = h.lines(result.stdout);
        const want = ['10.10.10.1', '10.10.10.5', '10.10.10.42', '10.10.10.99', '10.10.10.150'];
        if (lines.length !== 5) return { pass: false, message: `Expected 5 lines, got ${lines.length}.` };
        const ok = want.every((ip, i) => lines[i] === `Scanning ${ip}`);
        return ok
          ? { pass: true, message: 'Swap the echo for a real command and you have written your first automation tool.' }
          : { pass: false, message: `Lines should read exactly "Scanning <ip>". Got: ${lines[0]}` };
      },
    },
    {
      id: 'set-e-quiz',
      kind: 'quiz',
      prompt: 'What does `set -e` at the top of a script do, and why does it matter?',
      choices: [
        'Enables verbose echoing of each command',
        'Aborts the script as soon as any command exits non-zero, so a failed step cannot silently corrupt the ones after it',
        'Escapes special characters automatically',
        'Runs the script with elevated privileges',
      ],
      answer: 1,
      explain:
        'By default a shell script ignores failures and keeps going. The canonical disaster is `cd "$DIR"` failing, followed by `rm -rf *` running in whatever directory you happened to be in. set -e stops at the first failure. Pair it with set -u (undefined variables are errors) and set -o pipefail (a pipeline fails if any stage fails).',
    },
  ],
},

  ],
};
