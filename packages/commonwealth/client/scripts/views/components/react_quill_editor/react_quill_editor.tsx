import React, { useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';

import imageDropAndPaste from 'quill-image-drop-and-paste'

import type { DeltaStatic } from 'quill';
import type { QuillMode } from '../quill/types';
import 'react-quill/dist/quill.snow.css';

Quill.register('modules/imageDropAndPaste', imageDropAndPaste);

type ReactQuillEditorProps = {
  className?: string
  placeholder?: string;
  tabIndex?: number;
  mode?: QuillMode; // Use in order to limit editor to only MD or RT support
  contentDelta: DeltaStatic
  setContentDelta: (d: DeltaStatic) => void
}

// ReactQuillEditor is a custom wrapper for the react-quill component
const ReactQuillEditor = ({
    className = '',
    placeholder,
    tabIndex,
    contentDelta,
    setContentDelta,
  } : ReactQuillEditorProps) => {

  const handleChange = (value, delta, source, editor) => {
    setContentDelta(editor.getContents())
  }

  const handleImageDropAndPaste = (imageDataUrl, imageType) => {
    console.log({ imageDataUrl, imageType })
  }

  return (
    <ReactQuill
      className={`QuillEditor ${className}`}
      placeholder={placeholder}
      tabIndex={tabIndex}
      theme='snow'
      value={contentDelta}
      onChange={handleChange}
      modules={{
        toolbar: ([[{ header: 1 }, { header: 2 }]] as any).concat([
          ['bold', 'italic', 'strike'],
          ['link', 'code-block', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
        ]),
        imageDropAndPaste: {
          handler: handleImageDropAndPaste
        }
      }}
    />
  )

}

export default ReactQuillEditor;
