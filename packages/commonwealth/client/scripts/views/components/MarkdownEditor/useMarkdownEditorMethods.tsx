import { MDXEditorMethods } from 'commonwealth-mdxeditor';
import { useContext } from 'react';
import { MarkdownEditorContext } from 'views/components/MarkdownEditor/MarkdownEditorContext';

export function useMarkdownEditorMethods(): Pick<
  MDXEditorMethods,
  'getMarkdown'
> {
  return useContext(MarkdownEditorContext)!;
}
