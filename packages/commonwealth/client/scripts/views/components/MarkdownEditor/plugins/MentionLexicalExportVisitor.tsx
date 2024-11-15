import { LexicalExportVisitor } from 'commonwealth-mdxeditor';
import * as Mdast from 'mdast';
import {
  $isMentionNode,
  MentionNode,
} from 'views/components/MarkdownEditor/plugins/MentionNode';

export const MentionLexicalExportVisitor: LexicalExportVisitor<
  MentionNode,
  Mdast.Link
> = {
  testLexicalNode: $isMentionNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    console.log('FIXME: MentionLexicalExportVisitor.visitLexicalNode');
    actions.addAndStepInto('mention', {
      url: 'http://example.com#mention',
      title: 'FIXME title',
    });
  },
};
