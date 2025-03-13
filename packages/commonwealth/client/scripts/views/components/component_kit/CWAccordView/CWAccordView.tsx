import React, { useState } from 'react';
import './CWAccordView.scss';

const CWAccordView = ({ title, children, defaultOpen = false }: any) => {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  const toggleAccord = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div className="accord-container">
        <div className="accord-header" onClick={toggleAccord}>
          <div className="accord-title">{title}</div>
          <div className={`accord-arrow ${isExpanded ? 'expanded' : ''}`}>
            {isExpanded ? '▲' : '▼'}
          </div>
        </div>
      </div>
      {isExpanded && <div className="accord-content">{children}</div>}
    </>
  );
};

export default CWAccordView;
