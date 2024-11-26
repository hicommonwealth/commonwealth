import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import './MobileInput.scss';

type MobileInputProps = {
  onFocus?: () => void;
};

export const MobileInput = (props: MobileInputProps) => {
  const { onFocus } = props;

  return (
    <div className="MobileInput">
      <div className="InputBox">
        <input
          className=""
          type="text"
          onFocus={onFocus}
          placeholder="Comment on thread here..."
        />

        <div className="RightButton">
          <CWIconButton iconName="arrowsOutSimple" />
        </div>
      </div>
    </div>
  );
};
