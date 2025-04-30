import React from 'react';
import { CWContentPageCard } from '../component_kit/CWContentPageCard';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './ImageActionCard.scss'; // Ensure SCSS file is imported

interface ImageActionCardProps {
  onClick: () => void; // onClick is now for the button
  disabled?: boolean;
  // tooltipText is removed as it's likely not needed for this card structure
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
            // No icon shown in screenshot
          />
        </div>
      }
      showCollapsedIcon={true}
    />
  );
};
