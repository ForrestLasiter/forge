/**
 * Markdown.jsx — renders lesson bodies.
 *
 * `marked` turns the markdown string into an HTML string, and
 * dangerouslySetInnerHTML injects it. That prop is named to make you stop and
 * think, and the question it asks is "do you trust this HTML?" Here the answer
 * is yes: every byte comes from the lesson files shipped inside this app, never
 * from the network or from anything you type. If lesson content ever became
 * user-supplied, this would need sanitising (DOMPurify) first.
 */

import React, { useMemo } from 'react';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export default function Markdown({ children, className = 'md' }) {
  const html = useMemo(() => marked.parse(children || ''), [children]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
