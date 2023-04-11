import React, { useState, useEffect } from 'react';

import 'components/component_kit/cw_spinner.scss';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconSize } from './cw_icons/types';

import { ComponentType } from './types';

type SpinnerProps = {
  size?: IconSize;
  shouldDebounce?: boolean;
  debounceMilliseconds?: number;
};

export const CWSpinner = (props: SpinnerProps) => {
  const {
    size = 'xl',
    shouldDebounce = false,
    debounceMilliseconds = 300, // default 300ms
  } = props;

  const [showSpinner, setShowSpinner] = useState<boolean>(!shouldDebounce);

  useEffect(() => {
    let timer;
    if (shouldDebounce) {
      timer = setTimeout(() => setShowSpinner(true), debounceMilliseconds);
    }

    return () => shouldDebounce && clearTimeout(timer);
  });

  return showSpinner ? (
    <div className={ComponentType.Spinner}>
      <CWIcon iconName="cow" iconSize={size} />
    </div>
  ) : (
    <></>
  );
};
