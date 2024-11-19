import { Descriptors, MdastImportVisitor } from 'commonwealth-mdxeditor';
import * as Mdast from 'mdast';
import {
  $createMentionNode,
  parseIdFromPath,
} from 'views/components/MarkdownEditor/plugins/MentionNode';

export const MentionMdastImportVisitor: MdastImportVisitor<Mdast.Link> = {
  testNode: (mdastNode: Mdast.Nodes, options: Descriptors): boolean => {
    console.log('FIXME within testNode: ', mdastNode);

    // FIXME: ok this part is looking good because I figured out how to
    // activate the import.

    if (mdastNode.type !== 'link') return false;

    if (mdastNode.children.length !== 1) {
      return false;
    }

    const firstChild = mdastNode.children[0];

    const value = (firstChild as any).value as string | undefined | null;

    return !!value && value.startsWith('@');
  },
  visitNode({ mdastNode, actions }) {
    // FIXME: this part isn't working because I get an issue where teh parent is not available.
    // FIXME I need to look at the source of createLinkNode as maybe it creates itw own parent?

    // FIXME: this neds to be fixed next...

    console.log(
      'FIXME: MentionMdastImportVisitor.visitNode: actions: ',
      actions,
    );

    const uid = parseIdFromPath(mdastNode.url) ?? '';
    // const handle = parseHandleFromMention(mdastNode.data)
    const handle = 'FIXME';

    const mentionNode = $createMentionNode(handle, uid);
    console.log('FIXME: mentionNode created!');
    actions.addAndStepInto(mentionNode);
    //
    // const linkNode = $createLinkNode(mdastNode.url, {
    //   title: mdastNode.title
    // })

    // actions.addAndStepInto(linkNode);
  },
};
