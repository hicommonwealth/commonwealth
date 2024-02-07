import React, { ReactNode } from 'react';
import { CWCard } from '../cw_card';
import { CWText } from '../cw_text';
import './CWContentPageCard.scss';

type ContentPageCardProps = {
  content: ReactNode;
  header: string;
};

export const CWContentPageCard = (props: ContentPageCardProps) => {
  const { content, header } = props;

  return (
    <CWCard className="ContentPageCard">
      <div className="header-container">
        <CWText type="h5" fontWeight="semiBold">
          {header}
        </CWText>
      </div>
      {content}
    </CWCard>
  );
};
