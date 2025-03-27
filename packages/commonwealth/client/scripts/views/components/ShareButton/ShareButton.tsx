import React, { useState } from 'react';
import { ShareDialog } from 'views/components/ShareDialog/ShareDialog';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';

type ShareButtonProps = {
  url: string;
  title?: string;
  text?: string;
  buttonLabel?: string;
};

export const ShareButton = (props: ShareButtonProps) => {
  const { buttonLabel } = props;

  const [dialogActive, setDialogActive] = useState(false);

  return (
    <>
      <CWThreadAction
        action="share"
        {...(buttonLabel && { label: buttonLabel })}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDialogActive(true);
        }}
      />

      {dialogActive && (
        <ShareDialog onClose={() => setDialogActive(false)} {...props} />
      )}
    </>
  );
};
