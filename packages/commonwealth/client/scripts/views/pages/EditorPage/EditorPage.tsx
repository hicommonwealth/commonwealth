import React from 'react';
import Editor from 'views/components/Editor';

export const EditorPage = () => {
  return (
    <Editor
      mode={'mobile'}
      imageHandler="local"
      onSubmit={(markdown) => console.log('markdown: \n' + markdown)}
    />
  );
};
