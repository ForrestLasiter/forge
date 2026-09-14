/**
 * main.js — the Electron entry point.
 *
 * MENTAL MODEL
 * An Electron app is a small Node.js program (this file) that opens one or more
 * Chromium windows. Think of it as: Node is the back end, Chromium is the front
 * end, and they live in the same app instead of talking over a network.
 *
 *   main.js        -> Node. Full OS access. Opens windows. Answers IPC calls.
 *   preload.js     -> runs just before the page loads, in a privileged bridge.
 *   src/*.jsx      -> React, running in Chromium with NO OS access.
 *
 * The security settings below (contextIsolation on, nodeIntegration off) are the
 * modern defaults and the reason a bug in the UI can't `rm -rf` your home dir.
 */

const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');

const runner = require('./runner');
const progress = require('./progress');
const lessons = require('./lessons');

const isDev = process.env.FORGE_DEV === '1';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#0f1419',
    title: 'Forge',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // The page cannot `require()` anything. It can only call the small,
      // explicit API we expose in preload.js.
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Any link to the outside world opens in the real browser, never inside the
  // app window — otherwise a stray click strands you with no back button.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

function buildMenu(win) {
  const template = [
    {
      label: 'Forge',
      submenu: [
        {
          label: 'Open workspace folder',
          click: () => shell.openPath(runner.workspaceDir()),
        },
        {
          label: 'Reset lab workspace',
          click: () => runner.resetWorkspace(),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  return win;
}

// ---------------------------------------------------------------------------
// IPC: the only door between the UI and the operating system.
// Every handler is named "forge:<thing>" so it is obvious in a stack trace.
// ---------------------------------------------------------------------------
function registerIpc() {
  ipcMain.handle('forge:curriculum', () => lessons.toSerialisable());

  ipcMain.handle('forge:submit', async (_evt, payload) => {
    const res = await lessons.submit(payload);
    const key = `${payload.trackId}/${payload.lessonId}/${payload.exerciseId}`;
    progress.recordAttempt(key);
    if (res.pass) progress.markComplete(key);
    return res;
  });

  // Used by React exercises: the renderer does the DOM assertions, then tells us
  // the verdict so progress is still recorded in one place.
  ipcMain.handle('forge:complete', (_evt, { trackId, lessonId, exerciseId }) => {
    return progress.markComplete(`${trackId}/${lessonId}/${exerciseId}`);
  });

  ipcMain.handle('forge:run', async (_evt, { kind, code }) => {
    if (kind === 'python') return runner.runPython(code);
    if (kind === 'node') return runner.runNode(code);
    if (kind === 'powershell') return runner.runPowerShell(code);
    return runner.runShell(code);
  });

  ipcMain.handle('forge:shell', async (_evt, { command, cwd }) => runner.runShell(command, { cwd }));

  ipcMain.handle('forge:progress', () => progress.load());
  ipcMain.handle('forge:progress:save-code', (_evt, { key, code }) => progress.saveCode(key, code));
  ipcMain.handle('forge:progress:last', (_evt, { trackId, lessonId }) => progress.setLastLesson(trackId, lessonId));
  ipcMain.handle('forge:progress:reset', () => progress.resetAll());

  ipcMain.handle('forge:workspace', () => runner.workspaceDir());
  ipcMain.handle('forge:workspace:reset', () => runner.resetWorkspace());
  ipcMain.handle('forge:workspace:open', () => shell.openPath(runner.workspaceDir()));
  ipcMain.handle('forge:toolchain', () => runner.probeToolchain());
  ipcMain.handle('forge:platform', () => process.platform);
  ipcMain.handle('forge:open-external', (_evt, url) => shell.openExternal(url));
}

/**
 * Smoke test hook.
 * `FORGE_SMOKE=1 electron .` launches the real app, waits for the UI to finish
 * loading the curriculum, reports what it found, and exits. It is how CI (and
 * `npm run smoke`) proves the window actually renders rather than showing the
 * white screen of a broken build — the one bug a headless test suite otherwise
 * cannot see.
 */
async function runSmokeTest(win) {
  const probe = `
    (async () => {
      for (let i = 0; i < 60; i++) {
        const tabs = document.querySelectorAll('.track-tab').length;
        if (tabs > 0) {
          return {
            ok: true,
            tracks: tabs,
            lesson: document.querySelector('.lesson-head h1')?.textContent || null,
            exercises: document.querySelectorAll('.exercise').length,
            paragraphs: document.querySelectorAll('.md p').length,
          };
        }
        await new Promise(r => setTimeout(r, 250));
      }
      return { ok: false, html: document.body.innerHTML.slice(0, 400) };
    })()
  `;
  // Phase 2 drives the UI the way a person would, to prove the paths that a
  // headless test cannot reach: the IPC bridge, and the React preview (which
  // compiles JSX with Babel in the page and grades the mounted DOM).
  const drive = `
    (async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const click = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const byText = (sel, text) =>
        [...document.querySelectorAll(sel)].find(e => e.textContent.trim().toLowerCase().includes(text));

      // (a) the preload bridge really executes code in the main process
      const ipc = await window.forge.submit({
        trackId: 'python', lessonId: 'first-program', exerciseId: 'hello',
        code: 'print("forge online")',
      });

      // (b) drive the React track's first exercise to a pass
      const reactTab = byText('.track-tab', 'react');
      if (!reactTab) return { ok: false, stage: 'no react tab' };
      click(reactTab);
      await wait(500);

      const ex = document.querySelector('.exercise');
      if (!ex) return { ok: false, stage: 'no exercise' };

      click(byText('.controls button', 'reveal solution'));
      await wait(150);
      const load = byText('.out-head button', 'load into editor');
      if (!load) return { ok: false, stage: 'no load button' };
      click(load);
      await wait(900);                       // editor debounce + recompile

      click(byText('.controls button', 'check answer'));
      for (let i = 0; i < 40; i++) {
        const v = document.querySelector('.exercise .verdict');
        if (v) return {
          ok: ipc.pass && v.classList.contains('pass'),
          ipcPass: ipc.pass,
          reactVerdict: v.textContent.trim().slice(0, 120),
          previewMounted: !!document.querySelector('.preview-surface h1'),
        };
        await wait(150);
      }
      return { ok: false, stage: 'no verdict', ipcPass: ipc.pass };
    })()
  `;

  /**
   * FORGE_SHOT_DIR=<dir> captures the README screenshots.
   * Doing it from inside the app (rather than asking a human to press
   * PrtScn) means the images in the docs can never drift from the code —
   * regenerate them with `npm run screenshots` after any UI change.
   */
  const shotDir = process.env.FORGE_SHOT_DIR;
  async function shot(name, prepJs) {
    if (!shotDir) return;
    if (prepJs) await win.webContents.executeJavaScript(`(async () => { ${prepJs} })()`);
    await new Promise((r) => setTimeout(r, 450));
    const image = await win.webContents.capturePage();
    const file = path.join(shotDir, `${name}.png`);
    require('fs').mkdirSync(shotDir, { recursive: true });
    require('fs').writeFileSync(file, image.toPNG());
    console.log('SMOKE-SHOT ' + file);
  }

  try {
    const result = await win.webContents.executeJavaScript(probe);
    console.log('SMOKE-RENDER ' + JSON.stringify(result));
    if (!result.ok) return app.exit(1);

    // A reading view, before anything is driven.
    await shot('01-lesson', `
      const wait = ms => new Promise(r => setTimeout(r, ms));
      document.querySelector('.main').scrollTo({ top: 0 });
      await wait(200);
    `);

    // A terminal exercise, run and passed, showing real output.
    await shot('02-terminal', `
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const click = el => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const byText = (sel, t) => [...document.querySelectorAll(sel)]
        .find(e => e.textContent.trim().toLowerCase().includes(t));
      const tab = byText('.track-tab', 'kali');
      click(tab); await wait(400);
      const lesson = byText('.lesson-link .name', 'grep, find');
      click(lesson && lesson.closest('.lesson-link')); await wait(400);
      const ex = document.querySelectorAll('.exercise')[2];
      click(byText('.controls button', 'reveal solution')); await wait(150);
      click(byText('.out-head button', 'load into editor')); await wait(300);
      const cards = [...document.querySelectorAll('.exercise')];
      const card = cards[0];
      click([...card.querySelectorAll('.controls button')].find(b => /check/i.test(b.textContent)));
      await wait(1800);
      card.scrollIntoView({ block: 'start' });
      await wait(300);
    `);

    const driven = await win.webContents.executeJavaScript(drive);
    console.log('SMOKE-DRIVE ' + JSON.stringify(driven));

    // The React preview, compiled, mounted and graded.
    await shot('03-react', `
      const wait = ms => new Promise(r => setTimeout(r, ms));
      document.querySelector('.exercise').scrollIntoView({ block: 'start' });
      await wait(250);
    `);

    // Backwards-compatible single-file capture.
    if (process.env.FORGE_SHOT) {
      const image = await win.webContents.capturePage();
      require('fs').writeFileSync(process.env.FORGE_SHOT, image.toPNG());
      console.log('SMOKE-SHOT ' + process.env.FORGE_SHOT);
    }
    app.exit(driven.ok ? 0 : 1);
  } catch (err) {
    console.log('SMOKE ' + JSON.stringify({ ok: false, error: String(err) }));
    app.exit(1);
  }
}

app.whenReady().then(() => {
  runner.ensureWorkspace();
  registerIpc();
  const smokeWin = createWindow();
  buildMenu(smokeWin);
  if (process.env.FORGE_SMOKE === '1') {
    smokeWin.webContents.once('did-finish-load', () => runSmokeTest(smokeWin));
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) buildMenu(createWindow());
  });
});

app.on('window-all-closed', () => {
  // On Linux and Windows, closing the last window means quit. macOS differs,
  // which is why almost every Electron app carries this exact four-line block.
  if (process.platform !== 'darwin') app.quit();
});
