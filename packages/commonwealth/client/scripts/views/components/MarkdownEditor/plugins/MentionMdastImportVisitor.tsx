import { MdastImportVisitor } from 'commonwealth-mdxeditor';
import * as Mdast from 'mdast';
import { $createMentionNode } from 'views/components/MarkdownEditor/plugins/MentionNode';

export const MentionMdastImportVisitor: MdastImportVisitor<Mdast.Link> = {
  testNode: 'mention',
  visitNode({ mdastNode, actions }) {
    console.log('FIXME: MentionMdastImportVisitor.visitNode');
    actions.addAndStepInto(
      // FIXME
      $createMentionNode(mdastNode.url),
    );
  },
};
