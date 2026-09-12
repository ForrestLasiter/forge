/**
 * Editor.jsx — a thin wrapper around CodeMirror 6.
 *
 * Why a wrapper at all: the rest of the app should not need to know which
 * editor library is underneath. It passes `kind` ("python" | "node" | "react" |
 * "shell") and gets syntax highlighting; if this ever becomes Monaco instead,
 * only this file changes.
 *
 * Note `extensions` is memoised. CodeMirror reconfigures itself whenever that
 * array is a new object, and a component re-renders on every keystroke — so
 * building the array inline would tear down and rebuild the editor's language
 * support on every character you type.
 */

import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';

export default function Editor({ value, onChange, kind, minHeight = '120px' }) {
  const extensions = useMemo(() => {
    if (kind === 'python') return [python()];
    if (kind === 'node') return [javascript()];
    if (kind === 'react') return [javascript({ jsx: true })];
    return []; // shell: no grammar bundled, plain text is fine and honest
  }, [kind]);

  return (
    <div className="editor-wrap">
      <CodeMirror
        value={value}
        theme="dark"
        extensions={extensions}
        minHeight={minHeight}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          autocompletion: false, // autocomplete while learning syntax teaches you less
        }}
      />
    </div>
  );
}
