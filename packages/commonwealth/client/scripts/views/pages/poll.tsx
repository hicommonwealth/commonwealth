import React, { useEffect } from 'react';
import app from 'state';

import Sublayout from 'views/sublayout';
import { PageLoading } from './loading';
import { ThreadPollCard } from './view_thread/poll_cards';

const PollPage = ({ thread_id }) => {
  const [poll, setPoll] = React.useState(null);

  useEffect(() => {
    const fetch = async () => {
      await app.polls.fetchPolls(app.activeChainId(), thread_id);
      const polls = app.polls.getByThreadId(thread_id);
      if (polls.length > 0) {
        setPoll(polls[0]);
      }
    }
    fetch();
  }, []);

  return !poll ? <PageLoading /> : (
    <Sublayout>
      <ThreadPollCard poll={poll} />
    </Sublayout>
  );
};

export default PollPage;
