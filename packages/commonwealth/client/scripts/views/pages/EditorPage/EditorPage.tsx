import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Editor from 'views/components/MarkdownEditor';
import { EditorMode } from 'views/components/MarkdownEditor/Editor';

import supported from 'views/components/MarkdownEditor/markdown/supported.md?raw';

function useParams() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') ?? 'desktop';
  return {
    mode: mode as EditorMode,
  };
}

/**
 * Basic demo page that allows us to use either mode and to log the markdown.
 */
export const EditorPage = () => {
  const { mode } = useParams();

  return (
    <Editor
      markdown={supported}
      mode={mode}
      imageHandler="local"
      onSubmit={(markdown) => console.log('markdown: \n' + markdown)}
    />
  );
};
