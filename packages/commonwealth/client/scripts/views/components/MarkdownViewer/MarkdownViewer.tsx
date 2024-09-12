import {
  MDXEditor,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
} from 'commonwealth-mdxeditor';
import React, { memo, useCallback } from 'react';
import { useEditorErrorHandler } from 'views/components/MarkdownEditor/useEditorErrorHandler';
import { codeBlockLanguages } from 'views/components/MarkdownEditor/utils/codeBlockLanguages';

import './MarkdownViewer.scss';

export type MarkdownStr = string;

export type MarkdownViewerProps = Readonly<{
  markdown: MarkdownStr;
}>;

export const MarkdownViewer = memo(function MarkdownViewer(
  props: MarkdownViewerProps,
) {
  const { markdown } = props;

  const errorHandler = useEditorErrorHandler();

  const handleKeyDownCapture = useCallback((event: React.KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div onKeyDownCapture={handleKeyDownCapture} className="MarkdownViewer">
      <MDXEditor
        onError={errorHandler}
        markdown={markdown ?? ''}
        placeholder=""
        plugins={[
          listsPlugin(),
          quotePlugin(),
          headingsPlugin(),
          linkPlugin(),
          codeBlockPlugin(),
          codeMirrorPlugin({
            codeBlockLanguages,
          }),
          imagePlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          frontmatterPlugin(),
          markdownShortcutPlugin(),
        ]}
      />
    </div>
  );
});
