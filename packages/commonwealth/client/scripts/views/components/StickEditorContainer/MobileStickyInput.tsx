import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CommentEditor,
  CommentEditorProps,
} from 'views/components/Comments/CommentEditor/CommentEditor';
import { MobileInput } from 'views/components/StickEditorContainer/MobileInput';
import './MobileStickyInput.scss';

/**
 * This mobile version uses a portal to add itself to the bottom nav.
 */
export const MobileStickyInput = (props: CommentEditorProps) => {
  const [focused, setFocused] = useState(false);

  const handleFocused = useCallback(() => {
    setFocused(true);
  }, []);

  const handleCancel = useCallback(() => {
    setFocused(false);
  }, []);

  const parent = document.getElementById('MobileNavigationHead');

  if (!parent) {
    console.warn('No parent container for MobileStickyInput');
    return null;
  }

  if (focused) {
    // return the full editor for the mobile device full screen...
    return (
      <div className="MobileStickyInputFocused">
        <CommentEditor {...props} shouldFocus={true} onCancel={handleCancel} />
      </div>
    );
  }

  return createPortal(
    <>
      <div className="MobileStickyInput">
        <MobileInput onFocus={handleFocused} />
      </div>
    </>,
    parent,
  );
};
