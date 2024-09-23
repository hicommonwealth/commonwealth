import {
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
} from 'commonwealth-mdxeditor';
import React, { memo } from 'react';
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

  return (
    <div className="MarkdownViewer">
      <MDXEditor
        onError={errorHandler}
        markdown={markdown ?? ''}
        placeholder=""
        readOnly={true}
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
        ]}
      />
    </div>
  );
});
