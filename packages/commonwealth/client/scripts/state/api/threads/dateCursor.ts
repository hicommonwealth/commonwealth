import moment from 'moment';
import { useEffect, useState } from 'react';
import { ThreadTimelineFilterTypes } from '../../../models/types';
import { getToAndFromDatesRangesForThreadsTimelines } from './helpers/dates';

const THREADS_STALE_TIME = 180000; // 3 minutes

const useDateCursor = ({
  dateRange,
}: {
  dateRange?: ThreadTimelineFilterTypes;
}) => {
  const [dateCursor, setDateCursor] = useState<{
    toDate: string;
    fromDate: string | null;
  }>({ toDate: moment().toISOString(), fromDate: null });

  useEffect(() => {
    const updater = () => {
      const { toDate, fromDate } =
        // @ts-expect-error StrictNullChecks
        getToAndFromDatesRangesForThreadsTimelines(dateRange);
      // @ts-expect-error StrictNullChecks
      setDateCursor({ toDate, fromDate });
    };

    // set date cursor and schedule it to run after some intervals
    updater();
    const interval = setInterval(() => updater(), THREADS_STALE_TIME - 10);

    return () => {
      clearInterval(interval);
    };
  }, [dateRange]);

  return { dateCursor };
};

export { useDateCursor };
