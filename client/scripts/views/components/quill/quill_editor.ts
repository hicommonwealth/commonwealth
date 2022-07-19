import { Quill, Editor } from 'quill';
import { QuillEditorComponent } from './quill_editor_component';
import QuillEditorInternal from './quill_editor_internal';
import { QuillActiveMode, QuillTextContents } from './types';

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
    return this.markdownMode
      ? this.outerEditor.getText()
      : JSON.stringify(this.outerEditor.getContents());
  }

  public get alteredText(): boolean {
    return this._parentState.alteredText;
  }

  public set alteredText(bool: boolean) {
    this._parentState.alteredText = bool;
  }

  constructor(
    $editor: JQuery<HTMLElement>,
    activeMode: QuillActiveMode,
    theme: string,
    imageUploader: boolean,
    placeholder: string,
    editorNamespace: string,
    parentState: QuillEditorComponent,
    onkeyboardSubmit: () => void,
    defaultContents: QuillTextContents,
    tabIndex?: number
  ) {
    super($editor, activeMode, editorNamespace, parentState, onkeyboardSubmit);
    this.initializeEditor(
      theme,
      imageUploader,
      placeholder,
      defaultContents,
      tabIndex
    );
  }

  public disable(document?: Document): void {
    this.outerEditor.enable(false);

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
    if (this.innerEditor.isBlank()) return true;
    if (
      this.innerEditor.getText() === '' &&
      this.innerEditor.getDelta()?.ops.length === 1 &&
      this.innerEditor.getDelta()?.ops[0]?.insert === '\n'
    ) {
      return true;
    }
    return false;
  }

  public enable(): void {
    this.outerEditor.enable(true);
  }

  public getTextContents(stringifyDelta = false): QuillTextContents | string {
    return this.markdownMode
      ? this.innerEditor.getText()
      : stringifyDelta
      ? JSON.stringify(this.innerEditor.getContents())
      : this.innerEditor.getContents();
  }

  public resetEditor(): void {
    this.enable();
    this.innerEditor.setContents([{ insert: '\n' }]);
    this._parentState.clearUnsavedChanges();
    this._parentState.alteredText = false;
  }
}
