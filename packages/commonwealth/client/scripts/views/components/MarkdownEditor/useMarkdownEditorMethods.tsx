import { MDXEditorMethods } from 'commonwealth-mdxeditor';
import { useContext } from 'react';
import { MarkdownEditorContext } from 'views/components/MarkdownEditor/MarkdownEditorContext';

export type MarkdownEditorMethods = Pick<MDXEditorMethods, 'getMarkdown'>;

export function useMarkdownEditorMethods(): MarkdownEditorMethods {
  return useContext(MarkdownEditorContext)!;
}
