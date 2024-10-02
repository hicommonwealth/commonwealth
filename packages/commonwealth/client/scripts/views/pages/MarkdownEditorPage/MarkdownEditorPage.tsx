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
import { MarkdownSubmitButton } from 'views/components/MarkdownEditor/MarkdownSubmitButton';
import { useMarkdownEditorMethods } from 'views/components/MarkdownEditor/useMarkdownEditorMethods';

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
      <div className="MarkdownEditorPage MarkdownEditorPageDesktop">
        <div className="DesktopInner">
          <Inner mode={mode} />
        </div>
      </div>
    );
  }

  return <Inner mode={mode} />;
};

// eslint-disable-next-line react/no-multi-comp
const SubmitButton = () => {
  const methods = useMarkdownEditorMethods();

  const handleClick = () => {
    console.log(methods.getMarkdown());
  };

  return <MarkdownSubmitButton label="Create Thread" onClick={handleClick} />;
};

// eslint-disable-next-line react/no-multi-comp
const Inner = (props: Pick<MarkdownEditorProps, 'mode'>) => {
  return (
    <>
      <MarkdownEditor
        {...props}
        markdown={`${overview}\n${supported}`}
        imageHandler="local"
        // disabled={true}
        // tooltip="this is a tooltip"
        SubmitButton={SubmitButton}
      />
    </>
  );
};
