/**
 * ReactPreview.jsx — compiles and runs your JSX, then grades it.
 *
 * HOW THIS WORKS, because it is the most interesting file in the app:
 *
 * 1. Your code is JSX, which no browser understands. @babel/standalone is the
 *    Babel compiler running IN the page, so we can transform it at runtime
 *    rather than at build time. That is the one and only reason index.html's
 *    CSP allows 'unsafe-eval'.
 *
 * 2. The compiled output is plain JS referring to `React.createElement`, plus
 *    hook names like `useState`. We build a function from that source with
 *    `new Function(...)`, passing React and the hooks in as arguments — so your
 *    code can use `useState` without an import line.
 *
 *    This is a convenience, NOT a sandbox. `new Function` only isolates local
 *    scope; the code still runs in this renderer's realm and can reach browser
 *    globals, including `window.forge`. React exercises are therefore trusted
 *    the same way the shell/python/node tracks are — they run your own code. See
 *    SECURITY.md. (A true boundary would need a separate realm, e.g. an
 *    out-of-process frame; that is deliberately not built, because it would not
 *    change what the learner can already do two tabs over on the Kali track.)
 *
 * 3. We render the resulting component into a real DOM node with its own React
 *    root, wrapped in an error boundary so a crash shows a message instead of
 *    taking the whole app down.
 *
 *    A render-time EXCEPTION is caught. A synchronous infinite loop or runaway
 *    computation (`while (true) {}`) is not — it runs on the renderer's single
 *    thread with no timeout and will freeze the window until you restart the
 *    app. The python/node/shell tracks kill runaway processes at 10s; React
 *    cannot, because it executes in-process. Known limitation (SECURITY.md).
 *
 * 4. Grading runs the shared assertions from shared/assertions.mjs against that
 *    live DOM — clicking real buttons, typing into real inputs.
 *
 * `flushSync` matters in step 3: React 18 renders concurrently, so without it
 * `root.render()` returns before the DOM exists and every assertion would fail
 * on an empty container.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as Babel from '@babel/standalone';
import { runAssertions } from '../../shared/assertions.mjs';

/** Catches render-time errors from the learner's component. */
class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    if (this.props.onError) this.props.onError(error);
  }
  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

function compile(code, componentName) {
  const { code: js } = Babel.transform(code, {
    presets: [['react', { runtime: 'classic' }]],
    filename: 'exercise.jsx',
  });
  // The trailing return hands the component back out of the function scope.
  const factory = new Function(
    'React',
    'useState',
    'useEffect',
    'useRef',
    'useMemo',
    'useCallback',
    'useReducer',
    `${js}\n;return typeof ${componentName} === "function" ? ${componentName} : null;`
  );
  return factory(
    React,
    React.useState,
    React.useEffect,
    React.useRef,
    React.useMemo,
    React.useCallback,
    React.useReducer
  );
}

export default function ReactPreview({ code, componentName = 'App', assertions, checkToken, onResult }) {
  const hostRef = useRef(null);
  const rootRef = useRef(null);
  const [error, setError] = useState(null);

  // Debounce: recompiling on every keystroke makes half-typed JSX throw
  // constantly. 400ms of quiet is long enough to have finished a line.
  const [settled, setSettled] = useState(code);
  useEffect(() => {
    const id = setTimeout(() => setSettled(code), 400);
    return () => clearTimeout(id);
  }, [code]);

  const render = useCallback(() => {
    const host = hostRef.current;
    if (!host) return null;
    if (!rootRef.current) rootRef.current = createRoot(host);

    try {
      const Component = compile(settled, componentName);
      if (!Component) {
        setError(`No component named "${componentName}" was found. Name it exactly ${componentName}.`);
        flushSync(() => rootRef.current.render(null));
        return null;
      }
      let boundaryError = null;
      flushSync(() => {
        rootRef.current.render(
          <Boundary onError={(e) => { boundaryError = e; }}>
            <Component />
          </Boundary>
        );
      });
      setError(boundaryError ? `${boundaryError.name}: ${boundaryError.message}` : null);
      return boundaryError;
    } catch (err) {
      setError(`${err.name}: ${err.message}`);
      try { flushSync(() => rootRef.current.render(null)); } catch { /* already torn down */ }
      return err;
    }
  }, [settled, componentName]);

  useEffect(() => { render(); }, [render]);

  // Unmount the inner root when this exercise goes away, so its effects
  // (intervals, listeners) are cleaned up — the very thing the effects lesson
  // is about.
  useEffect(() => {
    return () => {
      const root = rootRef.current;
      rootRef.current = null;
      if (root) setTimeout(() => root.unmount(), 0);
    };
  }, []);

  // Grading is triggered by the parent bumping checkToken.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    let cancelled = false;

    (async () => {
      const err = render();
      if (err) {
        if (!cancelled) onResult({ pass: false, message: `Your component threw: ${err.message}` });
        return;
      }
      await new Promise((r) => setTimeout(r, 30));
      const host = hostRef.current;
      if (!host) return;
      const verdict = await runAssertions(host, assertions || [], code);
      if (!cancelled) onResult(verdict);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkToken]);

  const status = useMemo(() => (error ? 'error' : 'live'), [error]);

  return (
    <div className="preview">
      <div className="out-head">
        <span>Live preview</span>
        <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{status}</span>
      </div>
      {error && <div className="preview-error" role="alert">{error}</div>}
      <div className="preview-surface" ref={hostRef} />
    </div>
  );
}
