/**
 * main.jsx — the React entry point for the renderer process.
 *
 * createRoot is React 18's mounting API. It takes a real DOM node (the empty
 * <div id="root"> in index.html) and hands React control of everything inside it.
 *
 * StrictMode is intentionally OMITTED here. In development it deliberately
 * double-invokes effects to surface missing cleanup — valuable in a normal app,
 * but here it would also double-run the React *preview* that grades your
 * exercises, which is confusing while you are still learning what effects do.
 * The Effects lesson explains what StrictMode does and why it exists.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
