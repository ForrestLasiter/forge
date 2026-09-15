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
import { EditorView } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';

export default function Editor({ value, onChange, kind, minHeight = '120px', label = 'Code editor' }) {
  const extensions = useMemo(() => {
    // Give the editor's contenteditable an accessible name so screen readers
    // announce it as a labelled text area, not an anonymous region (WCAG 4.1.2).
    const named = EditorView.contentAttributes.of({ 'aria-label': label });
    if (kind === 'python') return [python(), named];
    if (kind === 'node') return [javascript(), named];
    if (kind === 'react') return [javascript({ jsx: true }), named];
    return [named]; // shell: no grammar bundled, plain text is fine and honest
  }, [kind, label]);

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
