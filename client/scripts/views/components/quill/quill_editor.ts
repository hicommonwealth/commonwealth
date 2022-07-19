import { Quill, Editor } from 'quill';
import { QuillEditorComponent } from './quill_editor_component';
import QuillEditorInternal from './quill_editor_internal';
import { QuillActiveMode, QuillDelta, QuillTextContents } from './types';

// DOCUMENTATION
// Standard usage flow:
// Create a new Quill object, and assign it to a state variable for reuse
// When submitting a form:
//    1. Call disableEditor() to freeze editor state.
//    2. Use editorIsBlank() to check text state
//    3. Use the textContents getter to grab form data.
//    4. Re-enable the editor if it will be reused on the page.

// TODO: https://stackoverflow.com/questions/2156129/is-there-a-standard-way-to-organize-methods-within-a-class/2156179
export class QuillEditor extends QuillEditorInternal {
  public get activeMode(): QuillActiveMode {
    return this._activeMode;
  }

  public get outerEditor(): Quill {
    return this._quill;
  }

  public get innerEditor(): Editor {
    return this._quill.editor;
  }

  public get markdownMode(): boolean {
    return this._activeMode === 'markdown';
  }

  public get textContents(): QuillTextContents {
    // TODO: Check on this vs inner editor
    return this.markdownMode
      ? this._quill.getText()
      : JSON.stringify(this._quill.getContents());
  }

  public get alteredText(): boolean {
    return this._alteredText;
  }

  public set alteredText(bool: boolean) {
    this._alteredText = bool;
  }

  constructor(
    $editor: JQuery<HTMLElement>,
    defaultMode: QuillActiveMode,
    theme: string,
    imageUploader: boolean,
    placeholder: string,
    editorNamespace: string,
    onkeyboardSubmit: () => void,
    defaultContents: QuillTextContents,
    tabIndex?: number
  ) {
    super($editor, defaultMode, editorNamespace, onkeyboardSubmit);
    this._initializeEditor(
      theme,
      imageUploader,
      placeholder,
      defaultContents,
      tabIndex
    );
  }

  public clearUnsavedChanges(): void {
    this._clearUnsavedChanges();
  }

  public disable(document?: Document): void {
    this._quill.enable(false);

    // Disable mentions container
    if (document) {
      const mentionsEle = document.getElementsByClassName(
        'ql-mention-list-container'
      )[0];
      if (mentionsEle) {
        (mentionsEle as HTMLElement).style.visibility = 'hidden';
      }
    }
  }

  public isBlank(): boolean {
    // TODO: Check on this vs outer editor
    if (this._quill.editor.isBlank()) return true;
    if (
      this._quill.editor.getText() === '' &&
      this._quill.editor.getDelta()?.ops.length === 1 &&
      this._quill.editor.getDelta()?.ops[0]?.insert === '\n'
    ) {
      return true;
    }
    return false;
  }

  public enable(): void {
    this._quill.enable(true);
  }

  public getTextContents(stringifyDelta = false): QuillTextContents | string {
    return this.markdownMode
      ? this._quill.getText()
      : stringifyDelta
      ? JSON.stringify(this.innerEditor.getContents())
      : this._quill.getContents();
  }

  public resetEditor(): void {
    this.enable();
    this._quill.setContents([{ insert: '\n' }]);
    this._clearUnsavedChanges();
    this._alteredText = false;
  }

  public getContents(): QuillDelta {
    return this._quill.innerEditor.getContents() as QuillDelta;
  }

  public setContents(contents: QuillDelta) {
    this._quill.innerEditor.setContents(contents);
  }

  public getText(): string {
    return this._quill.innerEditor.getText();
  }

  public setSelection(index: number) {
    this._quill.innerEditor.setSelection(index);
  }

  public removeFormat(startIndex: number, endIndex: number) {
    return this._quill.innerEditor.removeFormat(startIndex, endIndex);
  }
}
