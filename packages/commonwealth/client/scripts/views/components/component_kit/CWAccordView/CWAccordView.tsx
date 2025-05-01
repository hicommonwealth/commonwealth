import React, { useState } from 'react';
import { CWIcon } from '../cw_icons/cw_icon';
import './CWAccordView.scss';
interface CWAccordViewProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}
const CWAccordView = ({
  title,
  children,
  defaultOpen = false,
}: CWAccordViewProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  const toggleAccord = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div className="AccordView">
        <div className="accord-header" onClick={toggleAccord}>
          <div className="accord-title">{title}</div>
          <CWIcon
            iconName={isExpanded ? 'caretDown' : 'caretUp'}
            iconSize="small"
            className="caret-icon"
            weight="bold"
            onClick={toggleAccord}
          />
        </div>
      </div>
      {isExpanded && <div className="accord-content">{children}</div>}
    </>
  );
};

export default CWAccordView;
