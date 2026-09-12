/**
 * preload.js — the bridge.
 *
 * This file runs in a special context: it has access to Node AND to the page's
 * `window`, but the page itself still cannot reach Node. `contextBridge` copies
 * a frozen object onto `window.forge` containing only the functions we list.
 *
 * The rule this enforces: the UI can ask for exactly these nine things and
 * nothing else. If a lesson body ever contained hostile HTML, the worst it could
 * do is call one of these — not open a socket or read /etc/shadow.
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
