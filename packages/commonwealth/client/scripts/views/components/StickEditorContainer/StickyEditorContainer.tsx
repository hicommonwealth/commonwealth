import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import React from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { DesktopStickyInput } from 'views/components/StickEditorContainer/DesktopStickyInput';
import { MobileStickyInput } from 'views/components/StickEditorContainer/MobileStickyInput';
import './StickyEditorContainer.scss';
import type { Topic } from 'models/Topic';
import { ContentType } from '@hicommonwealth/shared';

interface StickyEditorContainerProps extends CommentEditorProps {
  topic?: Topic;
  parentType: ContentType;
}

export const StickyEditorContainer = (props: StickyEditorContainerProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});
  const stickEditor = useFlag('stickyEditor');

  if (!stickEditor) {
    return <CommentEditor {...props} />;
  }

  const editorProps = {
    ...props,
    parentType: props.parentType || ContentType.Comment,
  };

  if (isWindowExtraSmall) {
    return <MobileStickyInput {...editorProps} />;
  }

  return <DesktopStickyInput {...editorProps} />;
};
