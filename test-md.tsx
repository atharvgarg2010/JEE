import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { renderToStaticMarkup } from 'react-dom/server';

const md = `
Here is an equation:
$\\frac{1}{2}$

And a block:
$$
\\log_{10} x = 2
$$
`;

const html = renderToStaticMarkup(
  <ReactMarkdown
    remarkPlugins={[remarkMath, remarkGfm]}
    rehypePlugins={[rehypeKatex]}
  >
    {md}
  </ReactMarkdown>
);

console.log(html);
