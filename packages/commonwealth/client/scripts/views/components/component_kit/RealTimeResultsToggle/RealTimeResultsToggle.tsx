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
  label?: string;
};

const RealTimeResultsToggle = ({
  localStorageKey,
  onChange,
  label = '⚡️ Realtime Results',
}: RealTimeResultsToggleProps) => {
  const { isRealTime, setIsRealTime } = useRealTimeResultsToggle({
    localStorageKey,
  });

  return (
    <div className="RealTimeResultsToggle">
      {isRealTime ? (
        <RainbowText>
          <CWText type="caption" fontWeight="bold">
            {label}
          </CWText>
        </RainbowText>
      ) : (
        <CWText type="caption">{label}</CWText>
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
