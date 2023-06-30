import React, { useState } from 'react';
import { DeltaStatic } from 'quill';

import {
  createDeltaFromText,
  ReactQuillEditor,
} from '../../../../client/scripts/views/components/react_quill_editor';

const Quill = () => {
  const [contentDelta, setContentDelta] = useState<DeltaStatic>(
    createDeltaFromText('')
  );

  return (
    <ReactQuillEditor
      contentDelta={contentDelta}
      setContentDelta={setContentDelta}
    />
  );
};

const QuillStory = {
  title: 'Components/Quill',
  component: Quill,
};

export default QuillStory;

export const QuillEditorStory = {
  render: ({ ...args }) => <Quill />,
};
