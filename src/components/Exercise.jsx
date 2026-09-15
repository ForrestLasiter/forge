/**
 * Exercise.jsx — one graded task.
 *
 * Four shapes share this component because they share a rhythm: read the
 * prompt, attempt it, get a verdict, escalate to hints, and only then see the
 * solution. Hints unlock one at a time and the solution stays hidden until you
 * have either failed twice or explicitly asked — friction on purpose, because
 * reading the answer before struggling teaches almost nothing.
 */

import React, { useState, useEffect, useRef } from 'react';
import Editor from './Editor.jsx';
import Markdown from './Markdown.jsx';
import ReactPreview from './ReactPreview.jsx';

const KIND_LABEL = {
  shell: 'terminal',
  python: 'python',
  node: 'node',
  react: 'react',
  quiz: 'quiz',
};

export default function Exercise({ trackId, lessonId, exercise, index, completed, savedCode, onPass }) {
  const key = `${trackId}/${lessonId}/${exercise.id}`;
  const [code, setCode] = useState(savedCode ?? exercise.starter ?? '');
  const [result, setResult] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [fails, setFails] = useState(0);
  const [choice, setChoice] = useState(null);
  const [checkToken, setCheckToken] = useState(0);
  const passed = completed || verdict?.pass;

  // Switching lessons reuses this component, so reset when the exercise changes.
  useEffect(() => {
    setCode(savedCode ?? exercise.starter ?? '');
    setResult(null); setVerdict(null); setHintsShown(0);
    setShowSolution(false); setFails(0); setChoice(null);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist typing so quitting mid-exercise costs nothing. Debounced, because
  // writing a JSON file on every keystroke would be silly.
  const firstSave = useRef(true);
  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    const id = setTimeout(() => window.forge.progress.saveCode(key, code), 700);
    return () => clearTimeout(id);
  }, [code, key]);

  function applyVerdict(v) {
    setVerdict(v);
    if (v.pass) onPass(key);
    else setFails((f) => f + 1);
  }

  async function run() {
    setBusy(true);
    setVerdict(null);
    try {
      setResult(await window.forge.run(exercise.kind, code));
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    if (exercise.kind === 'react') {
      setBusy(true);
      setCheckToken((t) => t + 1); // ReactPreview watches this and calls back
      return;
    }
    setBusy(true);
    try {
      const res = await window.forge.submit({
        trackId, lessonId, exerciseId: exercise.id, code,
      });
      setResult(res.result);
      applyVerdict(res);
    } finally {
      setBusy(false);
    }
  }

  async function answerQuiz(i) {
    setChoice(i);
    const res = await window.forge.submit({
      trackId, lessonId, exerciseId: exercise.id, code: String(i),
    });
    applyVerdict(res);
  }

  return (
    <div className={`exercise${passed ? ' passed' : ''}`} role="group" aria-label={`Exercise ${index + 1}`}>
      <div className="exercise-head">
        <span className="label">Exercise {index + 1}</span>
        <span className="kind">{KIND_LABEL[exercise.kind] || exercise.kind}</span>
        <span className="spacer" />
        {passed && <span className="tick"><span aria-hidden="true">✓</span> passed</span>}
      </div>

      <div className="exercise-body">
        <div className="prompt"><Markdown>{exercise.prompt}</Markdown></div>

        {exercise.kind === 'quiz' ? (
          <>
            {exercise.choices.map((c, i) => {
              let cls = 'quiz-choice';
              if (choice !== null) {
                if (i === choice) cls += verdict?.pass ? ' correct' : ' wrong';
                if (verdict && !verdict.pass && choice !== null && i !== choice) cls += '';
              }
              return (
                <button key={i} className={cls} onClick={() => answerQuiz(i)} disabled={choice !== null && verdict?.pass}>
                  {String.fromCharCode(65 + i)}. {c}
                  {choice === i && verdict && (
                    <span className="sr-only">{verdict.pass ? ' — correct answer' : ' — incorrect answer'}</span>
                  )}
                </button>
              );
            })}
            {choice !== null && verdict && (
              <div className={`verdict ${verdict.pass ? 'pass' : 'fail'}`} role="status">
                <span aria-hidden="true">{verdict.pass ? '✓' : '✗'}</span>
                <span>{verdict.message}</span>
              </div>
            )}
            {choice !== null && (verdict?.pass || fails >= 1) && exercise.explain && (
              <div className="explain"><Markdown>{exercise.explain}</Markdown></div>
            )}
          </>
        ) : (
          <>
            <Editor value={code} onChange={setCode} kind={exercise.kind} minHeight="130px" label={`Code editor for exercise ${index + 1}`} />

            <div className="controls">
              {exercise.kind !== 'react' && (
                <button onClick={run} disabled={busy}>Run</button>
              )}
              <button className="primary" onClick={check} disabled={busy}>
                {busy ? 'Checking…' : 'Check answer'}
              </button>
              <span className="spacer" />
              {exercise.hints.length > 0 && hintsShown < exercise.hints.length && (
                <button className="ghost" onClick={() => setHintsShown((n) => n + 1)}>
                  {hintsShown === 0 ? 'Hint' : `Hint ${hintsShown + 1}`}
                </button>
              )}
              {(fails >= 2 || showSolution) && (
                <button className="ghost" onClick={() => setShowSolution((s) => !s)}>
                  {showSolution ? 'Hide solution' : 'Show solution'}
                </button>
              )}
              {fails < 2 && !showSolution && exercise.solution && (
                <button className="ghost" onClick={() => setShowSolution(true)} title="Try it yourself first — you learn more from a failed attempt than a read solution">
                  Reveal solution
                </button>
              )}
            </div>

            {exercise.kind === 'react' && (
              <ReactPreview
                code={code}
                componentName={exercise.componentName || 'App'}
                assertions={exercise.assertions}
                checkToken={checkToken}
                onResult={(v) => { setBusy(false); applyVerdict(v); }}
              />
            )}

            {result && exercise.kind !== 'react' && (
              <div className="output">
                <div className="out-head">
                  <span>output</span>
                  <span>exit {result.exitCode}</span>
                  <span>{result.ms}ms</span>
                </div>
                {result.stdout ? <pre>{result.stdout}</pre> : null}
                {result.stderr ? <pre className="err">{result.stderr}</pre> : null}
                {!result.stdout && !result.stderr && <pre style={{ opacity: 0.5 }}>(no output)</pre>}
              </div>
            )}

            {verdict && (
              <div className={`verdict ${verdict.pass ? 'pass' : 'fail'}`} role="status">
                <span aria-hidden="true">{verdict.pass ? '✓' : '✗'}</span>
                <span>{verdict.message}</span>
              </div>
            )}

            {hintsShown > 0 && (
              <div className="hints">
                {exercise.hints.slice(0, hintsShown).map((h, i) => (
                  <div className="hint" key={i}>{h}</div>
                ))}
              </div>
            )}

            {showSolution && exercise.solution && (
              <div className="output" style={{ marginTop: 12 }}>
                <div className="out-head">
                  <span>one working solution</span>
                  <span className="spacer" />
                  <button
                    className="ghost"
                    style={{ padding: '0 6px', fontSize: 10 }}
                    onClick={() => setCode(exercise.solution)}
                  >
                    load into editor
                  </button>
                </div>
                <pre>{exercise.solution}</pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
