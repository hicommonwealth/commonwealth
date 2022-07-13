import _ from 'lodash';
import Quill from 'quill-2.0-dev/quill';

import app from 'state';
import { QuillEditorComponent } from './quill_editor';
import QuillEditorInternal from './quill_editor_internal';
import { QuillTextContents } from './types';

// MONDAY TODO:
//  - Merge with quill.ts class public methods
//  - Replace activeMode getter with new system

const Delta = Quill.import('delta');
export class QuillEditor extends QuillEditorInternal {
  // public get activeMode() {
  //   // TODO: Can't we store internally? Seems unneccessary/fragile
  //   return this._$editor.parent('.markdown-mode').length > 0
  //     ? 'markdown'
  //     : 'richText';
  // }

  constructor(
    $editor: JQuery<HTMLElement>,
    theme: string,
    imageUploader: boolean,
    placeholder: string,
    editorNamespace: string,
    parentState: QuillEditorComponent,
    onkeyboardSubmit: () => void,
    defaultContents: QuillTextContents,
    tabIndex?: number
  ) {
    super(
      $editor,
      theme,
      imageUploader,
      placeholder,
      editorNamespace,
      parentState,
      onkeyboardSubmit
    );
    this.initializeEditor(defaultContents, tabIndex);
  }
}
