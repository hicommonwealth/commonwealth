import { activeEditor$, useCellValue } from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

export const DebugEditorState = () => {
  const activeEditor = useCellValue(activeEditor$);

  const handleClick = useCallback(() => {
    console.log(
      'FIXME hello...',
      JSON.stringify(activeEditor?.getEditorState().toJSON(), null, 2),
    );
  }, [activeEditor]);

  return <CWIconButton iconName="download" onClick={handleClick} />;
};
