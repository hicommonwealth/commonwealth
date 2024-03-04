import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import { notifySuccess } from 'controllers/app/notifications';
import { saveToClipboard } from 'utils/clipboard';
import * as colors from '../../../../../styles/mixins/colors.scss';

const colorKeys = [
  'neutral',
  'primary',
  'green',
  'yellow',
  'rorange',
  'pink',
  'purple',
];

const colorVariants = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800];

interface ColorCardProps {
  color: string;
  variant: number;
}

const ColorCard = ({ color, variant }: ColorCardProps) => {
  const colorHex = colors[`${color}-${variant}`];

  const handleCardClick = async () => {
    await saveToClipboard(colorHex);
    notifySuccess('Color copied');
  };

  return (
    <div className="ColorCard" onClick={handleCardClick}>
      <div
        className="color-field"
        style={{
          backgroundColor: colorHex,
        }}
      />
      <div className="color-info">
        <CWText fontWeight="medium">{variant}</CWText>
        <CWText type="b2">{colorHex.toUpperCase()}</CWText>
      </div>
    </div>
  );
};

// eslint-disable-next-line react/no-multi-comp
const ColorsShowcase = () => {
  return (
    <>
      {colorKeys.map((color) => {
        return (
          <React.Fragment key={color}>
            <CWText type="h5" style={{ textTransform: 'capitalize' }}>
              {color}
            </CWText>
            <div className="flex-row">
              {colorVariants.map((variant) => (
                <ColorCard
                  key={color + variant}
                  color={color}
                  variant={variant}
                />
              ))}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

export default ColorsShowcase;
