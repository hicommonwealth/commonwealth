import { Quill, Editor } from 'quill';
import QuillEditorInternal from './quill_editor_internal';
import { QuillActiveMode, QuillDelta, QuillTextContents } from './types';

// DOCUMENTATION
// Standard usage flow:
// Create a new Quill object, and assign it to a state variable for reuse
// When submitting a form:
//    1. Call disableEditor() to freeze editor state.
//    2. Use editorIsBlank() to check text state
//    3. Use the textContentsAsString getter to grab form data.
//    4. Re-enable the editor if it will be reused on the page.

export class QuillEditor extends QuillEditorInternal {
  public get activeMode(): QuillActiveMode {
    return this._activeMode;
  }

  public set activeMode(mode: QuillActiveMode) {
    this._activeMode = mode;
  }

  // Tracks whether document state has changed, for triggering saves
  public get alteredText(): boolean {
    return this._alteredText;
  }

  public set alteredText(bool: boolean) {
    this._alteredText = bool;
  }

  // Returns editor contents as Delta. Ideal for RichText.
  public get contents(): QuillDelta {
    return this._quill._editor.getContents() as QuillDelta;
  }

  public set contents(contents: QuillDelta) {
    this._quill._editor.setContents(contents);
    this._quill._editor.setSelection(this.endIndex);
  }

  // Final indexed, used to set cursor and clear formatting
  public get endIndex(): number {
    return this._quill.editor.getText().length - 1;
  }

  public get innerEditor(): Editor {
    return this._quill.editor;
  }

  public get markdownMode(): boolean {
    return this._activeMode === 'markdown';
  }

  public get outerEditor(): Quill {
    return this._quill;
  }

  // Returns editor contents as string. Ideal for Markdown.
  public get text(): string {
    return this._quill._editor.getText();
  }

  public set text(contents: string) {
    this._quill._editor.setText(contents);
    this._quill._editor.setSelection(this.endIndex);
  }

  // TODO: Check on this vs inner editor
  public get textContentsAsString(): string {
    return this.markdownMode
      ? this._quill.getText()
      : JSON.stringify(this._quill.getContents());
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

    // Disable mentions plugin container
    if (document) {
      const mentionsEle = document.getElementsByClassName(
        'ql-mention-list-container'
      )[0];
      if (mentionsEle) {
        (mentionsEle as HTMLElement).style.visibility = 'hidden';
      }
    }
  }

  public enable(): void {
    this._quill.enable(true);
  }

  // TODO: Check on this vs outer editor
  public isBlank(): boolean {
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

  // Load a template or draft and overwrite activeMode
  public loadDocument(document: string) {
    try {
      const documentDelta = JSON.parse(document)?.ops;
      if (!documentDelta.ops) throw new Error();
      this.activeMode = 'richText';
      this.contents = documentDelta;
    } catch (e) {
      this.activeMode = 'markdown';
      this.text = document;
    }
  }

  // Strips all formatting, e.g. when switching from RichText to Markdown
  public removeFormat(startIndex: number, endIndex: number) {
    return this._quill.innerEditor.removeFormat(startIndex, endIndex);
  }

  // Clears editor and resets state
  public resetEditor(): void {
    this.enable();
    this._quill.setContents([{ insert: '\n' }]);
    this._clearUnsavedChanges();
    this._alteredText = false;
  }
}
