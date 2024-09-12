import {
  Realm,
  codeBlockEditorDescriptors$,
  directiveDescriptors$,
  importMarkdownToLexical,
  importVisitors$,
  jsxComponentDescriptors$,
  mdastExtensions$,
  syntaxExtensions$,
} from 'commonwealth-mdxeditor';
import { LexicalNode } from 'lexical';
import { MarkdownStr } from 'views/components/MarkdownEditor/MarkdownEditor';

// OK:
//
// There are TWO ways we could do this:
//
// 1.  We could just use the stock markdown plugin and toggle the toolbar and
// buttons when the editor is loaded but this depends on DOM SSR and might not
// work.

export function markdownToHTML(markdown: MarkdownStr) {
  const r = new Realm();

  //const selection = $getSelection()

  const importPoint = {
    children: [] as LexicalNode[],
    append(node: LexicalNode) {
      this.children.push(node);
    },
    getType() {
      console.log('FIXME:called getType');
      // FIXME: is this needed?
      // return selection!.getNodes()[0].getType()
      return '';
    },
  };

  const node = importPoint;

  // TODO: we're getting UnrecognizedMarkdownConstructError but it's false
  // because a visitor is coming back null and I'm not sure why.

  console.log('FIXME: ', importVisitors$);

  // FIXME: instead of using realm here, maybe get these values DIRECTLY instead
  // of through Realm.

  importMarkdownToLexical({
    root: node,
    visitors: r.getValue(importVisitors$),
    mdastExtensions: r.getValue(mdastExtensions$),
    markdown,
    syntaxExtensions: r.getValue(syntaxExtensions$),
    jsxComponentDescriptors: r.getValue(jsxComponentDescriptors$),
    directiveDescriptors: r.getValue(directiveDescriptors$),
    codeBlockEditorDescriptors: r.getValue(codeBlockEditorDescriptors$),
  });

  return '';
}
