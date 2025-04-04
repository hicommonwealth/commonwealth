import { ContentType } from '@hicommonwealth/shared';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { Thread } from 'models/Thread';
import type { Topic } from 'models/Topic';
import React from 'react';
import { DesktopStickyInput } from 'views/components/StickEditorContainer/DesktopStickyInput';
import { MobileStickyInput } from 'views/components/StickEditorContainer/MobileStickyInput';

import './StickyEditorContainer.scss';

interface StickyEditorContainerProps {
  topic?: Topic;
  parentType: ContentType;
  thread?: Thread;
  initialPrompt?: string; // For community creation
  // Include CommentEditor props that we need
  isReplying?: boolean;
  replyingToAuthor?: string;
  onCancel?: (e?: React.MouseEvent) => void;
  handleSubmitComment: () => Promise<number>;
  aiCommentsToggleEnabled?: boolean;
  setAICommentsToggleEnabled?: (enabled: boolean) => void;
}

export const StickyEditorContainer = (props: StickyEditorContainerProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});

  const editorProps = {
    ...props,
    parentType: props.parentType || ContentType.Comment,
  };

  if (isWindowExtraSmall) {
    return <MobileStickyInput {...editorProps} />;
  }

  return <DesktopStickyInput {...editorProps} />;
};
