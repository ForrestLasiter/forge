/**
 * runner.js — the part of Forge that actually executes your code.
 *
 * WHY THIS LIVES IN THE MAIN PROCESS
 * Electron has two kinds of process:
 *   - the "main" process: plain Node.js. It can touch the filesystem, spawn
 *     programs, open windows. There is exactly one.
 *   - the "renderer" process: a Chromium tab running your React UI. For safety
 *     it is sandboxed and cannot spawn `python3` or read your disk.
 * Running untrusted-ish code is a Node job, so it belongs here. The renderer
 * asks for it over IPC (see preload.js).
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

/**
 * The workspace is a real directory on disk that lesson exercises read and
 * write. Keeping it separate from your home directory means a lesson that says
 * "delete every .tmp file" can never touch anything you care about.
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
        // detached puts the child in its own process group, so killing
        // -pid kills the child AND anything it spawned.
        detached: true,
        env: { ...process.env, ...(env || {}) },
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

    const append = (which, chunk) => {
      const text = chunk.toString();
      if (which === 'out') {
        if (stdout.length < MAX_OUTPUT) stdout += text;
        else truncated = true;
      } else if (stderr.length < MAX_OUTPUT) stderr += text;
      else truncated = true;
    };

    child.stdout.on('data', (c) => append('out', c));
    child.stderr.on('data', (c) => append('err', c));

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        try { child.kill('SIGKILL'); } catch { /* already gone */ }
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

/** Write code to a temp file and run it with the given interpreter. */
async function runInterpreted(interpreter, extension, code, opts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-'));
  const file = path.join(dir, `main${extension}`);
  fs.writeFileSync(file, code, 'utf8');
  try {
    // cwd is the workspace, NOT the temp dir, so `open('lab/logs/auth.log')`
    // inside a lesson resolves to the lab files.
    return await execute(interpreter, [file], { cwd: ensureWorkspace(), ...opts });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const runPython = (code, opts) => runInterpreted('python3', '.py', code, opts);
const runNode = (code, opts) => runInterpreted('node', '.js', code, opts);

/**
 * Run a shell command the way your terminal would.
 * `bash -lc` gives you a login shell, so PATH, aliases and $HOME behave like a
 * normal Kali terminal. We deliberately do NOT give you a full TTY (see README)
 * — interactive programs like vim or less will not work here, by design.
 */
const runShell = (command, opts) => execute('bash', ['-lc', command], opts);

/** Probe which interpreters exist, so the UI can warn instead of failing weirdly. */
async function probeToolchain() {
  const checks = {
    python3: 'python3 --version',
    node: 'node --version',
    bash: 'bash --version | head -1',
    git: 'git --version',
  };
  const out = {};
  for (const [name, cmd] of Object.entries(checks)) {
    const r = await execute('bash', ['-lc', cmd], { timeout: 5000 });
    out[name] = { available: r.exitCode === 0, version: (r.stdout || r.stderr).trim().split('\n')[0] };
  }
  return out;
}

module.exports = {
  runPython,
  runNode,
  runShell,
  execute,
  probeToolchain,
  ensureWorkspace,
  resetWorkspace,
  workspaceDir,
};
