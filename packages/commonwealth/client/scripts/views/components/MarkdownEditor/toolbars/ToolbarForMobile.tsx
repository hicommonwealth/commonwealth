import {
  BoldItalicUnderlineToggles,
  CreateLink,
  ListsToggle,
  Separator,
} from 'commonwealth-mdxeditor';
import React, { ReactNode, useCallback, useEffect } from 'react';

import { BlockSelectorButton } from 'views/components/MarkdownEditor/toolbars/BlockSelectorButton';
import { ImageButton } from 'views/components/MarkdownEditor/toolbars/ImageButton';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import './ToolbarForMobile.scss';

type ToolbarForMobileProps = Readonly<{
  SubmitButton?: () => ReactNode;
  focus: () => void;

  onImage?: (file: File) => void;
}>;

export const ToolbarForMobile = (props: ToolbarForMobileProps) => {
  const { SubmitButton, focus, onImage } = props;

  const headingsPopoverProps = usePopover();

  const adjustForKeyboard = useCallback(() => {
    if (!window.visualViewport) {
      return;
    }

    const height = Math.floor(window.visualViewport.height);

    const root = document.getElementById('root');

    if (root) {
      root.style.maxHeight = `${height}px`;
    }
  }, []);

  useEffect(() => {
    adjustForKeyboard();

    // Adjust whenever the window resizes (e.g., when the keyboard appears)
    window.addEventListener('resize', adjustForKeyboard);

    return () => {
      window.removeEventListener('resize', adjustForKeyboard);
    };
  }, [adjustForKeyboard]);

  const preventKeyboardDeactivation = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      if (focus) {
        focus?.();
      } else {
        console.warn('No focus');
      }
    },
    [focus],
  );

  return (
    <div
      className="ToolbarForMobile"
      onMouseDown={preventKeyboardDeactivation}
      onPointerDown={preventKeyboardDeactivation}
      onMouseDownCapture={preventKeyboardDeactivation}
    >
      <div className="mdxeditor-block-type-select">
        <BlockSelectorButton focus={focus} />
      </div>

      <CWPopover
        body={
          <div>
            <BoldItalicUnderlineToggles />
          </div>
        }
        {...headingsPopoverProps}
      />

      {/*<UndoRedo />*/}
      <BoldItalicUnderlineToggles />
      <CreateLink />
      <ListsToggle />
      <Separator />
      <ImageButton onImage={onImage} />
      <div className="end">{SubmitButton && <SubmitButton />}</div>
    </div>
  );
};
