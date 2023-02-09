import React from 'react';

import { ClassComponent, ResultNode } from 'mithrilInterop';

import 'components/code_block.scss';
import { CWLabel } from './component_kit/cw_label';

import { getClasses } from './component_kit/helpers';

type CodeBlockProps = {
  clickToSelect: boolean;
} & React.PropsWithChildren;

export const CodeBlock = (props: CodeBlockProps) => {
  const { clickToSelect } = props;

  const codeBlockRef = React.useRef<HTMLDivElement>();

  return (
    <div
      ref={codeBlockRef}
      className={getClasses<{ clickToSelect: boolean }>(
        { clickToSelect },
        'CodeBlock'
      )}
    >
      <CWLabel label="Use subkey to sign this transaction" />
      <pre
        onClick={(e) => {
          e.preventDefault();

          const element = codeBlockRef.current;

          if (window.getSelection) {
            const sel = window.getSelection();

            sel.removeAllRanges();

            const range = document.createRange();

            range.selectNodeContents(element);

            sel.addRange(range);
          }
        }}
      >
        {props.children}
      </pre>
    </div>
  );
};
