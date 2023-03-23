import React, { useCallback, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'components/react_quill/react_quill_editor.scss';

import imageDropAndPaste from 'quill-image-drop-and-paste'

import type { DeltaOperation, DeltaStatic } from 'quill';
import type { QuillMode } from '../quill/types';
import 'react-quill/dist/quill.snow.css';
import { base64ToFile, uploadFileToS3 } from './utils';

import app from 'state';

const VALID_IMAGE_TYPES = ['jpeg', 'gif', 'png']

const LoadingIndicator = () => {
  return (
    <div className='LoadingIndicator'>
      <div className="outer-circle">
        <div className="inner-circle"></div>
      </div>
    </div>
  )
}

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

  const editorRef = useRef<ReactQuill>()

  const [isUploading, setIsUploading] = useState<boolean>(false)

  const handleChange = (value, delta, source, editor) => {
    setContentDelta(editor.getContents())
  }

  // must use memoized function or else it'll render in an infinite loop
  const handleImageDropAndPaste = useCallback(async (imageDataUrl, imageType) => {

    const editor = editorRef.current?.editor

    try {
      if (!editor) {
        throw new Error('editor is not set')
      }

      setIsUploading(true)

      editor.disable()

      if (!imageType) {
        imageType = 'image/png'
      }

      const selectedIndex = editor.getSelection()?.index || editor.getLength() || 0

      // filter out ops that contain a base64 image
      const opsWithoutBase64Images : DeltaOperation[] = (editor.getContents() || [])
        .filter((op) => {
          for (const imageType of VALID_IMAGE_TYPES) {
            const base64Prefix = `data:image/${imageType};base64`
            if (op.insert?.image?.startsWith(base64Prefix)) {
              return false
            }
          }
          return true
        })
      setContentDelta({ ops: opsWithoutBase64Images } as DeltaStatic)

      const file = base64ToFile(imageDataUrl, imageType)

      const uploadedFileUrl = await uploadFileToS3(file, app.serverUrl(), app.user.jwt)

      // insert image op at the selected index
      editor.insertEmbed(selectedIndex, 'image', uploadedFileUrl)
      setContentDelta(editor.getContents()) // sync state with editor content

    } catch (err) {
      console.error(err)
    } finally {
      editor.enable()
      setIsUploading(false)
    }

  }, [editorRef, setContentDelta])

  return (
    <div className='QuillEditorWrapper'>
      {isUploading && <LoadingIndicator/>}
      <ReactQuill
        ref={editorRef}
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
    </div>
  )

}

export default ReactQuillEditor;
