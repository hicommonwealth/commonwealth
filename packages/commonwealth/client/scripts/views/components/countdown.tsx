import moment from 'moment';
import React from 'react';
import { useCountdown } from 'usehooks-ts';

import { formatDuration } from 'helpers';

type CountdownProps = {
  duration: number;
};

export const Countdown = (props: CountdownProps) => {
  const { duration } = props;

  const [, { startCountdown }] = useCountdown({
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
        false,
      )}
    </span>
  );
};
