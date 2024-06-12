import React from 'react';
import { trpc } from 'utils/trpcClient';

export const Test = () => {
  // FIXME the problem is that useQuery uses AnyProcedure which drops types on the frontend
  trpc.subscription.getCommentSubscriptions.useQuery({});

  return <div>this is a test</div>;
};
