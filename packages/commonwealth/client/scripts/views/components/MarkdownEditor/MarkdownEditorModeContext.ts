import { createContext } from 'react';
import { MarkdownEditorMode } from 'views/components/MarkdownEditor/MarkdownEditor';

export const MarkdownEditorModeContext =
  createContext<MarkdownEditorMode | null>(null);
