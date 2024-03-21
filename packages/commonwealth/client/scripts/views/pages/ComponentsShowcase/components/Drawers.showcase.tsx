import React, { useState } from 'react';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';

const DrawersShowcase = () => {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [bottomOpen, setBottomOpen] = useState(false);

  const content = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
    porttitor vel erat nec eleifend. Nullam sit amet dui et eros luctus
    facilisis et id eros. In a lacus in nisl facilisis euismod. In non
    congue sapien. Donec quis lorem libero. Nunc malesuada nunc ac eros
    sodales sodales. Nullam tempus justo ut consectetur lacinia.
        Vestibulum non dui vel ante molestie gravida. Maecenas sed consequat
    tellus, ac fermentum ex.`;

  return (
    <>
      <div className="flex-row">
        <div>
          <CWButton
            buttonHeight="sm"
            label="Left"
            onClick={() => {
              setLeftOpen(true);
            }}
          />
          <CWDrawer
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            direction="left"
          >
            <div>{content}</div>
          </CWDrawer>
        </div>

        <div>
          <CWButton
            buttonHeight="sm"
            label="Bottom"
            onClick={() => {
              setBottomOpen(true);
            }}
          />
          <CWDrawer
            open={rightOpen}
            onClose={() => setRightOpen(false)}
            direction="right"
          >
            <div>{content}</div>
          </CWDrawer>
        </div>

        <div>
          <CWButton
            buttonHeight="sm"
            label="Rigth"
            onClick={() => {
              setRightOpen(true);
            }}
          />

          <CWDrawer
            open={bottomOpen}
            onClose={() => setBottomOpen(false)}
            direction="bottom"
          >
            <div>{content}</div>
          </CWDrawer>
        </div>
      </div>
    </>
  );
};

export default DrawersShowcase;
