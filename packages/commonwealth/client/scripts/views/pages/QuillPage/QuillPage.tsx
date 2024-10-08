import React from 'react';
import { ReactQuillEditor } from 'views/components/react_quill_editor';

export const QuillPage = () => {
  return (
    <ReactQuillEditor
      contentDelta=""
      tooltipLabel="this is the tooltip"
      isDisabled={true}
      setContentDelta={() => console.log('got delta')}
    />
  );
};
