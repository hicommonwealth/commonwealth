import React from 'react';
import { useAtom } from 'jotai';

import Sublayout from 'views/sublayout';
import { ThreadPollCard } from './view_thread/poll_cards';
import { pollAtom } from 'controllers/server/polls';

const PollPage = () => {
  const [polls] = useAtom(pollAtom);

  return (
    <Sublayout>
      <>
        {polls.map((poll) => <ThreadPollCard poll={poll} key={poll.id} />)}
      </>
    </Sublayout>
  );
};

export default PollPage;
