/**
 * Track 5 — PowerShell from zero.
 *
 * Exercises run with `pwsh` (PowerShell 7) when it is present, and fall back to
 * the built-in Windows PowerShell 5.1 (`powershell`) otherwise — see runner.js.
 * Because pwsh is cross-platform, this track runs on Windows AND on Linux, the
 * mirror image of the Kali/bash track: a Linux user can learn PowerShell here,
 * and a Windows user can learn bash on the Kali track once Git Bash is present.
 *
 * cwd is ~/.forge/workspace, so `Get-Content lab/logs/auth.log` resolves to the
 * very same seeded lab the Linux and Python tracks parse. Solving one problem in
 * bash, Python and PowerShell against one dataset is the whole point — you get to
 * feel where each language is the right reach.
 *
 * Lessons are written to the SUBSET common to PowerShell 5.1 and 7, so they pass
 * on either. That means: no `&&`/`||` between commands (5.1 has neither), no
 * ternary `? :` and no null-coalescing `??`. Use `;`, `if`/`else`, and the
 * pipeline instead.
 */

const fs = require('fs');
const path = require('path');

/** PowerShell (especially 5.1) emits CRLF; strip it and trim for comparisons. */
const clean = (s) => String(s || '').replace(/\r/g, '').trim();

/** Everything the checkers need to know about the seeded auth.log, computed from
 *  the file itself so a later edit to the lab cannot silently break an answer. */
function failedInfo(h) {
  const lines = clean(h.read('lab/logs/auth.log'))
    .split('\n')
    .filter((l) => /Failed password/.test(l));
  const ips = lines
    .map((l) => (l.split(' from ')[1] || '').split(' ')[0])
    .filter(Boolean);
  return { count: lines.length, hosts: new Set(ips).size };
}

function countFiles(dir) {
  let n = 0;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return 0; }
  for (const e of entries) {
    if (e.isDirectory()) n += countFiles(path.join(dir, e.name));
    else n += 1;
  }
  return n;
}

module.exports = {
  id: 'powershell',
  title: 'PowerShell',
  blurb: 'Cmdlets, the object pipeline, filtering, files and a real log-triage tool — on Windows or Linux.',
  colour: '#5391fe',
  lessons: [

// ---------------------------------------------------------------------------
{
  id: 'cmdlets',
  title: 'Cmdlets, output and variables',
  minutes: 14,
  body: `
## Why PowerShell, and why next to bash

PowerShell is the shell that ships with every Windows box, and PowerShell 7
(pwsh) also runs on Linux and macOS. If the Kali track taught you to glue
programs together with text, PowerShell is the other half of the sky: it passes
**objects**, not lines of text, from one command to the next. That one difference
changes everything, and this track builds up to it.

Everything you type is a **cmdlet** with a Verb-Noun name:

    Get-Content     Set-Content     Get-ChildItem
    Where-Object    Sort-Object     Measure-Object

The naming is not decoration. Because every command that reads something is
Get-something, you can discover the whole system:

    Get-Command *-Process        # every cmdlet about processes
    Get-Help Get-Content         # what it does, with examples
    Get-Help Get-Content -Full   # every parameter

That is the PowerShell equivalent of man, and it is better, because the help is
structured the same way for every command.

## Printing

    Write-Output "hello"     # the normal way; goes down the pipeline
    "hello"                  # a bare value is output too
    Write-Host "hello"       # forces text to the screen, skips the pipeline

Prefer Write-Output. Write-Host is for when you truly mean "put this on the
screen and nowhere else" — it cannot be captured or piped, which surprises people.

## Variables and strings

Variables start with a dollar sign. No declaration, no type keyword:

    $target = "10.10.10.5"
    $port = 22
    $ports = 22, 80, 443

Double quotes interpolate; single quotes are literal:

    Write-Output "Scanning $target"        # Scanning 10.10.10.5
    Write-Output 'Scanning $target'        # Scanning $target   (literal)

To drop an expression (not just a variable) into a string, wrap it in $( ):

    Write-Output "That is $($ports.Count) ports"

## A trap to remember

A few names are reserved automatic variables — the big one is **$host** (it is
the console host object). Reach for $target, $ip or $hostname instead of $host,
or you will get behaviour you did not write.
`,
  exercises: [
    {
      id: 'hello',
      kind: 'powershell',
      prompt: 'Print exactly: `forge online`',
      starter: '',
      solution: 'Write-Output "forge online"',
      hints: ['Write-Output "..."'],
      check: ({ result }) =>
        clean(result.stdout) === 'forge online'
          ? { pass: true, message: 'That is a complete PowerShell program.' }
          : { pass: false, message: `Expected "forge online", got ${JSON.stringify(clean(result.stdout))}` },
    },
    {
      id: 'interp',
      kind: 'powershell',
      prompt:
        'Make two variables — `$target` set to `"10.10.10.5"` and `$port` set to the number `22` — then print `Scanning 10.10.10.5 on port 22` using string interpolation.',
      starter: '$target = \n$port = \n',
      solution: '$target = "10.10.10.5"\n$port = 22\nWrite-Output "Scanning $target on port $port"',
      hints: [
        'Double-quoted strings interpolate a $variable inside them.',
        'Write-Output "Scanning $target on port $port"',
      ],
      check: ({ result }) =>
        clean(result.stdout) === 'Scanning 10.10.10.5 on port 22'
          ? { pass: true, message: 'Interpolation done right — and note you never converted 22 to a string yourself.' }
          : { pass: false, message: `Expected "Scanning 10.10.10.5 on port 22", got ${JSON.stringify(clean(result.stdout))}` },
    },
    {
      id: 'discover',
      kind: 'quiz',
      prompt: 'You want to find the cmdlet that lists running processes but cannot remember its name. What gets you there fastest?',
      choices: [
        'Get-Command *process*',
        'ls /proc',
        'ps aux',
        'Search the internet',
      ],
      answer: 0,
      explain:
        'Because every cmdlet is Verb-Noun, Get-Command with a wildcard on the noun (*process*) lists every related command — here it surfaces Get-Process. Discoverability is designed in: the shell can describe itself. ls /proc and ps aux are the bash muscle-memory from the Kali track, and they do not exist as PowerShell cmdlets.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'objects',
  title: 'Everything is an object',
  minutes: 16,
  body: `
## The one idea that makes PowerShell different

In bash, a command prints text and the next command re-parses that text. That is
why the Kali track leaned on grep, cut and awk — you are forever slicing strings
back apart.

In PowerShell, a command emits **objects** with named properties, and the next
command works on those properties directly. No re-parsing. Compare:

    # bash: slice the text to get the size, hope the columns never move
    ls -l | awk '{print $5}'

    # PowerShell: ask the object for its Length property
    Get-ChildItem | Select-Object Name, Length

## Seeing what an object really is

When you are unsure what properties something has, pipe it to Get-Member:

    Get-ChildItem | Get-Member          # every property and method of a file object

That is the single most useful habit in PowerShell. You never have to guess the
column layout, because there are no columns — there are properties.

## The cmdlets you will use constantly

    Select-Object      pick properties, or -First / -Last N
    Sort-Object        sort by a property:  Sort-Object Length -Descending
    Measure-Object     count / sum / average:  Measure-Object -Sum
    Where-Object       keep only matching objects (next lesson)
    ForEach-Object     do something with each object (next lesson)

## Pulling one value out cleanly

Select-Object gives you an object with one property. Often you want the bare
value — the -ExpandProperty parameter does that:

    Get-ChildItem | Measure-Object | Select-Object -ExpandProperty Count

## The lab is right here

Your working directory is the same lab the Kali and Python tracks use:

    Get-ChildItem lab -Recurse -File      # every file under lab/
    Get-Content lab/logs/auth.log         # the SSH log you grepped in bash
`,
  exercises: [
    {
      id: 'count-files',
      kind: 'powershell',
      prompt:
        'Print the number of files (not folders) anywhere under the `lab` directory. Use the pipeline — do not count them by hand.',
      starter: '',
      solution: 'Get-ChildItem lab -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count',
      hints: [
        'Get-ChildItem has -Recurse (descend into subfolders) and -File (files only).',
        'Pipe into Measure-Object to count, then Select-Object -ExpandProperty Count for the bare number.',
      ],
      check: ({ result, h }) => {
        const expected = countFiles(path.join(h.ws, 'lab'));
        const got = parseInt(clean(result.stdout), 10);
        return got === expected
          ? { pass: true, message: `${expected} files — and you asked the objects, you did not parse ls output.` }
          : { pass: false, message: `Expected ${expected}, got ${JSON.stringify(clean(result.stdout))}` };
      },
    },
    {
      id: 'largest',
      kind: 'powershell',
      prompt:
        'Print the **name** of the single largest file under `lab` (by size), and nothing else.',
      starter: '',
      solution:
        'Get-ChildItem lab -Recurse -File | Sort-Object Length -Descending | Select-Object -First 1 -ExpandProperty Name',
      hints: [
        'Sort-Object Length -Descending puts the biggest first.',
        'Select-Object -First 1 -ExpandProperty Name gives just the top name.',
      ],
      check: ({ result }) =>
        clean(result.stdout) === 'auth.log'
          ? { pass: true, message: 'Sort by a property, take the first — no size math in your head.' }
          : { pass: false, message: `Expected "auth.log", got ${JSON.stringify(clean(result.stdout))}` },
    },
    {
      id: 'why-objects',
      kind: 'quiz',
      prompt: 'Why does `Get-ChildItem | Sort-Object Length` keep working even if a future PowerShell changes how a directory listing is displayed?',
      choices: [
        'It sorts on the object’s Length property, not on a column position in printed text',
        'It does not — any display change breaks it',
        'Because Sort-Object re-parses the text more carefully than awk',
        'Because PowerShell output has no formatting at all',
      ],
      answer: 0,
      explain:
        'The pipeline carries file OBJECTS, and Sort-Object reads their Length property directly. The on-screen formatting is applied only at the very end, for humans. That is exactly the fragility the bash track fought with awk \'{print $5}\', where a shifted column silently sorts the wrong field.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'filtering',
  title: 'Filtering: Where-Object and Select-String',
  minutes: 16,
  body: `
## Two ways to narrow things down

**Select-String** is grep: it searches text/files for a pattern and returns the
matching lines (as MatchInfo objects).

    Select-String -Path lab/logs/auth.log -Pattern "Failed password"

**Where-Object** is the filter for a pipeline of objects: it keeps only the ones
for which a condition is true. Inside the condition, $_ is "the current object".

    Get-Content lab/configs/targets.txt | Where-Object { $_ -match "99$" }

## The comparison operators are words

This trips up everyone once. PowerShell does not use > or ==. It uses:

    -eq  -ne        equal / not equal
    -gt  -lt        greater / less than
    -ge  -le        greater-or-equal / less-or-equal
    -match          regex match
    -like           wildcard match (uses * and ?)
    -contains       does this collection contain this item

So "is the size over 1000 bytes?" is:

    Where-Object { $_.Length -gt 1000 }

Why words and not symbols? Because < and > are already redirection in every
shell. Reusing them for comparison would be ambiguous, so PowerShell spells the
comparisons out.

## Counting matches

Select-String returns one object per match, so counting is the same pipeline as
before:

    Select-String -Path lab/logs/auth.log -Pattern "Failed password" |
        Measure-Object | Select-Object -ExpandProperty Count

(You can break a pipeline across lines after a | — PowerShell knows more is
coming.)
`,
  exercises: [
    {
      id: 'failed-count',
      kind: 'powershell',
      prompt:
        'Print how many lines in `lab/logs/auth.log` contain `Failed password`. (You counted these in bash with `grep -c` — this is the PowerShell version.)',
      starter: '',
      solution:
        'Select-String -Path lab/logs/auth.log -Pattern "Failed password" | Measure-Object | Select-Object -ExpandProperty Count',
      hints: [
        'Select-String -Path <file> -Pattern "Failed password" returns one match object per line.',
        'Pipe into Measure-Object and expand Count.',
      ],
      check: ({ result, h }) => {
        const expected = failedInfo(h).count;
        const got = parseInt(clean(result.stdout), 10);
        return got === expected
          ? { pass: true, message: `${expected} failed logins — the same answer as grep -c, reached through objects.` }
          : { pass: false, message: `Expected ${expected}, got ${JSON.stringify(clean(result.stdout))}` };
      },
    },
    {
      id: 'filter-ip',
      kind: 'powershell',
      prompt:
        'The file `lab/configs/targets.txt` has one IP per line. Print only the one whose last octet is `99`.',
      starter: '',
      solution: 'Get-Content lab/configs/targets.txt | Where-Object { $_ -match "99$" }',
      hints: [
        'Get-Content gives you the lines; pipe them into Where-Object.',
        'Inside the braces, $_ is the current line. Use -match with the regex 99$ (ends in 99).',
      ],
      check: ({ result }) =>
        clean(result.stdout) === '10.10.10.99'
          ? { pass: true, message: 'Where-Object keeps only the objects your condition likes.' }
          : { pass: false, message: `Expected "10.10.10.99", got ${JSON.stringify(clean(result.stdout))}` },
    },
    {
      id: 'dollar-underscore',
      kind: 'quiz',
      prompt: 'Inside `Where-Object { $_ -gt 100 }`, what is `$_`?',
      choices: [
        'The current object flowing through the pipeline at that moment',
        'The last command’s exit code',
        'A special variable meaning "all input at once"',
        'The number 100',
      ],
      answer: 0,
      explain:
        '$_ (also writable as $PSItem) is the current pipeline object — Where-Object and ForEach-Object run their script block once per item, with $_ bound to that item. It is the direct cousin of the loop variable you used in the bash and Python tracks, just supplied for you.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'files-text',
  title: 'Files, text and a little regex',
  minutes: 16,
  body: `
## Reading and writing files

    Get-Content file.txt              # read all lines
    Set-Content file.txt -Value "x"   # OVERWRITE with this content
    Add-Content file.txt -Value "y"   # APPEND one line

Set-Content replaces; Add-Content appends. Reaching for Set-Content when you
meant Add-Content is how people erase a log they wanted to grow — the exact same
danger as > versus >> in bash.

## Splitting and replacing text

    "a=b" -split "="        # -> a  b     (an array of two)
    "https=443" -replace "https=", ""     # -> 443

-split and -replace work on a single string or on a whole pipeline of them.

## Capturing part of a regex match

Select-String does not just find lines — each match remembers its regex groups.
This pulls the source IP out of every failed-login line:

    Select-String -Path lab/logs/auth.log -Pattern "from (\\d+\\.\\d+\\.\\d+\\.\\d+)" |
        ForEach-Object { $_.Matches.Groups[1].Value }

$_.Matches.Groups[1].Value is "the text captured by the first ( ) group". Pipe
that into Sort-Object -Unique to collapse duplicates, and you have distinct
attackers — a real triage move.
`,
  exercises: [
    {
      id: 'write-file',
      kind: 'powershell',
      prompt:
        'Create the file `lab/loot/found.txt` containing exactly the single line `pwned`. (This exercise is graded on the file you create, not on printed output.)',
      starter: '',
      solution: 'Set-Content -Path lab/loot/found.txt -Value "pwned"',
      hints: [
        'Set-Content -Path <file> -Value <text> writes (and overwrites) a file.',
        'The loot folder already exists in the lab.',
      ],
      check: ({ h }) => {
        if (!h.exists('lab/loot/found.txt')) return { pass: false, message: 'lab/loot/found.txt does not exist yet.' };
        const body = clean(h.read('lab/loot/found.txt'));
        return body === 'pwned'
          ? { pass: true, message: 'Set-Content wrote it. Note: Set-Content overwrites — Add-Content would have appended.' }
          : { pass: false, message: `The file should contain exactly "pwned", but holds ${JSON.stringify(body)}` };
      },
    },
    {
      id: 'unique-attackers',
      kind: 'powershell',
      prompt:
        'From `lab/logs/auth.log`, print how many **distinct** source IPs appear in `Failed password` lines. Capture the IP with a regex group, de-duplicate, then count.',
      starter: '',
      solution:
        'Select-String -Path lab/logs/auth.log -Pattern "Failed password for \\w+ from (\\d+\\.\\d+\\.\\d+\\.\\d+)" | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique | Measure-Object | Select-Object -ExpandProperty Count',
      hints: [
        'Match the line and capture the IP in a ( ) group: from (\\d+\\.\\d+\\.\\d+\\.\\d+)',
        'ForEach-Object { $_.Matches.Groups[1].Value } pulls out the captured IP.',
        'Sort-Object -Unique collapses duplicates before you Measure-Object them.',
      ],
      check: ({ result, h }) => {
        const expected = failedInfo(h).hosts;
        const got = parseInt(clean(result.stdout), 10);
        return got === expected
          ? { pass: true, message: `${expected} distinct attackers. A captured regex group plus Sort-Object -Unique is the whole trick.` }
          : { pass: false, message: `Expected ${expected}, got ${JSON.stringify(clean(result.stdout))}` };
      },
    },
    {
      id: 'set-vs-add',
      kind: 'quiz',
      prompt: 'You want to keep appending new lines to a running report file across many runs. Which cmdlet?',
      choices: [
        'Add-Content — it appends to the end',
        'Set-Content — it appends to the end',
        'Get-Content — it appends to the end',
        'Write-Output — it appends to the end',
      ],
      answer: 0,
      explain:
        'Add-Content appends; Set-Content REPLACES the whole file every time, so using it in a loop leaves you with only the last line. It is the > (overwrite) versus >> (append) distinction from the bash track, wearing cmdlet names.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'logic',
  title: 'Variables, logic and loops',
  minutes: 15,
  body: `
## Arrays and hashtables

    $ports = @(22, 80, 443)      # an array
    $ports[0]                    # 22
    $ports.Count                 # 3

    $svc = @{ ssh = 22; http = 80 }   # a hashtable (key -> value)
    $svc["ssh"]                       # 22

## if / elseif / else

    if ($port -eq 22) {
        Write-Output "ssh"
    } elseif ($port -eq 80) {
        Write-Output "http"
    } else {
        Write-Output "other"
    }

Remember the word-operators from the filtering lesson: -eq, not ==.

## Looping

    foreach ($p in $ports) {
        Write-Output "checking $p"
    }

ForEach-Object is the pipeline form of the same idea; foreach is the statement
form for when you already have a collection in hand.

## The 5.1 vs 7 gotcha worth knowing now

If you write PowerShell that must run on the built-in Windows PowerShell 5.1
(the one on every Windows box), a few conveniences from 7 are simply missing:

    a && b        # NO in 5.1 — chain with ;  or use if ($?) { b }
    $x ? y : z    # NO ternary in 5.1
    $a ?? $b      # NO null-coalescing in 5.1

This track sticks to what works in both. When you know a machine has pwsh 7, the
newer operators are yours.
`,
  exercises: [
    {
      id: 'sum-ports',
      kind: 'powershell',
      prompt: 'Make an array of the numbers `22`, `80` and `443`, then print their **sum** using the pipeline.',
      starter: '$ports = \n',
      solution: '$ports = @(22, 80, 443)\n($ports | Measure-Object -Sum).Sum',
      hints: [
        'An array literal is @(22, 80, 443).',
        'Measure-Object -Sum computes the sum; grab it with (... ).Sum',
      ],
      check: ({ result }) =>
        parseInt(clean(result.stdout), 10) === 545
          ? { pass: true, message: 'Measure-Object does the arithmetic on the objects for you.' }
          : { pass: false, message: `Expected 545, got ${JSON.stringify(clean(result.stdout))}` },
    },
    {
      id: 'service-lookup',
      kind: 'powershell',
      prompt:
        'The file `lab/configs/services.conf` has `name=port` lines. Print just the port number for `https` (the digits only, no `https=`).',
      starter: '',
      solution: '(Get-Content lab/configs/services.conf | Where-Object { $_ -like "https=*" }) -replace "https=", ""',
      hints: [
        'Filter to the https line with Where-Object { $_ -like "https=*" }.',
        'Strip the label with -replace "https=", ""',
      ],
      check: ({ result }) =>
        clean(result.stdout) === '443'
          ? { pass: true, message: 'Filter to the line, then -replace the label away — no cut -d= needed.' }
          : { pass: false, message: `Expected "443", got ${JSON.stringify(clean(result.stdout))}` },
    },
    {
      id: 'no-ampersand',
      kind: 'quiz',
      prompt: 'On the built-in Windows PowerShell 5.1, `Get-Process && Get-Service` does what?',
      choices: [
        'Errors — 5.1 has no && operator; run them separated by ; instead',
        'Runs both only if the first succeeds, same as bash',
        'Runs them in parallel',
        'Runs only the second command',
      ],
      answer: 0,
      explain:
        'The && and || chain operators arrived in PowerShell 7; on 5.1 they are a parse error. To run commands in sequence on 5.1 use ; and, if you need "only on success", if ($?) { ... } where $? holds whether the last command succeeded. Writing to the common subset is what lets this track run on both.',
    },
  ],
},

// ---------------------------------------------------------------------------
{
  id: 'triage-tool',
  title: 'A real triage tool',
  minutes: 18,
  body: `
## Putting it together

You now have every piece to turn a raw log into an answer a human can act on. The
capstone is the same one the Python track builds toward, in PowerShell's idiom:
read the log, pull structured values out of unstructured lines, and summarise.

## Grouping — the cmdlet bash never had

Group-Object buckets objects by a value and counts each bucket. This is how you
find the noisiest source without a sort-uniq-sort dance:

    ... | Group-Object | Sort-Object Count -Descending

Each group has a Name (the value) and a Count (how many). Take the first after
sorting descending and you have the worst offender.

## Building a summary line

Collect the failed-login source IPs, then report both totals in one string:

    $failed = Select-String -Path lab/logs/auth.log -Pattern "Failed password"
    $ips = $failed | ForEach-Object { ($_.Line -split " from ")[1].Split(" ")[0] }
    $hosts = $ips | Sort-Object -Unique
    Write-Output "$($failed.Count) failed logins from $($hosts.Count) hosts"

Note $_.Line — a Select-String match knows the full text of the line it matched,
so you split that rather than the match object itself.
`,
  exercises: [
    {
      id: 'summary-line',
      kind: 'powershell',
      prompt:
        'From `lab/logs/auth.log`, print one line in exactly this shape: `<N> failed logins from <M> hosts`, where N is the number of `Failed password` lines and M is the number of distinct source IPs among them.',
      starter: '',
      solution:
        '$failed = Select-String -Path lab/logs/auth.log -Pattern "Failed password"\n$hosts = $failed | ForEach-Object { ($_.Line -split " from ")[1].Split(" ")[0] } | Sort-Object -Unique\nWrite-Output "$($failed.Count) failed logins from $($hosts.Count) hosts"',
      hints: [
        'Save the Select-String results in a variable so you can use .Count and re-pipe them.',
        'Split each matched line on " from " and take the first word of the second half for the IP.',
        'Build the sentence with $( ) subexpressions: "$($failed.Count) failed logins from $($hosts.Count) hosts"',
      ],
      check: ({ result, h }) => {
        const { count, hosts } = failedInfo(h);
        const expected = `${count} failed logins from ${hosts} hosts`;
        return clean(result.stdout) === expected
          ? { pass: true, message: `"${expected}" — a raw log turned into a sentence a human can act on.` }
          : { pass: false, message: `Expected "${expected}", got ${JSON.stringify(clean(result.stdout))}` };
      },
    },
    {
      id: 'noisiest',
      kind: 'powershell',
      prompt:
        'Print just the single source IP responsible for the **most** `Failed password` attempts in `lab/logs/auth.log`.',
      starter: '',
      solution:
        '$failed = Select-String -Path lab/logs/auth.log -Pattern "Failed password"\n$failed | ForEach-Object { ($_.Line -split " from ")[1].Split(" ")[0] } | Group-Object | Sort-Object Count -Descending | Select-Object -First 1 -ExpandProperty Name',
      hints: [
        'Extract the IP from each failed line as in the previous exercise.',
        'Group-Object buckets identical IPs and counts them.',
        'Sort-Object Count -Descending, then Select-Object -First 1 -ExpandProperty Name.',
      ],
      check: ({ result }) =>
        clean(result.stdout) === '10.10.10.99'
          ? { pass: true, message: 'Group-Object plus a descending sort is the whole answer — no uniq -c | sort -rn pipeline.' }
          : { pass: false, message: `Expected "10.10.10.99", got ${JSON.stringify(clean(result.stdout))}` },
    },
    {
      id: 'when-powershell',
      kind: 'quiz',
      prompt: 'You have a stream of records where you keep needing the same three fields by name. When is PowerShell the better reach than a bash pipeline?',
      choices: [
        'When the data has structure worth keeping — objects with named fields beat re-slicing text at every step',
        'Never — bash text pipelines are always faster to write',
        'Only on Windows; PowerShell cannot run anywhere else',
        'Only for one-line commands',
      ],
      answer: 0,
      explain:
        'The moment you find yourself re-parsing the same text to get at fields you already identified, the object pipeline pays off: you name the field once and every later step reads it directly. bash still wins for quick glue over line-oriented text — and with pwsh on Linux you can pick per task, on the same box.',
    },
  ],
},

  ],
};
