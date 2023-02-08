import React from 'react';

import $ from 'jquery';
import type { ChainInfo, Comment } from 'models';
import { AddressInfo, Thread } from 'models';

import app from 'state';
import { User } from 'views/components/user/user';
import { CWText } from '../component_kit/cw_text';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';

const MAX_VISIBLE_REACTING_ACCOUNTS = 10;

type ReactorAttrs = {
  likes: number;
  reactors: any;
};

type Post = Thread | Comment<any>;

export const getDisplayedReactorsForPopup = (reactorAttrs: ReactorAttrs) => {
  const { reactors = [], likes = 0 } = reactorAttrs;

  const slicedReactors = reactors
    .slice(0, MAX_VISIBLE_REACTING_ACCOUNTS)
    .map((rxn) => {
      const {
        Address: { address, chain },
      } = rxn;

      return (
        <div style={{ display: 'flex', width: '120px' }}>
          <CWText noWrap>
            <User
              user={new AddressInfo(null, address, chain?.id || chain, null)}
              linkify
            />
          </CWText>
        </div>
      );
    });

  if (slicedReactors.length < likes) {
    const diff = likes - slicedReactors.length;

    slicedReactors.push(<CWText>{`and ${diff} more`}</CWText>);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {slicedReactors}
    </div>
  );
};

export const fetchReactionsByPost = async (post: Post) => {
  let thread_id, proposal_id, comment_id;

  if (post instanceof Thread) {
    thread_id = (post as Thread).id;
  } else {
    comment_id = (post as Comment<any>).id;
  }

  const { result = [] } = await $.get(`${app.serverUrl()}/bulkReactions`, {
    thread_id,
    comment_id,
    proposal_id,
  });

  return result;
};

export const onReactionClick = (
  e: React.MouseEvent<HTMLDivElement>,
  hasReacted: boolean,
  dislike: (userAddress: string) => void,
  like: (chain: ChainInfo, chainId: string, userAddress: string) => void
) => {
  e.preventDefault();
  e.stopPropagation();

  const { address: userAddress, chain } = app.user.activeAccount;

  // if it's a community use the app.user.activeAccount.chain.id instead of author chain
  const chainId = app.activeChainId();

  if (hasReacted) {
    dislike(userAddress);
  } else {
    like(chain, chainId, userAddress);
  }
};
