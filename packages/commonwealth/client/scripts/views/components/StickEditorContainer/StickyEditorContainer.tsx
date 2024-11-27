import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import React, { useCallback, useState } from 'react';
import { CommentEditor } from 'views/components/Comments/CommentEditor';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { DesktopStickyInput } from 'views/components/StickEditorContainer/DesktopStickyInput';
import { MobileStickyInput } from 'views/components/StickEditorContainer/MobileStickyInput';
import './StickyEditorContainer.scss';

export const StickyEditorContainer = (props: CommentEditorProps) => {
  const stickEditor = useFlag('stickyEditor');
  const [focused, setFocused] = useState(false);

  const { isWindowExtraSmall } = useBrowserWindow({});

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  const handleCancel = useCallback(() => {
    setFocused(false);
  }, []);

  if (!stickEditor) {
    return <CommentEditor {...props} />;
  }

  return (
    <>
      {isWindowExtraSmall && <MobileStickyInput {...props} />}
      {!isWindowExtraSmall && <DesktopStickyInput {...props} />}
    </>
  );
};
