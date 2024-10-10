import React, { ReactNode, useState } from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import './CWAccordion.scss';

type CWAccordionProps = {
  header: ReactNode;
  content?: ReactNode;
};

const CWAccordion = ({ header, content }: CWAccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      open={isOpen}
      className="CWAccordion"
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary>
        <CWText type="h5" fontWeight="semiBold">
          {header}
        </CWText>

        <CWIcon iconName={!isOpen ? 'plus' : 'minus'} />
      </summary>
      <div className="content-container">{content}</div>
    </details>
  );
};

export default CWAccordion;
