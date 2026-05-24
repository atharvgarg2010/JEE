"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";

interface QuestionMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Normalise LaTeX delimiters so remark-math can parse them.
 *
 * remark-math v6 only understands:
 *   - Inline:  $...$
 *   - Block:   $$...$$  (on its own paragraph)
 *
 * JEE questions are commonly authored with TeX-style delimiters:
 *   - Inline:  \( ... \)
 *   - Block:   \[ ... \]   or   $$ ... $$
 *
 * We convert \( \) and \[ \] → $ $ and $$ $$ so remark-math picks them up.
 * The conversion runs on the raw string BEFORE the Markdown parser sees it.
 */
function preprocessMath(raw: string): string {
  // \[ ... \]  →  $$ ... $$ (block math)
  let result = raw.replace(/\\\[/g, "$$").replace(/\\\]/g, "$$");

  // \( ... \)  →  $ ... $ (inline math)
  result = result.replace(/\\\(/g, "$").replace(/\\\)/g, "$");

  return result;
}

const markdownComponents: Components = {
  p: ({ children, ...props }) => (
    <p className="text-zinc-100 leading-relaxed mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),
  li: ({ children, ...props }) => (
    <li className="ml-5 list-disc text-zinc-200" {...props}>
      {children}
    </li>
  ),
  ul: ({ children, ...props }) => (
    <ul className="space-y-1 mb-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="space-y-1 mb-2 list-decimal ml-5" {...props}>
      {children}
    </ol>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-zinc-100" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="text-zinc-200 italic" {...props}>
      {children}
    </em>
  ),
  code: ({ children, className: classNameProp, ...props }) => (
    <code
      className={`rounded-md bg-zinc-900 px-1 py-0.5 text-sm text-emerald-300 ${classNameProp ?? ""}`}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 overflow-x-auto my-2 text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-zinc-900/80" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-zinc-800 px-3 py-2 text-left text-xs uppercase tracking-[0.15em] text-zinc-400"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-zinc-800 px-3 py-2 text-zinc-200" {...props}>
      {children}
    </td>
  ),
};

export function QuestionMarkdown({ content, className }: QuestionMarkdownProps) {
  // Preprocess once per content change — converts \( \) and \[ \] → $ and $$.
  const processed = useMemo(() => preprocessMath(content ?? ""), [content]);

  return (
    <div className={className}>
      <ReactMarkdown
        // remark-math MUST come before remark-gfm so it claims $...$ blocks
        // before GFM's backslash-escape processor can strip backslashes.
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Strip math delimiters and LaTeX commands to produce a plain-text preview.
 * Used in question cards / list views where full rendering isn't needed.
 */
export function stripMathForPreview(text: string): string {
  return (
    text
      // Remove block math $$ ... $$
      .replace(/\$\$[\s\S]*?\$\$/g, "[equation]")
      // Remove inline math $ ... $
      .replace(/\$[^$\n]+?\$/g, "[math]")
      // Remove \( ... \) and \[ ... \]
      .replace(/\\\([\s\S]*?\\\)/g, "[math]")
      .replace(/\\\[[\s\S]*?\\\]/g, "[equation]")
      // Strip remaining LaTeX commands like \frac, \text, etc.
      .replace(/\\[a-zA-Z]+\{[^}]*\}/g, "")
      .replace(/\\[a-zA-Z]+/g, "")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}
