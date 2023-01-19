/* @jsx jsx */
import React from 'react';

import { ClassComponent, ResultNode, jsx } from 'mithrilInterop';

import 'components/code_block.scss';

import { getClasses } from './component_kit/helpers';
import { CWLabel } from './component_kit/cw_label';

type CodeBlockAttrs = {
  clickToSelect: boolean;
};

export class CodeBlock extends ClassComponent<CodeBlockAttrs> {
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
