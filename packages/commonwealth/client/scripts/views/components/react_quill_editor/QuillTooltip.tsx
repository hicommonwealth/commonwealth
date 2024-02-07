import React from 'react';

interface QuillTooltipProps {
  label: string;
}

const QuillTooltip = ({ label }: QuillTooltipProps) => {
  return (
    <div className="QuillTooltip">
      <span>{label}</span>
    </div>
  );
};

export default QuillTooltip;
