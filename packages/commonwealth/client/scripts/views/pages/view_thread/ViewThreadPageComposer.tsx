import React from 'react';
import { StickyCommentElementSelector } from 'views/components/StickEditorContainer/context';
import { WithDefaultStickyComment } from 'views/components/StickEditorContainer/context/WithDefaultStickyComment';
import { CreateComment } from '../../components/Comments/CreateComment';
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
