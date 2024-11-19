import {
  $applyNodeReplacement,
  DOMExportOutput,
  EditorConfig,
  SerializedTextNode,
  TextNode,
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
  SerializedTextNode
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
  let node: MentionNodeAsTextNode | null = null;
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

const mentionStyle = 'background-color: rgba(24, 119, 232, 0.2)';

/**
 *
 * Mention node that handles mentions.
 *
 * The markdoown syntax is:
 *
 * [@inputneuron](/profile/id/3)
 */
export class MentionNodeAsTextNode extends TextNode {
  /** @internal */
  __handle: string;

  /** @internal */
  __uid: string;

  __url: string;

  static getType(): string {
    console.log('FIXME: getType');
    return 'mention';
  }

  static clone(node: MentionNodeAsTextNode): MentionNodeAsTextNode {
    console.log('FIXME clone');
    return new MentionNodeAsTextNode(node.__handle, node.__uid, node.__key);
  }

  static importJSON(
    serializedNode: SerializedMentionNode,
  ): MentionNodeAsTextNode {
    console.log('FIXME importJSON');
    return $createMentionNode(serializedNode.handle, serializedNode.uid);
  }

  constructor(handle: string, uid: string, key?: NodeKey) {
    super(handle, key);
    console.log('FIXME new mention node being created.');
    this.__handle = handle;
    this.__uid = uid;
    this.__url = '/profile/id/' + uid;
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

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.style.cssText = mentionStyle;
    dom.className = 'mention';
    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-mention', 'true');
    element.textContent = this.__text;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
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

export function $createMentionNode(
  handle: string,
  uid: string,
): MentionNodeAsTextNode {
  console.log('FIXME $createMentionNode', { handle, uid });
  const mentionNode = new MentionNodeAsTextNode(handle, uid);
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNodeAsTextNode {
  console.log('FIXME $isMentionNode');

  return node instanceof MentionNodeAsTextNode;
}
