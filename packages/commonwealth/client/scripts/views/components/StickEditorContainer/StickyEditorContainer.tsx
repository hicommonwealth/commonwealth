import { ContentType } from '@hicommonwealth/shared';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { Thread } from 'models/Thread';
import type { Topic } from 'models/Topic';
import React from 'react';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { DesktopStickyInput } from 'views/components/StickEditorContainer/DesktopStickyInput';
import { MobileStickyInput } from 'views/components/StickEditorContainer/MobileStickyInput';

import './StickyEditorContainer.scss';

interface StickyEditorContainerProps extends CommentEditorProps {
  topic?: Topic;
  parentType: ContentType;
  thread?: Thread;
}

export const StickyEditorContainer = ({
  ...props
}: StickyEditorContainerProps) => {
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
