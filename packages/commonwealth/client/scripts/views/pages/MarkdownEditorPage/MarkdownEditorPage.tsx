import React from 'react';
import { useSearchParams } from 'react-router-dom';
import MarkdownEditor from 'views/components/MarkdownEditor';
import {
  MarkdownEditorMode,
  MarkdownEditorProps,
} from 'views/components/MarkdownEditor/MarkdownEditor';

import './MarkdownEditorPage.scss';

import overview from 'views/components/MarkdownEditor/markdown/editor_overview.md?raw';
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

  if (mode === 'desktop') {
    return (
      <div className="MarkdownEditorPage">
        <div className="desktop">
          <Inner mode={mode} />
        </div>
      </div>
    );
  }

  return <Inner mode={mode} />;
};

const Inner = (props: Pick<MarkdownEditorProps, 'mode'>) => {
  return (
    <MarkdownEditor
      {...props}
      markdown={`${overview}\n${supported}`}
      imageHandler="local"
      onSubmit={(markdown) => console.log('markdown: \n' + markdown)}
    />
  );
};
