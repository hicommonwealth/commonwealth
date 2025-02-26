import { ContentType } from '@hicommonwealth/shared';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import type { Topic } from 'models/Topic';
import { Moment } from 'moment';
import React from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { DesktopStickyInput } from 'views/components/StickEditorContainer/DesktopStickyInput';
import { MobileStickyInput } from 'views/components/StickEditorContainer/MobileStickyInput';
import './StickyEditorContainer.scss';

interface StickyEditorContainerProps extends CommentEditorProps {
  topic?: Topic;
  parentType: ContentType;
  rootThread?: {
    id: number;
    communityId: string;
    body?: string;
    title?: string;
    archivedAt?: Date | Moment | null;
  };
  parentCommentId?: number;
}

export const StickyEditorContainer = (props: StickyEditorContainerProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});
  const stickEditor = useFlag('stickyEditor');

  if (!stickEditor) {
    return <CommentEditor {...props} />;
  }

  // Extract rootThread from props if it exists
  const rootThread = (props as any).rootThread;

  // Create a new editorProps object that explicitly includes rootThread
  const editorProps = {
    ...props,
    parentType: props.parentType || ContentType.Comment,
    rootThread: rootThread, // Explicitly pass rootThread
  };

  if (isWindowExtraSmall) {
    return <MobileStickyInput {...editorProps} />;
  }

  return <DesktopStickyInput {...editorProps} />;
};
