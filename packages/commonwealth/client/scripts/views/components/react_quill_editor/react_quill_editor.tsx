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
  onChange?: (v: string) => void
}

// ReactQuillEditor is a custom wrapper for the react-quill component
export function ReactQuillEditor(props: ReactQuillEditorProps) {

  const {
    className = '',
    placeholder,
    tabIndex,
    theme,
    contentDelta,
    setContentDelta,
    onChange
  } = props

  return (
    <ReactQuill
      className={`QuillEditor ${className}`}
      placeholder={placeholder}
      tabIndex={tabIndex}
      theme={theme}
      value={contentDelta}
      onChange={(value, delta, source, editor) => {
        console.log('value:', value)
        setContentDelta(editor.getContents())
        onChange?.(value)
      }}
    />
  )

}
