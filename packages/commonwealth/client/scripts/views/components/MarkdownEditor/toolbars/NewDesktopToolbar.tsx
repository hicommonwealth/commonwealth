import React from 'react';
import { BlockSelectorButton } from 'views/components/MarkdownEditor/toolbars/BlockSelectorButton';
import './NewToolbar.scss';

type NewDesktopToolbarProps = Readonly<{
  focus: () => void;
}>;
//FIXME remove
export const NewDesktopToolbar = (props: NewDesktopToolbarProps) => {
  const { focus } = props;
  return (
    <div className="NewToolbar">
      <BlockSelectorButton focus={focus} />
    </div>
  );
};
