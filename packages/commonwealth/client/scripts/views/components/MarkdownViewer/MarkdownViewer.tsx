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
import React, { memo, ReactNode, useMemo, useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { useMarkdownEditorErrorHandler } from 'views/components/MarkdownEditor/useMarkdownEditorErrorHandler';
import { codeBlockLanguages } from 'views/components/MarkdownEditor/utils/codeBlockLanguages';
import { useComputeMarkdownWithCutoff } from 'views/components/MarkdownViewer/useComputeMarkdownWithCutoff';
import { sanitizeMarkdownImages } from 'views/components/react_quill_editor/utils';

import clsx from 'clsx';
import './MarkdownViewer.scss';

export type MarkdownStr = string;

export type MarkdownViewerProps = Readonly<{
  className?: string;
  markdown: MarkdownStr | undefined;
  cutoffLines?: number;
  customShowMoreButton?: ReactNode;
}>;

export const MarkdownViewer = memo(function MarkdownViewer(
  props: MarkdownViewerProps,
) {
  const { customShowMoreButton, className } = props;

  const errorHandler = useMarkdownEditorErrorHandler();

  const toggleDisplay = () => setUserExpand(!userExpand);

  // Sanitize markdown to remove images with invalid URLs
  const sanitizedMarkdown = useMemo(
    () => sanitizeMarkdownImages(props.markdown ?? ''),
    [props.markdown],
  );

  const [truncated, truncatedMarkdown, initialMarkdown] =
    useComputeMarkdownWithCutoff(sanitizedMarkdown, props.cutoffLines);

  const [userExpand, setUserExpand] = useState<boolean>(false);

  return (
    <div className={clsx('MarkdownViewer', className)}>
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
          {customShowMoreButton || (
            <div className="show-more-button-wrapper">
              <div className="show-more-button" onClick={toggleDisplay}>
                <CWIcon iconName="plus" iconSize="small" />
                <div className="show-more-text">Show More</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
