import React from 'react';
import { CWContentPageCard } from '../component_kit/CWContentPageCard';
import { CWButton } from '../component_kit/new_designs/CWButton';

import './ImageActionCard.scss';

interface ImageActionCardProps {
  onClick: () => void;
  disabled?: boolean;
}

export const ImageActionCard = ({
  onClick,
  disabled = false,
}: ImageActionCardProps) => {
  return (
    <CWContentPageCard
      header="Add Image to Thread"
      content={
        <div className="ImageActionCard">
          <CWButton
            label="Generate Image"
            onClick={onClick}
            disabled={disabled}
            buttonHeight="sm"
          />
        </div>
      }
      showCollapsedIcon={true}
    />
  );
};
