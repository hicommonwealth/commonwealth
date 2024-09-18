import { useContext } from 'react';
import { MarkdownEditorModeContext } from 'views/components/MarkdownEditor/MarkdownEditorModeContext';

export function useMarkdownEditorMode() {
  return useContext(MarkdownEditorModeContext)!;
}
