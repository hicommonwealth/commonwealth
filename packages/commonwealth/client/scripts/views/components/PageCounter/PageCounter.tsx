import React from 'react';
import { CWText } from '../component_kit/cw_text';
import CWIconButton from '../component_kit/new_designs/CWIconButton';
import './PageCounter.scss';

type PageCounterProps = {
  totalPages: number;
  activePage?: number;
  onPageChange?: (pageNumber: number) => void;
  disabled?: boolean;
};

const PageCounter = ({
  activePage = 1,
  totalPages,
  onPageChange,
  disabled,
}: PageCounterProps) => {
  return (
    <div className="PageCounter">
      {totalPages > 1 && (
        <CWIconButton
          type="button"
          buttonSize="sm"
          iconName="chevronLeft"
          disabled={activePage === 1 || disabled}
          onClick={() => onPageChange?.(activePage - 1)}
        />
      )}
      <span className="counter">
        <CWText>
          {activePage} / {totalPages}
        </CWText>
      </span>
      {totalPages > 1 && (
        <CWIconButton
          type="button"
          buttonSize="sm"
          iconName="chevronRight"
          disabled={activePage === totalPages || disabled}
          onClick={() => onPageChange?.(activePage + 1)}
        />
      )}
    </div>
  );
};

export default PageCounter;
