/**
 * preload.js — the bridge.
 *
 * This file runs in a special context: it has access to Node AND to the page's
 * `window`, but the page itself still cannot reach Node. `contextBridge` copies
 * a frozen object onto `window.forge` containing only the functions we list.
 *
 * The rule this enforces: the page can reach Node only through exactly these
 * calls and nothing else — it cannot `require()`, open a raw socket, or read an
 * arbitrary file on its own. That is the contextIsolation boundary doing its job.
 *
 * What this does NOT do is sandbox the learner's code. Several of the calls below
 * (`run`, `shell`) exist precisely to execute code with the user's privileges, so
 * anything on `window.forge` is reachable by any script in the renderer, learner
 * JSX included. That is intended: Forge runs your own code. See SECURITY.md.
 *
 * `ipcRenderer.invoke` is the promise-based half of Electron IPC; the other side
 * is `ipcMain.handle` in main.js. Every call below has a matching handler there.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('forge', {
  curriculum: () => ipcRenderer.invoke('forge:curriculum'),
  submit: (payload) => ipcRenderer.invoke('forge:submit', payload),
  complete: (payload) => ipcRenderer.invoke('forge:complete', payload),
  run: (kind, code) => ipcRenderer.invoke('forge:run', { kind, code }),
  shell: (command, cwd) => ipcRenderer.invoke('forge:shell', { command, cwd }),

  progress: {
    get: () => ipcRenderer.invoke('forge:progress'),
    saveCode: (key, code) => ipcRenderer.invoke('forge:progress:save-code', { key, code }),
    setLast: (trackId, lessonId) => ipcRenderer.invoke('forge:progress:last', { trackId, lessonId }),
    reset: () => ipcRenderer.invoke('forge:progress:reset'),
  },

  workspace: {
    path: () => ipcRenderer.invoke('forge:workspace'),
    reset: () => ipcRenderer.invoke('forge:workspace:reset'),
    open: () => ipcRenderer.invoke('forge:workspace:open'),
  },

  toolchain: () => ipcRenderer.invoke('forge:toolchain'),
  openExternal: (url) => ipcRenderer.invoke('forge:open-external', url),
});
