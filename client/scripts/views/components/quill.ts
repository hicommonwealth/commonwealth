// TODO: https://stackoverflow.com/questions/2156129/is-there-a-standard-way-to-organize-methods-within-a-class/2156179

// DOCUMENTATION
// Standard usage flow:
// Create a new Quill object, and assign it to a state variable for reuse
// When submitting a form:
//    1. Call disableEditor() to freeze editor state.
//    2. Use editorIsBlank() to check text state
//    3. Use the textContents getter to grab form data.
//    4. Re-enable the editor if it will be reused on the page.

export default class Quill {
  private readonly _editorState;

  public get outerEditor() {
    return this._editorState.editor;
  }

  public get innerEditor() {
    return this._editorState.editor.editor;
  }

  public get markdownMode() {
    return this._editorState.markdownMode;
  }

  public get textContents() {
    return this.markdownMode
      ? this.outerEditor.getText()
      : JSON.stringify(this.outerEditor.getContents());
  }

  constructor(quillEditorState: any) {
    this._editorState = quillEditorState;
  }

  public disableEditor(document: Document) {
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

  public editorIsBlank() {
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

  public enableEditor() {
    this.outerEditor.enable(true);
  }
}
