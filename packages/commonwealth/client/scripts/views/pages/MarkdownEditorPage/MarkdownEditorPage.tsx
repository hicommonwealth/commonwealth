import React from 'react';
import { useSearchParams } from 'react-router-dom';
import MarkdownEditor from 'views/components/MarkdownEditor';
import { MarkdownEditorMode } from 'views/components/MarkdownEditor/MarkdownEditor';

import supported from 'views/components/MarkdownEditor/markdown/supported.md?raw';

function useParams() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') ?? 'desktop';
  return {
    mode: mode as MarkdownEditorMode,
  };
}

/**
 * Basic demo page that allows us to use either mode and to log the markdown.
 */
export const MarkdownEditorPage = () => {
  const { mode } = useParams();

  return (
    <MarkdownEditor
      markdown={supported}
      mode={mode}
      imageHandler="local"
      onSubmit={(markdown) => console.log('markdown: \n' + markdown)}
    />
  );
};
