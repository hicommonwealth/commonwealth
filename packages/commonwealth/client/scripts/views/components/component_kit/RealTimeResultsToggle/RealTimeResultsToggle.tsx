import React from 'react';
import { CWToggle } from 'views/components/component_kit/new_designs/cw_toggle';
import { CWText } from '../cw_text';
import { RainbowText } from './RainbowText';
import './RealTimeResultsToggle.scss';
import { RealTimeToggleLocalStorageKeys } from './types';
import useRealTimeResultsToggle from './useRealTimeResultsToggle';

type RealTimeResultsToggleProps = {
  localStorageKey: RealTimeToggleLocalStorageKeys;
  onChange?: ({ isRealTime }: { isRealTime: boolean }) => void;
};

const RealTimeResultsToggle = ({
  localStorageKey,
  onChange,
}: RealTimeResultsToggleProps) => {
  const { isRealTime, setIsRealTime } = useRealTimeResultsToggle({
    localStorageKey,
  });

  return (
    <div className="RealTimeResultsToggle">
      {isRealTime ? (
        <RainbowText>
          <CWText type="caption" fontWeight="bold">
            ⚡️ Realtime Results
          </CWText>
        </RainbowText>
      ) : (
        <CWText type="caption">⚡️ Realtime Results</CWText>
      )}
      <CWToggle
        iconColor="#757575"
        checked={isRealTime}
        onChange={() => {
          const newValue = !isRealTime;
          setIsRealTime(newValue);
          onChange?.({ isRealTime: newValue });
        }}
      />
    </div>
  );
};

export default RealTimeResultsToggle;
