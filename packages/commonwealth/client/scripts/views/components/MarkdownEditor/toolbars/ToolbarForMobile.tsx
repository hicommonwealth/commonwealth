import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  ListsToggle,
  Separator,
} from 'commonwealth-mdxeditor';
import React, { ReactNode, useCallback, useEffect } from 'react';

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

      console.log('FIXME 101: preventKeyboardDeactivation');

      if (focus) {
        console.log('FIXME: calling focus');
        focus?.();
      } else {
        console.warn('No focus');
      }
    },
    [focus],
  );
  //
  // const handleKeyboardFocusForBody = useCallback(() => {
  //   console.log('FIXME102: handleKeyboardFocusForBody');
  //
  //   setTimeout(() => {
  //     console.log('FIXME103: handleKeyboardFocusForBody');
  //   }, 0);
  //
  // }, []);
  //
  // useEffect(() => {
  //   window.addEventListener('mousedown', handleKeyboardFocusForBody, {capture: true});
  //
  //   return () => {
  //     window.removeEventListener('mousedown', handleKeyboardFocusForBody, {capture: true});
  //   };
  // }, [handleKeyboardFocusForBody]);

  return (
    <div
      className="ToolbarForMobile"
      // onClick={preventKeyboardDeactivation}
      onMouseDown={preventKeyboardDeactivation}
      onPointerDown={preventKeyboardDeactivation}
      onMouseDownCapture={preventKeyboardDeactivation}
    >
      {/*<Select*/}
      {/*  selected="asdf"*/}
      {/*  options={[*/}
      {/*    {*/}
      {/*      id: '1',*/}
      {/*      label: '1',*/}
      {/*    },*/}
      {/*  ]}*/}
      {/*></Select>*/}

      <div
        className="mdxeditor-block-type-select"
        onClick={() => console.log('click')}
      >
        <BlockTypeSelect />
      </div>

      <button onClick={headingsPopoverProps.handleInteraction}>headings</button>

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
