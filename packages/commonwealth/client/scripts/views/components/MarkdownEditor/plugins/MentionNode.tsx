/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $applyNodeReplacement,
  TextNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
} from 'lexical';

export type SerializedMentionNode = Spread<
  {
    mentionName: string;
  },
  SerializedTextNode
>;

function $convertMentionElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  console.log('FIXME $convertMentionElement');

  const textContent = domNode.textContent;

  if (textContent !== null) {
    const node = $createMentionNode(textContent);
    return {
      node,
    };
  }

  return null;
}

export class MentionNode extends TextNode {
  __mention: string;

  constructor(mentionName: string, text?: string, key?: NodeKey) {
    super(text ?? mentionName, key);
    this.__mention = mentionName;
  }

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    console.log('FIXME clone');
    return new MentionNode(node.__mention, node.__text, node.__key);
  }
  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    console.log('FIXME importJSON');

    const node = $createMentionNode(serializedNode.mentionName);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedMentionNode {
    console.log('FIXME exportJSON');
    return {
      ...super.exportJSON(),
      type: 'mention',
      mentionName: this.__mention,
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    console.log('FIXME createDOM');

    // FIXME: if I type a space after it goes a way and is replaced with text
    // FIXME: the export is only in markdown format!

    const dom = document.createElement('a');
    dom.setAttribute('data-lexical-mention', 'true');
    dom.textContent = '@' + this.__text;
    return dom;
  }

  exportDOM(): DOMExportOutput {
    console.log('FIXME exportDOM');

    const element = document.createElement('a');
    element.setAttribute('data-lexical-mention', 'true');
    element.textContent = '@' + this.__text;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    console.log('FIXME importDOM');
    return {
      a: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mention')) {
          return null;
        }
        return {
          conversion: $convertMentionElement,
          priority: 1,
        };
      },
    };
  }

  isTextEntity(): true {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createMentionNode(mentionName: string): MentionNode {
  console.log('FIXME $createMentionNode');

  const mentionNode = new MentionNode(mentionName);
  mentionNode.setMode('segmented').toggleDirectionless();
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  console.log('FIXME $isMentionNode');

  return node instanceof MentionNode;
}
