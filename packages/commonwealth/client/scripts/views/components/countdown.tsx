import React from 'react';
import moment from 'moment';
import { useCountdown } from 'usehooks-ts';

import { blocknumToDuration, formatDuration } from 'helpers';

type CountdownProps = {
  duration: number;
};

export const Countdown = (props: CountdownProps) => {
  const { duration } = props;

  const [count, { startCountdown }] = useCountdown({
    countStart: duration,
    intervalMs: 1000,
  });

  React.useEffect(() => {
    startCountdown();
  }, [startCountdown]);

  return (
    <span>
      {formatDuration(
        moment.duration(moment().add(duration, 'ms').diff(moment())),
        false
      )}
    </span>
  );
};

type CountdownUntilBlockProps = {
  block: number;
};
