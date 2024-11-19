import { LexicalExportVisitor } from 'commonwealth-mdxeditor';
import * as Mdast from 'mdast';
import {
  $isMentionNode,
  MentionNodeAsTextNode,
} from 'views/components/MarkdownEditor/plugins/MentionNodeAsTextNode';

export const MentionLexicalExportVisitor: LexicalExportVisitor<
  MentionNodeAsTextNode,
  Mdast.Link
> = {
  testLexicalNode: $isMentionNode,

  // FIXME: for some reasont his is being called too!
  visitLexicalNode: ({ lexicalNode, actions }) => {
    console.log(
      'FIXME: MentionLexicalExportVisitor.visitLexicalNode: ' +
        lexicalNode.__handle,
    );

    // NOTE: that this MUST be type 'link' because this is an mdast node type
    // FIXME: this works BUT I need to figure out how to set the text of the link and the node...
    actions.addAndStepInto('link', {
      url: lexicalNode.__url,
      children: [{ type: 'text', value: '@' + lexicalNode.__handle }],
    });
  },
};
