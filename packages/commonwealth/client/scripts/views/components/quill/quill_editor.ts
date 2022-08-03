import m from 'mithril';
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

  // Returns editor contents as Delta. Ideal for handling RichText.
  // Use `text` getter for Markdown formattting.
  public get contents(): QuillDelta {
    return this._quill.getContents() as QuillDelta;
  }

  public set contents(contents: QuillDelta) {
    this._quill.setContents(contents);
    this._quill.setSelection(this.endIndex);
  }

  // Index location of , used to set cursor and clear formatting
  public get endIndex(): number {
    return this._quill.getLength() ? this._quill.getLength() - 1 : 0;
  }

  public get markdownMode(): boolean {
    return this._activeMode === 'markdown';
  }

  // Returns editor contents as string. Ideal for Markdown.
  // Use `contents` getter for Markdown formattting.
  public get text(): string {
    return this._quill.getText();
  }

  public set text(contents: string) {
    this._quill.setText(contents);
    this._quill.setSelection(this.endIndex);
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

  public clearLocalStorage(): void {
    this._clearLocalStorage();
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

  public isBlank(): boolean {
    if (this._quill.editor.isBlank()) return true;
    if (this._quill.getText() === '\n') return true;
    return false;
  }

  // Load a template or draft and overwrite activeMode
  public loadDocument(document: string) {
    try {
      const documentDelta = JSON.parse(document);
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
    return this._quill.removeFormat(startIndex, endIndex);
  }

  // Clears editor and resets state
  public resetEditor(doc: QuillDelta = { ops: [{ insert: '\n' }] }): void {
    this.enable();
    this._alteredText = false;
    this._quill.setContents(doc);
    this._clearLocalStorage();
    m.redraw();
  }
}
