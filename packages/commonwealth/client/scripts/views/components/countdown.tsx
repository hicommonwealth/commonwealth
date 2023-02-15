import React from 'react';
import moment from 'moment';
import { useCountdown } from 'usehooks-ts';

import { blocknumToTime, formatDuration } from 'helpers';

type CountdownProps = {
  duration: moment.Moment;
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
    <span>{formatDuration(moment.duration(moment(count).diff(moment())))}</span>
  );
};

type CountdownUntilBlockProps = {
  block: number;
};

export const CountdownUntilBlock = (props: CountdownUntilBlockProps) => {
  const { block } = props;

  return <Countdown duration={blocknumToTime(block)} />;
};
