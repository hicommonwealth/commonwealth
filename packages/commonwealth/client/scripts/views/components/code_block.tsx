import React from 'react';

import { ClassComponent, ResultNode} from

 'mithrilInterop';

import 'components/code_block.scss';
import { CWLabel } from './component_kit/cw_label';

import { getClasses } from './component_kit/helpers';

type CodeBlockAttrs = {
  clickToSelect: boolean;
};

export class CodeBlock extends ClassComponent<CodeBlockAttrs> {
  private readonly codeBlockRef: React.RefObject<HTMLDivElement>;
  constructor(props) {
    super(props);
    this.codeBlockRef = React.createRef();
  }

  view(vnode: ResultNode<CodeBlockAttrs>) {
    const { clickToSelect } = vnode.attrs;

    return (
      <div
        ref={this.codeBlockRef}
        className={getClasses<CodeBlockAttrs>({ clickToSelect }, 'CodeBlock')}
      >
        <CWLabel label="Use subkey to sign this transaction" />
        <pre
          onClick={(e) => {
            e.preventDefault();

            const element = this.codeBlockRef.current;

            if (window.getSelection) {
              const sel = window.getSelection();

              sel.removeAllRanges();

              const range = document.createRange();

              range.selectNodeContents(element);

              sel.addRange(range);
            }
          }}
        >
          {vnode.children}
        </pre>
      </div>
    );
  }
}
