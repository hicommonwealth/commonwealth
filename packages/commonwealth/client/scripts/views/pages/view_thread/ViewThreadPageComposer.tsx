import React from 'react';
import { CreateComment } from '../../components/Comments/CreateComment';
import { StickyCommentElementSelector } from '../../components/StickEditorContainer/context';
import { WithDefaultStickyComment } from '../../components/StickEditorContainer/context/WithDefaultStickyComment';
import type { UseViewThreadDataResult } from './useViewThreadData';

type ViewThreadPageComposerProps = {
  data: UseViewThreadDataResult;
};

export const ViewThreadPageComposer = ({
  data,
}: ViewThreadPageComposerProps) => {
  return (
    <>
      <WithDefaultStickyComment>
        {data.showCreateCommentComposer && (
          <CreateComment
            rootThread={data.thread!}
            canComment={data.permissions.CREATE_COMMENT.allowed}
            aiCommentsToggleEnabled={!!data.effectiveAiCommentsToggleEnabled}
            tooltipText={data.permissions.CREATE_COMMENT.tooltip}
          />
        )}
      </WithDefaultStickyComment>
      <StickyCommentElementSelector />
    </>
  );
};
