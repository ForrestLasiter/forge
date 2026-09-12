/**
 * App.jsx — the shell of the application.
 *
 * This component owns the state everything else reads: the curriculum, your
 * progress, and which lesson is open. Children receive what they need as props
 * and report back through callbacks — data down, events up, exactly the pattern
 * the React track teaches. There is no Redux or Context here because one level
 * of prop passing does not need one.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Markdown from './components/Markdown.jsx';
import Exercise from './components/Exercise.jsx';
import Scratch from './components/Scratch.jsx';

export default function App() {
  const [tracks, setTracks] = useState(null);
  const [progress, setProgress] = useState({ completed: {}, savedCode: {} });
  const [trackId, setTrackId] = useState('linux');
  const [lessonId, setLessonId] = useState(null);
  const [toolchain, setToolchain] = useState(null);
  const [scratchOpen, setScratchOpen] = useState(false);

  // One effect for one job: load everything the app needs, once.
  useEffect(() => {
    (async () => {
      const [curriculum, prog, tools] = await Promise.all([
        window.forge.curriculum(),
        window.forge.progress.get(),
        window.forge.toolchain(),
      ]);
      setTracks(curriculum);
      setProgress(prog);
      setToolchain(tools);

      const last = prog.lastLesson;
      const valid = last && curriculum.some((t) => t.id === last.trackId && t.lessons.some((l) => l.id === last.lessonId));
      if (valid) {
        setTrackId(last.trackId);
        setLessonId(last.lessonId);
      } else {
        setLessonId(curriculum[0].lessons[0].id);
      }
    })();
  }, []);

  const track = useMemo(() => tracks?.find((t) => t.id === trackId) || null, [tracks, trackId]);
  const lesson = useMemo(() => track?.lessons.find((l) => l.id === lessonId) || track?.lessons[0] || null, [track, lessonId]);
  const lessonIndex = useMemo(() => (track && lesson ? track.lessons.findIndex((l) => l.id === lesson.id) : -1), [track, lesson]);

  // Derived, not stored — so it can never disagree with `progress`.
  const stats = useMemo(() => {
    if (!tracks) return { done: 0, total: 0 };
    let done = 0, total = 0;
    for (const t of tracks) {
      for (const l of t.lessons) {
        for (const e of l.exercises) {
          total += 1;
          if (progress.completed[`${t.id}/${l.id}/${e.id}`]) done += 1;
        }
      }
    }
    return { done, total };
  }, [tracks, progress]);

  const trackStats = useCallback(
    (t) => {
      let done = 0, total = 0;
      for (const l of t.lessons) {
        for (const e of l.exercises) {
          total += 1;
          if (progress.completed[`${t.id}/${l.id}/${e.id}`]) done += 1;
        }
      }
      return { done, total };
    },
    [progress]
  );

  const lessonDone = useCallback(
    (t, l) => l.exercises.every((e) => progress.completed[`${t.id}/${l.id}/${e.id}`]),
    [progress]
  );

  function openLesson(tid, lid) {
    setTrackId(tid);
    setLessonId(lid);
    window.forge.progress.setLast(tid, lid);
    document.querySelector('.main')?.scrollTo({ top: 0 });
  }

  /**
   * Immutable update: a NEW object with one key added. Mutating
   * progress.completed directly would leave the object identity unchanged and
   * React would never re-render — the exact trap the state lesson warns about.
   */
  const handlePass = useCallback((key) => {
    setProgress((p) => ({ ...p, completed: { ...p.completed, [key]: new Date().toISOString() } }));
  }, []);

  if (!tracks || !lesson) return <div className="loading">Loading curriculum…</div>;

  const missing = toolchain
    ? Object.entries(toolchain).filter(([name, v]) => !v.available && name !== 'git').map(([n]) => n)
    : [];

  return (
    <div className="app">
      <div className="topbar">
        <span className="brand">FORGE</span>
        <div className="tracks">
          {tracks.map((t) => {
            const s = trackStats(t);
            return (
              <button
                key={t.id}
                className={`track-tab${t.id === trackId ? ' active' : ''}`}
                style={{ '--tab-colour': t.colour }}
                onClick={() => openLesson(t.id, t.lessons[0].id)}
                title={t.blurb}
              >
                {t.title}
                <span style={{ opacity: 0.55, marginLeft: 7, fontSize: 11 }}>{s.done}/{s.total}</span>
              </button>
            );
          })}
        </div>
        <span className="spacer" />
        <span className="stat">{stats.done} / {stats.total} exercises</span>
        <div className="progress-bar" title={`${stats.done} of ${stats.total}`}>
          <div style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }} />
        </div>
        <button className="ghost" onClick={() => window.forge.workspace.open()} title="Open ~/.forge/workspace in your file manager">
          workspace
        </button>
        <button
          className="ghost"
          title="Delete and re-create the lab files"
          onClick={async () => { await window.forge.workspace.reset(); }}
        >
          reset lab
        </button>
      </div>

      <div className="body">
        <aside className="sidebar">
          <h4>{track.title}</h4>
          {track.lessons.map((l, i) => (
            <button
              key={l.id}
              className={`lesson-link${l.id === lesson.id ? ' active' : ''}`}
              onClick={() => openLesson(track.id, l.id)}
            >
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <span className="name">
                {l.title}
                <div className="meta">{l.minutes} min · {l.exercises.length} exercise{l.exercises.length === 1 ? "" : "s"}</div>
              </span>
              {lessonDone(track, l) && <span className="tick">✓</span>}
            </button>
          ))}
        </aside>

        <main className="main">
          <div className="main-inner">
            {missing.length > 0 && (
              <div className="banner">
                Not found on this machine: <strong>{missing.join(', ')}</strong>. Exercises in those
                languages will fail until you install them — on Kali,
                <code> sudo apt install python3 nodejs</code>.
              </div>
            )}

            <div className="lesson-head">
              <div className="eyebrow">{track.title} · lesson {lessonIndex + 1} of {track.lessons.length}</div>
              <h1>{lesson.title}</h1>
              <div className="sub">{lesson.minutes} min read · {lesson.exercises.length} exercise{lesson.exercises.length === 1 ? "" : "s"}</div>
            </div>

            <Markdown>{lesson.body}</Markdown>

            {lesson.exercises.length > 0 && <div className="exercises-head">Your turn</div>}

            {lesson.exercises.map((ex, i) => (
              <Exercise
                key={`${track.id}/${lesson.id}/${ex.id}`}
                trackId={track.id}
                lessonId={lesson.id}
                exercise={ex}
                index={i}
                completed={!!progress.completed[`${track.id}/${lesson.id}/${ex.id}`]}
                savedCode={progress.savedCode[`${track.id}/${lesson.id}/${ex.id}`]}
                onPass={handlePass}
              />
            ))}

            <div className="pager">
              {lessonIndex > 0 && (
                <button onClick={() => openLesson(track.id, track.lessons[lessonIndex - 1].id)}>
                  ← {track.lessons[lessonIndex - 1].title}
                </button>
              )}
              <span className="spacer" />
              {lessonIndex < track.lessons.length - 1 && (
                <button className="primary" onClick={() => openLesson(track.id, track.lessons[lessonIndex + 1].id)}>
                  {track.lessons[lessonIndex + 1].title} →
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      <Scratch open={scratchOpen} onToggle={() => setScratchOpen((o) => !o)} />
    </div>
  );
}
