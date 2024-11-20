/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $applyNodeReplacement,
  $isRangeSelection,
  BaseSelection,
  EditorConfig,
  ElementNode,
  RangeSelection,
  SerializedElementNode,
  isHTMLAnchorElement,
  type DOMConversionMap,
  type DOMConversionOutput,
  type LexicalNode,
  type NodeKey,
  type Spread,
} from 'lexical';

export type SerializedMentionNode = Spread<
  {
    handle: string;
    uid: string;
  },
  SerializedElementNode
>;

export function parseIdFromPath(path: string): string | null {
  const match = path.match(/\/(\d+)$/);
  return match ? match[1] : null;
}

export function parseHandleFromMention(atMention: string): string | null {
  const match = atMention.match(/^@(\w+)$/);
  return match ? match[1] : null;
}

const $convertMentionElement = (
  domNode: HTMLElement,
): DOMConversionOutput | null => {
  const handle = parseHandleFromMention(domNode.textContent ?? '');
  const id = parseIdFromPath(domNode.getAttribute('href') ?? '');

  if (handle && id) {
    const node = $createMentionNode(handle, id);
    return {
      node,
    };
  }

  return null;
};

function $convertAnchorElement(domNode: Node): DOMConversionOutput {
  let node: MentionNode | null = null;
  if (isHTMLAnchorElement(domNode)) {
    const content = domNode.textContent;
    if ((content !== null && content !== '') || domNode.children.length > 0) {
      const handle = parseHandleFromMention(domNode.textContent ?? '');
      const id = parseIdFromPath(domNode.getAttribute('href') ?? '');

      if (handle && id) {
        node = $createMentionNode(handle, id);
      }
    }
  }
  return { node };
}

export default function normalizeClassNames(
  ...classNames: Array<typeof undefined | boolean | null | string>
): Array<string> {
  const rval: string[] = [];
  for (const className of classNames) {
    if (className && typeof className === 'string') {
      for (const [s] of className.matchAll(/\S+/g)) {
        rval.push(s);
      }
    }
  }
  return rval;
}

/**
 * Takes an HTML element and adds the classNames passed within an array,
 * ignoring any non-string types. A space can be used to add multiple classes
 * eg. addClassNamesToElement(element, ['element-inner active', true, null])
 * will add both 'element-inner' and 'active' as classes to that element.
 * @param element - The element in which the classes are added
 * @param classNames - An array defining the class names to add to the element
 */
export function addClassNamesToElement(
  element: HTMLElement,
  ...classNames: Array<typeof undefined | boolean | null | string>
): void {
  const classesToAdd = normalizeClassNames(...classNames);
  if (classesToAdd.length > 0) {
    element.classList.add(...classesToAdd);
  }
}

type MentionHTMLElementType = HTMLAnchorElement;

/**
 *
 * Mention node that handles mentions.
 *
 * The markdown syntax is:
 *
 * [@inputneuron](/profile/id/3)
 */
export class MentionNode extends ElementNode {
  /** @internal */
  __handle: string;

  /** @internal */
  __uid: string;

  __url: string;

  static getType(): string {
    console.log('FIXME: getType');
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    console.log('FIXME clone');
    return new MentionNode(node.__handle, node.__uid, node.__key);
  }

  constructor(handle: string, uid: string, key?: NodeKey) {
    super(key);
    console.log('FIXME new mention node being created.');
    this.__handle = handle;
    this.__uid = uid;
    this.__url = '/profile/id/' + uid;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('a');
    element.href = this.__url;
    element.textContent = '@' + this.__handle;
    element.contentEditable = 'true';
    element.setAttribute('data-lexical-mention', 'true');
    addClassNamesToElement(element, config.theme.link);
    return element;
  }

  updateDOM(
    prevNode: MentionNode,
    anchor: MentionHTMLElementType,
    config: EditorConfig,
  ): boolean {
    if (anchor instanceof HTMLAnchorElement) {
      anchor.href = this.__url;
      anchor.setAttribute('data-lexical-mention', 'true');
      if (anchor.firstElementChild) {
        anchor.removeChild(anchor.firstElementChild);
      }
      anchor.textContent = '@' + this.__handle;
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    console.log('FIXME importDOM');
    return {
      a: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mention')) {
          return null;
        }
        return {
          //conversion: $convertMentionElement,
          conversion: $convertAnchorElement,
          priority: 1,
        };
      },
    };
  }
  // FIXME here ******************************

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    console.log('FIXME importJSON');
    const node = $createMentionNode(serializedNode.handle, serializedNode.uid);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedMentionNode {
    console.log('FIXME exportJSON');
    return {
      ...super.exportJSON(),
      type: 'mention',
      handle: this.__handle,
      uid: this.__uid,
      version: 1,
    };
  }

  insertNewAfter(
    _: RangeSelection,
    restoreSelection = true,
  ): null | ElementNode {
    console.log('FIXME: insertNewAfter');

    const node = $createMentionNode(this.__handle, this.__uid);
    this.insertAfter(node, restoreSelection);
    return node;
  }

  canInsertTextBefore(): boolean {
    console.log('FIXME: canInsertTextBefore');
    return false;
  }

  canInsertTextAfter(): boolean {
    console.log('FIXME: canInsertTextAfter');
    return false;
  }
  isInline(): boolean {
    console.log('FIXME: isInline');
    return true;
  }
  isSelectable(): boolean {
    return true; // Allow the cursor to select the node
  }

  collapseAtStart(): boolean {
    console.log('FIXME: collapseAtStart');
    return true; // Allow the cursor to move into the node from the left
  }
  canBeEmpty(): boolean {
    console.log('FIXME: canBeEmpty');
    return false;
  }

  extractWithChild(
    child: LexicalNode,
    selection: BaseSelection,
    destination: 'clone' | 'html',
  ): boolean {
    console.log('FIXME: extractWithChild');

    if (!$isRangeSelection(selection)) {
      return false;
    }

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    return (
      this.isParentOf(anchorNode) &&
      this.isParentOf(focusNode) &&
      selection.getTextContent().length > 0
    );
  }
}

export function $createMentionNode(handle: string, uid: string): MentionNode {
  console.log('FIXME $createMentionNode', { handle, uid });
  const mentionNode = new MentionNode(handle, uid);
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  console.log('FIXME $isMentionNode');

  return node instanceof MentionNode;
}
