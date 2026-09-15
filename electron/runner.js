/**
 * runner.js — the part of Forge that actually executes your code.
 *
 * WHY THIS LIVES IN THE MAIN PROCESS
 * Electron has two kinds of process:
 *   - the "main" process: plain Node.js. It can touch the filesystem, spawn
 *     programs, open windows. There is exactly one.
 *   - the "renderer" process: a Chromium tab running your React UI. It runs with
 *     `contextIsolation` on and `nodeIntegration` off, so the page itself cannot
 *     `require()` Node or spawn `python3` directly.
 * Spawning interpreters is a Node job, so it belongs here; the renderer asks for
 * it over IPC (see preload.js). Note this is not a sandbox against the LEARNER:
 * the code Forge runs is the learner's own, executed with the learner's own
 * privileges, on purpose. See SECURITY.md for the trust model.
 *
 * WHY spawn() AND NOT exec()
 * exec() hands your string to a shell and buffers everything into memory. spawn()
 * gives us a stream we can cap, and (with `detached: true`) a process GROUP we
 * can kill as a unit. An infinite loop in a lesson should not survive.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const MAX_OUTPUT = 100 * 1024; // 100 KB. A runaway print loop won't eat your RAM.
const DEFAULT_TIMEOUT = 10_000; // ms

// Forge runs on Linux and Windows. Almost everything is shared; the handful of
// places that must differ (how you kill a process tree, what the interpreters
// are called, which directories hold them) all branch on this one flag.
const IS_WIN = process.platform === 'win32';

/**
 * The workspace is a real directory on disk that lesson exercises read and
 * write. It is the DEFAULT working directory for everything Forge runs, so a
 * lesson's `open("lab/logs/auth.log")` resolves to the seeded lab files.
 *
 * It is NOT a security boundary. Forge runs your Python, Node and shell with
 * your own OS privileges — teaching the real command line requires nothing less
 * — so code you run can `cd` out, read your home directory, or reach the
 * network exactly as your own terminal can. The workspace just gives lessons a
 * predictable place to work and keeps the everyday `rm`/`chmod` practice off
 * your real files. Trust model: see SECURITY.md. Don't paste code you don't
 * trust into Forge, the same rule as pasting it into a terminal.
 */
function workspaceDir() {
  return path.join(os.homedir(), '.forge', 'workspace');
}

/**
 * Seed the workspace with a small, predictable "lab" so Linux exercises have
 * something concrete to grep, chmod and count. Idempotent: safe to call at every
 * launch. `resetWorkspace()` wipes and re-seeds it when you break something.
 */
function ensureWorkspace() {
  const root = workspaceDir();
  fs.mkdirSync(root, { recursive: true });

  const lab = path.join(root, 'lab');
  if (!fs.existsSync(lab)) {
    fs.mkdirSync(lab, { recursive: true });
    fs.mkdirSync(path.join(lab, 'logs'), { recursive: true });
    fs.mkdirSync(path.join(lab, 'configs'), { recursive: true });
    fs.mkdirSync(path.join(lab, 'loot'), { recursive: true });

    fs.writeFileSync(
      path.join(lab, 'logs', 'auth.log'),
      [
        'Sep 11 08:14:02 target sshd[1201]: Accepted password for anon from 10.10.10.5 port 51022 ssh2',
        'Sep 11 08:15:44 target sshd[1244]: Failed password for root from 10.10.10.99 port 40122 ssh2',
        'Sep 11 08:15:46 target sshd[1244]: Failed password for root from 10.10.10.99 port 40122 ssh2',
        'Sep 11 08:15:49 target sshd[1244]: Failed password for root from 10.10.10.99 port 40122 ssh2',
        'Sep 11 08:16:01 target sshd[1251]: Failed password for admin from 10.10.10.99 port 40188 ssh2',
        'Sep 11 08:19:12 target sudo: anon : TTY=pts/0 ; PWD=/home/anon ; USER=root ; COMMAND=/usr/bin/apt update',
        'Sep 11 09:02:33 target sshd[1390]: Accepted publickey for anon from 10.10.10.5 port 51188 ssh2',
        'Sep 11 09:40:10 target sshd[1455]: Failed password for root from 10.10.10.42 port 33990 ssh2',
        '',
      ].join('\n')
    );

    fs.writeFileSync(
      path.join(lab, 'logs', 'access.log'),
      [
        '10.10.10.5 - - [11/Sep/2026:08:14:02] "GET /index.html HTTP/1.1" 200 5120',
        '10.10.10.99 - - [11/Sep/2026:08:15:44] "GET /admin HTTP/1.1" 403 199',
        '10.10.10.99 - - [11/Sep/2026:08:15:45] "GET /.env HTTP/1.1" 404 199',
        '10.10.10.99 - - [11/Sep/2026:08:15:46] "GET /wp-login.php HTTP/1.1" 404 199',
        '10.10.10.5 - - [11/Sep/2026:08:20:00] "POST /login HTTP/1.1" 200 812',
        '',
      ].join('\n')
    );

    fs.writeFileSync(
      path.join(lab, 'configs', 'targets.txt'),
      ['10.10.10.1', '10.10.10.5', '10.10.10.42', '10.10.10.99', '10.10.10.150', ''].join('\n')
    );
    fs.writeFileSync(
      path.join(lab, 'configs', 'services.conf'),
      ['ssh=22', 'http=80', 'https=443', 'smb=445', 'rdp=3389', ''].join('\n')
    );
    fs.writeFileSync(path.join(lab, 'loot', 'notes.md'), '# Engagement notes\n\n- scope: 10.10.10.0/24\n');
    fs.writeFileSync(path.join(lab, 'readme.txt'), 'This lab folder is yours to break. Reset it any time from the sidebar.\n');
  }
  return root;
}

function resetWorkspace() {
  const root = workspaceDir();
  fs.rmSync(root, { recursive: true, force: true });
  return ensureWorkspace();
}

/**
 * PATH resolution — why this exists.
 *
 * Forge runs your code through `bash -lc`, a LOGIN shell. A login shell sources
 * /etc/profile, and on Debian and Kali that file sets PATH explicitly — which
 * can DISCARD entries it inherited from the parent process.
 *
 * That breaks a very common setup: Node installed through nvm, fnm or volta
 * puts its bin directory on PATH from ~/.zshrc. Bash never reads ~/.zshrc at
 * all, so `bash -lc "node --version"` reports "command not found" on a machine
 * where `node -v` works perfectly in the user's own terminal. The app then
 * announces that Node is missing while the terminal two inches away disagrees.
 *
 * The fix has two halves:
 *   1. Compose a PATH from what Electron inherited PLUS the well-known version
 *      -manager directories, keeping only ones that exist.
 *   2. Export it INSIDE the command string. The -c command runs after the login
 *      files have been sourced, so an export there is the last word — whereas
 *      passing it in `env` alone would be overwritten by /etc/profile.
 *
 * Computed once per launch and cached: globbing the home directory on every
 * single exercise submission would be wasteful.
 */
let cachedPath = null;

function candidateBinDirs() {
  const home = os.homedir();
  const dirs = [];

  // Version managers install into a per-version directory, so glob for them.
  const globRoots = [
    { root: path.join(home, '.nvm', 'versions', 'node'), tail: ['bin'] },
    { root: path.join(home, '.local', 'share', 'fnm', 'node-versions'), tail: ['installation', 'bin'] },
    { root: path.join(home, '.nodenv', 'versions'), tail: ['bin'] },
    { root: path.join(home, '.pyenv', 'versions'), tail: ['bin'] },
  ];
  for (const { root, tail } of globRoots) {
    try {
      for (const entry of fs.readdirSync(root)) {
        dirs.push(path.join(root, entry, ...tail));
      }
    } catch {
      /* that manager is not installed — normal */
    }
  }

  if (IS_WIN) {
    // Windows equivalents. The Store's `python3` alias is a stub that opens the
    // Store instead of running Python, so the real installs under
    // %LOCALAPPDATA%\Programs\Python must come first on PATH. Git for Windows
    // supplies the `bash` the Linux track needs, when it is installed at all.
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const local = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    try {
      const pyRoot = path.join(local, 'Programs', 'Python');
      for (const entry of fs.readdirSync(pyRoot)) {
        dirs.push(path.join(pyRoot, entry), path.join(pyRoot, entry, 'Scripts'));
      }
    } catch { /* no user Python install — normal */ }
    dirs.push(
      path.join(pf, 'nodejs'),
      path.join(pf, 'PowerShell', '7'),
      path.join(local, 'Programs', 'Python', 'Launcher'),
      path.join(pf, 'Git', 'bin'),
      path.join(pf, 'Git', 'usr', 'bin'),
      'C:\\Windows\\System32\\WindowsPowerShell\\v1.0'
    );
  } else {
    dirs.push(
      path.join(home, '.volta', 'bin'),
      path.join(home, '.bun', 'bin'),
      path.join(home, '.local', 'bin'),
      '/usr/local/bin',
      '/usr/bin',
      '/bin',
      '/usr/sbin',
      '/sbin',
      '/snap/bin'
    );
  }
  return dirs.filter((d) => fs.existsSync(d));
}

function composedPath() {
  if (cachedPath) return cachedPath;
  const inherited = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const seen = new Set();
  const merged = [];
  for (const dir of [...inherited, ...candidateBinDirs()]) {
    if (!seen.has(dir)) {
      seen.add(dir);
      merged.push(dir);
    }
  }
  cachedPath = merged.join(path.delimiter);
  return cachedPath;
}

/**
 * Run one child process and resolve with everything we learned about it.
 * Never rejects on a non-zero exit — a failing program is a normal outcome in a
 * learning app, not an exception.
 */
function execute(command, args, { cwd, stdin = '', timeout = DEFAULT_TIMEOUT, env } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    let child;
    try {
      child = spawn(command, args, {
        cwd: cwd || ensureWorkspace(),
        // On POSIX, detached puts the child in its own process group, so
        // killing -pid takes the child AND anything it spawned. Windows has no
        // process groups to signal this way — we kill the tree with taskkill
        // instead (see the timer below) — and detaching there would only risk a
        // stray console window, so it stays off.
        detached: !IS_WIN,
        windowsHide: true,
        env: { ...process.env, PATH: composedPath(), ...(env || {}) },
      });
    } catch (err) {
      return resolve({
        stdout: '',
        stderr: `Forge could not start "${command}": ${err.message}`,
        exitCode: 127,
        timedOut: false,
        ms: 0,
      });
    }

    let stdout = '';
    let stderr = '';
    let truncated = false;
    let timedOut = false;
    let finished = false;

    // Cap each stream at exactly MAX_OUTPUT. A single stream chunk can be tens of
    // KB, so a naive "if we're under the limit, append the whole chunk" lets one
    // chunk sail past the cap — the accumulated buffer could end up MAX_OUTPUT
    // plus almost a full chunk. Slice each chunk to the remaining room instead.
    const append = (which, chunk) => {
      const text = chunk.toString();
      if (which === 'out') {
        const room = MAX_OUTPUT - stdout.length;
        if (room > 0) stdout += text.slice(0, room);
        if (text.length > room) truncated = true;
      } else {
        const room = MAX_OUTPUT - stderr.length;
        if (room > 0) stderr += text.slice(0, room);
        if (text.length > room) truncated = true;
      }
    };

    child.stdout.on('data', (c) => append('out', c));
    child.stderr.on('data', (c) => append('err', c));

    const timer = setTimeout(() => {
      timedOut = true;
      if (IS_WIN) {
        // Negative-PID group signalling does not exist on Windows. taskkill /T
        // walks the child's whole tree, /F forces it — the equivalent of killing
        // the POSIX process group, so a runaway that spawned children still dies
        // as a unit.
        try {
          spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
        } catch {
          try { child.kill(); } catch { /* already gone */ }
        }
      } else {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          try { child.kill('SIGKILL'); } catch { /* already gone */ }
        }
      }
    }, timeout);

    const done = (exitCode) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({
        stdout: truncated ? stdout + '\n...[output truncated by Forge]' : stdout,
        stderr,
        exitCode,
        timedOut,
        ms: Date.now() - started,
      });
    };

    child.on('error', (err) => {
      stderr += `\n${err.message}`;
      done(127);
    });
    child.on('close', (code) => done(code === null ? 137 : code));

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

/**
 * Interpreter names differ across platforms, so resolve each one to whatever
 * actually runs on THIS machine and cache the answer:
 *   - Python is `python3` on Linux, but on Windows the `python3` name is a
 *     Microsoft Store stub that opens the Store rather than running Python — so
 *     there we try the `py -3` launcher and the real `python` first.
 *   - PowerShell 7 (`pwsh`) is the cross-platform target and works on both OSes;
 *     where it is absent on Windows we fall back to the built-in Windows
 *     PowerShell 5.1 (`powershell`). On Linux there is no 5.1 to fall back to.
 * `undefined` means "not resolved yet"; `null` means "resolved, nothing works".
 */
const resolved = {};

async function resolveCmd(key, candidates, probeArgs) {
  if (resolved[key] !== undefined) return resolved[key];
  for (const cand of candidates) {
    const [cmd, ...pre] = cand.split(' ');
    const r = await execute(cmd, [...pre, ...probeArgs], { timeout: 8000 });
    if (r.exitCode === 0) { resolved[key] = cand; return cand; }
  }
  resolved[key] = null;
  return null;
}

const pythonCmd = () =>
  resolveCmd('python', IS_WIN ? ['py -3', 'python', 'python3'] : ['python3', 'python'], ['--version']);
const powershellCmd = () =>
  resolveCmd('pwsh', IS_WIN ? ['pwsh', 'powershell'] : ['pwsh'], ['-NoProfile', '-Command', 'exit 0']);

function notFound(label, hint) {
  return {
    stdout: '',
    stderr: `Forge could not find ${label} on this machine.${hint ? ' ' + hint : ''}`,
    exitCode: 127,
    timedOut: false,
    ms: 0,
  };
}

/** Write code to a temp file and run it with the given interpreter + pre-args. */
async function runInterpreted(command, preArgs, extension, code, opts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-'));
  const file = path.join(dir, `main${extension}`);
  fs.writeFileSync(file, code, 'utf8');
  try {
    // cwd is the workspace, NOT the temp dir, so `open('lab/logs/auth.log')`
    // inside a lesson resolves to the lab files.
    return await execute(command, [...preArgs, file], { cwd: ensureWorkspace(), ...opts });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function runPython(code, opts) {
  const cmd = await pythonCmd();
  if (!cmd) return notFound('Python 3', 'Install it and reopen Forge.');
  const [bin, ...pre] = cmd.split(' ');
  return runInterpreted(bin, pre, '.py', code, opts);
}

const runNode = (code, opts) => runInterpreted('node', [], '.js', code, opts);

/**
 * Run PowerShell from a temp .ps1 file. `-NoProfile` keeps a user's profile from
 * changing behaviour between machines; `-NonInteractive` stops a lesson that asks
 * for input from hanging forever. On Windows `-ExecutionPolicy Bypass` is needed
 * because the default policy blocks running script files at all — on Linux there
 * is no execution policy, so the flag is Windows-only.
 */
async function runPowerShell(code, opts) {
  const cmd = await powershellCmd();
  if (!cmd) {
    return notFound(
      'PowerShell',
      IS_WIN ? '' : 'Install PowerShell 7 (pwsh) to take this track on Linux.'
    );
  }
  const pre = ['-NoProfile', '-NonInteractive'];
  if (IS_WIN) pre.push('-ExecutionPolicy', 'Bypass');
  return runInterpreted(cmd, pre, '.ps1', code, opts);
}

/**
 * Run a bash command the way your terminal would.
 * `bash -lc` gives you a login shell, so PATH, aliases and $HOME behave like a
 * normal Kali terminal. We deliberately do NOT give you a full TTY (see README)
 * — interactive programs like vim or less will not work here, by design.
 *
 * On Linux we re-export a composed PATH inside the command, because /etc/profile
 * can discard it (see the note above composedPath). On Windows, bash comes from
 * Git for Windows and manages its own POSIX-style PATH; injecting a Windows PATH
 * string would only corrupt it, so there we just run the command as-is — and if
 * bash is not installed, execute() returns a clean 127 the toolchain banner
 * explains.
 */
const runShell = (command, opts) =>
  IS_WIN
    ? execute('bash', ['-lc', command], opts)
    : execute('bash', ['-lc', `export PATH=${JSON.stringify(composedPath())}; ${command}`], opts);

const firstLine = (r) => (r.stdout || r.stderr || '').trim().split('\n')[0];

/**
 * Probe which interpreters exist, so the UI can warn instead of failing weirdly.
 * Each language is probed through the SAME command an exercise will actually run
 * — resolving `py -3` vs `python3`, `pwsh` vs `powershell` — so the banner can
 * never claim a tool is present that a lesson then fails to find.
 */
async function probeToolchain() {
  const out = {};

  const py = await pythonCmd();
  if (py) {
    const [bin, ...pre] = py.split(' ');
    const r = await execute(bin, [...pre, '--version'], { timeout: 5000 });
    out.python = { available: r.exitCode === 0, version: firstLine(r), cmd: py };
  } else {
    out.python = { available: false, version: '', cmd: null };
  }

  {
    const r = await execute('node', ['--version'], { timeout: 5000 });
    out.node = { available: r.exitCode === 0, version: firstLine(r) };
  }

  const ps = await powershellCmd();
  if (ps) {
    const r = await execute(ps, ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'], { timeout: 8000 });
    out.powershell = { available: r.exitCode === 0, version: firstLine(r), cmd: ps };
  } else {
    out.powershell = { available: false, version: '', cmd: null };
  }

  {
    // bash is probed the way it runs: a login shell on Linux, plain on Windows.
    const r = await runShell(IS_WIN ? 'bash --version' : 'bash --version | head -1', { timeout: 5000 });
    out.bash = { available: r.exitCode === 0, version: firstLine(r) };
  }

  {
    const r = await execute('git', ['--version'], { timeout: 5000 });
    out.git = { available: r.exitCode === 0, version: firstLine(r) };
  }

  return out;
}

module.exports = {
  runPython,
  runNode,
  runShell,
  runPowerShell,
  execute,
  probeToolchain,
  ensureWorkspace,
  resetWorkspace,
  workspaceDir,
};
