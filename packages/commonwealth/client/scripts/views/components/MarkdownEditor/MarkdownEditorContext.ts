import { MDXEditorMethods } from 'commonwealth-mdxeditor';
import { createContext } from 'react';

export const MarkdownEditorContext = createContext<Pick<
  MDXEditorMethods,
  'getMarkdown'
> | null>(null);
