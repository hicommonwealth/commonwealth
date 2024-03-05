import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';

const ThreadActionsShowcase = () => {
  return (
    <>
      <CWText type="h5">Active</CWText>
      <div className="flex-row">
        <CWThreadAction
          action="comment"
          onClick={() => console.log('Comment action clicked!')}
        />
        <CWThreadAction
          action="share"
          onClick={() => console.log('Share action clicked!')}
        />
        <CWThreadAction
          action="subscribe"
          onClick={() => console.log('Subscribe action clicked!')}
        />
        <CWThreadAction
          action="upvote"
          onClick={() => console.log('Upvote action clicked!')}
        />
        <CWThreadAction
          action="overflow"
          onClick={() => console.log('Overflow action clicked!')}
        />
      </div>

      <CWText type="h5">Disabled</CWText>
      <div className="flex-row">
        <CWThreadAction
          action="comment"
          onClick={() => console.log('Comment action clicked!')}
          disabled
        />
        <CWThreadAction
          action="share"
          onClick={() => console.log('Share action clicked!')}
          disabled
        />
        <CWThreadAction
          action="subscribe"
          onClick={() => console.log('Subscribe action clicked!')}
          disabled
        />
        <CWThreadAction
          action="upvote"
          onClick={() => console.log('Upvote action clicked!')}
          disabled
        />
        <CWThreadAction
          action="overflow"
          onClick={() => console.log('Overflow action clicked!')}
          disabled
        />
      </div>
    </>
  );
};

export default ThreadActionsShowcase;
