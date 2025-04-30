import React from 'react';
import { CWCard } from '../component_kit/cw_card';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './ImageActionCard.scss'; // Ensure SCSS file is imported

interface ImageActionCardProps {
  onClick: () => void; // onClick is now for the button
  disabled?: boolean;
  tooltipText?: string; // Kept if needed for the button, but screenshot doesn't show it
}

export const ImageActionCard = ({
  onClick,
  disabled = false,
  // tooltipText = "Add or Generate Image", // Tooltip likely not needed for this layout
}: ImageActionCardProps) => {
  return (
    <CWCard className="ImageActionCard">
      <div className="card-header-content">
        {' '}
        {/* Container for title */}
        <h4>Add Image to Thread</h4> {/* Add title using h4 or similar */}
      </div>
      <div className="card-body-content">
        {' '}
        {/* Added container for potential styling */}
        <CWButton
          label="Add / Generate Image"
          onClick={onClick}
          disabled={disabled}
          // No icon shown in screenshot
          // You could add tooltip here if desired using CWTooltip wrapper
        />
      </div>
    </CWCard>
  );
};
