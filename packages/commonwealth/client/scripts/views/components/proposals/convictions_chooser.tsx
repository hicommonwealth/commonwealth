import {
  convictions,
  convictionToLocktime,
  convictionToWeight,
} from 'controllers/chain/substrate/democracy_referendum';
import React from 'react';
import { CWDropdown } from '../component_kit/cw_dropdown';

type ConvictionsChooserProps = { callback: (number) => void };

export const ConvictionsChooser = (props: ConvictionsChooserProps) => {
  const { callback } = props;

  React.useEffect(() => {
    callback(convictions()[0].toString());
  }, []);

  const options = convictions().map((c) => ({
    value: c.toString(),
    label: `${convictionToWeight(c)}x weight (locked for ${convictionToLocktime(
      c
    )}x enactment period)`,
  }));

  return (
    <CWDropdown
      label="Convictions"
      options={options}
      onSelect={(o) => {
        callback(parseInt((o as any).value, 10));
      }}
    />
  );
};
