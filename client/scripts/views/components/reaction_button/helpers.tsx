/* @jsx m */

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import $ from 'jquery';

import app from 'state';
import {
  OffchainComment,
  OffchainThread,
  AddressInfo,
  ChainInfo,
} from 'models';
import User from 'views/components/widgets/user';
import { LoginModal } from '../../modals/login_modal';
import SelectAddressModal from '../../modals/select_address_modal';

const MAX_VISIBLE_REACTING_ACCOUNTS = 10;

type ReactorAttrs = {
  likes: number;
  reactors: any;
};

type Post = OffchainThread | OffchainComment<any>;

export const getDisplayedReactorsForPopup = (reactorAttrs: ReactorAttrs) => {
  const { reactors = [], likes = 0 } = reactorAttrs;

  const slicedReactors = reactors
    .slice(0, MAX_VISIBLE_REACTING_ACCOUNTS)
    .map((rxn) => {
      const {
        Address: { address, chain },
      } = rxn;

      return m(User, {
        user: new AddressInfo(null, address, chain, null),
        linkify: true,
      });
    });

  if (slicedReactors.length < likes) {
    const diff = likes - slicedReactors.length;

    slicedReactors.push(<>{`and ${diff} more`}</>);
  }

  return slicedReactors;
};

export const fetchReactionsByPost = async (post: Post) => {
  let thread_id, proposal_id, comment_id;

  if (post instanceof OffchainThread) {
    thread_id = (post as OffchainThread).id;
  } else {
    comment_id = (post as OffchainComment<any>).id;
  }

  const { result = [] } = await $.get(`${app.serverUrl()}/bulkReactions`, {
    thread_id,
    comment_id,
    proposal_id,
  });

  return result;
};

export const onReactionClick = (
  e: MouseEvent,
  hasReacted: boolean,
  dislike: (userAddress: string) => void,
  like: (chain: ChainInfo, chainId: string, userAddress: string) => void,
  post: Post
) => {
  e.preventDefault();
  e.stopPropagation();

  if (!app.isLoggedIn()) {
    app.modals.create({
      modal: LoginModal,
    });
  } else if (!app.user.activeAccount) {
    app.modals.create({
      modal: SelectAddressModal,
    });
  } else {
    const { address: userAddress, chain } = app.user.activeAccount;

    // if it's a community use the app.user.activeAccount.chain.id instead of author chain
    const chainId = app.activeChainId();

    if (hasReacted) {
      dislike(userAddress);
    } else {
      like(chain, chainId, userAddress);
    }

    mixpanel.track('Create Reaction ', {
      'Step No': 1,
      Step: 'Create Reaction',
      'Post Name': `${post.slug}: ${post.identifier}`,
      Scope: app.activeChainId(),
    });
    mixpanel.people.increment('Reaction');
    mixpanel.people.set({
      'Last Reaction Created': new Date().toISOString(),
    });
  }
};
