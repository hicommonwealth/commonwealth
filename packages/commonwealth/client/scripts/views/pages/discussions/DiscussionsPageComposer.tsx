import { ContentType } from '@hicommonwealth/shared';
import Account from 'models/Account';
import type { DeltaStatic } from 'quill';
import React from 'react';
import type { Topic } from '../../../models/Topic';
import { getTextFromDelta } from '../../components/react_quill_editor';
import { StickyInput } from '../../components/StickEditorContainer';
import { WithDefaultStickyComment } from '../../components/StickEditorContainer/context/WithDefaultStickyComment';

type DiscussionsPageComposerProps = {
  author: Account;
  canCreateThread: boolean;
  communityId: string;
  contentDelta: DeltaStatic;
  disabled: boolean;
  editorValue: string;
  handleSubmitThread: (turnstileToken?: string) => Promise<number>;
  onCancel: (event: React.MouseEvent | undefined) => void;
  setContentDelta: React.Dispatch<React.SetStateAction<DeltaStatic>>;
  showComposer: boolean;
  topic?: Topic;
};

export const DiscussionsPageComposer = ({
  author,
  canCreateThread,
  communityId,
  contentDelta,
  disabled,
  editorValue,
  handleSubmitThread,
  onCancel,
  setContentDelta,
  showComposer,
  topic,
}: DiscussionsPageComposerProps) => (
  <WithDefaultStickyComment>
    {showComposer && (
      <StickyInput
        parentType={ContentType.Thread}
        canComment={canCreateThread}
        handleSubmitComment={handleSubmitThread}
        errorMsg=""
        contentDelta={contentDelta}
        setContentDelta={setContentDelta}
        disabled={disabled}
        onCancel={onCancel}
        author={author}
        editorValue={editorValue || getTextFromDelta(contentDelta)}
        tooltipText=""
        topic={topic}
        communityId={communityId}
      />
    )}
  </WithDefaultStickyComment>
);
