/**
 * Scratch.jsx — a always-available command box for the sandbox workspace.
 *
 * Deliberately NOT a real terminal emulator. A true TTY needs a pseudo-terminal
 * (node-pty), which is a native module that has to be compiled against the exact
 * Electron build — a common source of "it won't install" pain, in exchange for
 * features (vim, less, colours, Ctrl-C) that this app does not need.
 *
 * So each submission is one `bash -lc` run in ~/.forge/workspace: no persistent
 * cd between commands, no interactive programs. Everything else behaves. When
 * you want the real thing, you have a real terminal a keystroke away, and that
 * is the right place to practise it.
 */

import React, { useState, useRef } from 'react';

export default function Scratch({ open, onToggle }) {
  const [cmd, setCmd] = useState('');
  const [log, setLog] = useState('');
  const [busy, setBusy] = useState(false);
  const history = useRef([]);
  const cursor = useRef(-1);

  async function submit(e) {
    e.preventDefault();
    const command = cmd.trim();
    if (!command || busy) return;
    history.current.unshift(command);
    cursor.current = -1;
    setBusy(true);
    setCmd('');
    const res = await window.forge.shell(command);
    setLog((prev) =>
      `${prev}${prev ? '\n' : ''}$ ${command}\n${res.stdout || ''}${res.stderr || ''}`.trimEnd()
    );
    setBusy(false);
  }

  /** Up/Down walk the command history, the way a shell does. */
  function onKeyDown(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      cursor.current = Math.min(cursor.current + 1, history.current.length - 1);
      setCmd(history.current[cursor.current] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      cursor.current = Math.max(cursor.current - 1, -1);
      setCmd(cursor.current === -1 ? '' : history.current[cursor.current]);
    }
  }

  return (
    <div className="scratch">
      <div className="scratch-head" onClick={onToggle}>
        <strong>Sandbox shell</strong>
        <span style={{ opacity: 0.65 }}>~/.forge/workspace</span>
        <span className="spacer" />
        <span>{open ? '▾ hide' : '▴ show'}</span>
      </div>
      {open && (
        <div className="scratch-body">
          {log && <pre>{log}</pre>}
          <form className="scratch-row" onSubmit={submit} style={{ marginTop: log ? 9 : 0 }}>
            <span className="prompt-sigil">$</span>
            <input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={busy ? 'running…' : 'try: ls -la lab'}
              disabled={busy}
              spellCheck={false}
            />
            <button type="button" className="ghost" onClick={() => setLog('')}>clear</button>
          </form>
        </div>
      )}
    </div>
  );
}
