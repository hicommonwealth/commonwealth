import { LexicalExportVisitor } from 'commonwealth-mdxeditor';
import * as Mdast from 'mdast';
import {
  $isMentionNode,
  MentionNode,
} from 'views/components/MarkdownEditor/plugins/MentionNode';

export const MentionVisitor: LexicalExportVisitor<MentionNode, Mdast.Link> = {
  testLexicalNode: $isMentionNode,
  visitLexicalNode: ({ lexicalNode, actions }) => {
    console.log('FIXME: visitLexicalNode');
    actions.addAndStepInto('link', {
      url: 'http://example.com#mention',
      title: 'FIXME title',
    });
  },
};
