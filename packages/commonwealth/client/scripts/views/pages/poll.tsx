import React, { useEffect } from 'react';
import app from 'state';
import { useSetRecoilState, useRecoilValue } from 'recoil';

import Sublayout from 'views/sublayout';
import { PageLoading } from './loading';
import { ThreadPollCard } from './view_thread/poll_cards';
import { pollSelector } from 'controllers/server/polls';

const PollPage = ({ scope, thread_id }) => {
  const poll = useRecoilValue(pollSelector(thread_id));

  return (
    <Sublayout>
      <ThreadPollCard poll={poll} />
    </Sublayout>
  );
};

export default PollPage;
