import React from 'react';
import ReactQuill from 'react-quill';
import type { DeltaStatic } from 'quill';
import type { QuillMode } from '../quill/types';

type ReactQuillEditorProps = {
  className?: string
  placeholder?: string;
  tabIndex?: number;
  theme?: string;
  mode?: QuillMode; // Use in order to limit editor to only MD or RT support
  contentDelta: DeltaStatic
  setContentDelta: (d: DeltaStatic) => void
}

// ReactQuillEditor is a custom wrapper for the react-quill component
const ReactQuillEditor = ({
    className = '',
    placeholder,
    tabIndex,
    theme,
    contentDelta,
    setContentDelta,
  } : ReactQuillEditorProps) => {

  const handleChange = (value, delta, source, editor) => {
    setContentDelta(editor.getContents())
  }

  return (
    <ReactQuill
      className={`QuillEditor ${className}`}
      placeholder={placeholder}
      tabIndex={tabIndex}
      theme={theme}
      value={contentDelta}
      onChange={handleChange}
    />
  )

}

export default ReactQuillEditor
