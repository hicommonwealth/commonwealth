import {
  MDXEditor,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
} from 'commonwealth-mdxeditor';
import React, { memo, useMemo, useState } from 'react';
import { useEditorErrorHandler } from 'views/components/MarkdownEditor/useEditorErrorHandler';
import { codeBlockLanguages } from 'views/components/MarkdownEditor/utils/codeBlockLanguages';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

import './MarkdownViewer.scss';

export type MarkdownStr = string;

export type MarkdownViewerProps = Readonly<{
  markdown: MarkdownStr | undefined;
  cutoffLines?: number;
}>;

function truncateMarkdown(
  markdown: MarkdownStr,
  cutoffLines: number | undefined,
): string {
  return markdown.split('\n', cutoffLines).join('\n');
}

function useComputeMarkdownWithCutoff(
  markdown: MarkdownStr,
  cutoffLines: number | undefined,
): [boolean, string, string] {
  return useMemo(() => {
    if (!cutoffLines) {
      return [false, markdown, markdown];
    }

    return [true, truncateMarkdown(markdown, cutoffLines), markdown];
  }, [cutoffLines, markdown]);
}

export const MarkdownViewer = memo(function MarkdownViewer(
  props: MarkdownViewerProps,
) {
  const errorHandler = useEditorErrorHandler();

  const toggleDisplay = () => setUserExpand(!userExpand);

  const [truncated, truncatedMarkdown, initialMarkdown] =
    useComputeMarkdownWithCutoff(props.markdown ?? '', props.cutoffLines);

  const [userExpand, setUserExpand] = useState<boolean>(false);

  return (
    <div className="MarkdownViewer">
      <MDXEditor
        key={'user-expand' + userExpand}
        onError={errorHandler}
        markdown={userExpand ? initialMarkdown : truncatedMarkdown}
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

      {truncated && !userExpand && (
        <>
          <div className="show-more-button-wrapper">
            <div className="show-more-button" onClick={toggleDisplay}>
              <CWIcon iconName="plus" iconSize="small" />
              <div className="show-more-text">Show More</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
