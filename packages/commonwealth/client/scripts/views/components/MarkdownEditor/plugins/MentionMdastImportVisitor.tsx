import { Descriptors, MdastImportVisitor } from 'commonwealth-mdxeditor';
import { ElementNode } from 'lexical';
import * as Mdast from 'mdast';
import {
  $createMentionNode,
  parseHandleFromMention,
  parseIdFromPath,
} from 'views/components/MarkdownEditor/plugins/MentionNode';

const USE_ELEMENT_NODE_STRATEGY = true;

export const MentionMdastImportVisitor: MdastImportVisitor<Mdast.Link> = {
  testNode: (mdastNode: Mdast.Nodes, options: Descriptors): boolean => {
    console.log('FIXME within MentionMdastImportVisitor.testNode: ', mdastNode);

    // FIXME: ok this part is looking good because I figured out how to
    // activate the import.

    if (mdastNode.type !== 'link') return false;

    if (mdastNode.children.length !== 1) {
      return false;
    }

    const firstChild = mdastNode.children[0];

    if (firstChild.type !== 'text') {
      throw new Error('First child is not text');
    }

    const value = firstChild.value;

    return !!value && value.startsWith('@');
  },
  visitNode({ mdastNode, actions, mdastParent, lexicalParent }) {
    // FIXME: this part isn't working because I get an issue where teh parent is not available.
    // FIXME I need to look at the source of createLinkNode as maybe it creates itw own parent?

    // FIXME: this neds to be fixed next...
    console.log(
      'FIXME within MentionMdastImportVisitor.visitNode: ',
      mdastNode,
    );

    console.log('FIXME mdastParent: ', mdastParent);
    console.log('FIXME lexicalParent: ', lexicalParent);

    console.log(
      'FIXME: MentionMdastImportVisitor.visitNode: actions: ',
      actions,
    );

    const uid = parseIdFromPath(mdastNode.url) ?? '';

    if (mdastNode.children.length !== 1) {
      throw new Error('Expected only one child node');
    }

    const firstChild = mdastNode.children[0];

    if (firstChild.type !== 'text') {
      throw new Error('Expected text node');
    }

    const handle = parseHandleFromMention(firstChild.value);

    if (!handle) {
      throw new Error('Could not parse handle from mention');
    }

    const mentionNode = $createMentionNode(handle, uid);
    console.log('FIXME: mentionNode created for handle: ', { handle, uid });

    function isParent(node: unknown): node is Mdast.Parent {
      return (node as { children?: any[] }).children instanceof Array;
    }

    if (USE_ELEMENT_NODE_STRATEGY) {
      actions.addAndStepInto(mentionNode);
    } else {
      (lexicalParent as ElementNode).append(mentionNode);

      if (isParent(mdastNode)) {
        actions.visitChildren(mdastNode, lexicalParent);
      }
    }
  },
};
