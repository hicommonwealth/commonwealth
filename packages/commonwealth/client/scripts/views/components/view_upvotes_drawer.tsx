import type Thread from 'client/scripts/models/Thread';
import React, { useState } from 'react';
import CWDrawer from './component_kit/new_designs/CWDrawer';
// import { CWTable } from './component_kit/new_designs/CWTable';
import Comment from 'client/scripts/models/Comment';
import { CWThreadAction } from './component_kit/new_designs/cw_thread_action';

type ViewUpvotesDrawerProps = {
  contentType: 'thread' | 'comment';
  content: Thread | Comment<any>;
};

export const ViewUpvotesDrawer = ({ contentType }: ViewUpvotesDrawerProps) => {
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState(false);

  const getColumnInfo = () => {
    return [
      {
        key: 'name',
        header: 'Name',
        numeric: false,
        sortable: true,
      },
      {
        key: 'vote-weight',
        header: 'Vote Weight',
        numeric: true,
        sortable: true,
      },
      {
        key: 'timestamp',
        header: 'Timestamp',
        numberic: true,
        sortable: true,
      },
    ];
  };

  const getRowData = () => {};

  return (
    <>
      <CWThreadAction
        label="View upvotes"
        onClick={() => setIsUpvoteDrawerOpen(true)}
      />
      <CWDrawer
        open={isUpvoteDrawerOpen}
        header={`${
          contentType.charAt(0).toLocaleUpperCase() + contentType.slice(1)
        } upvotes`}
        onClose={() => setIsUpvoteDrawerOpen(false)}
      >
        {/* <CWTable /> */}
      </CWDrawer>
    </>
  );
};
