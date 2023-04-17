import { useEffect, useState } from 'react';
import TopicGateCheck from '../../../controllers/chain/ethereum/gatedTopic';
import type ChainInfo from '../../../models/ChainInfo';
import type Thread from '../../../models/Thread';
import app from '../../../state';

export const useReactionButton = (thread: Thread, setReactors) => {
  const activeAddress = app.user.activeAccount?.address;

  const [isLoading, setIsLoading] = useState(false);

  const thisUserReaction = thread.associatedReactions.filter(
    (r) => r.address === activeAddress
  );
  const [hasReacted, setHasReacted] = useState(thisUserReaction.length !== 0);
  const [reactedId, setReactedId] = useState(
    thisUserReaction.length === 0 ? -1 : thisUserReaction[0].id
  );

  useEffect(() => {
    const fetch = () => {
      if (
        activeAddress &&
        thread.associatedReactions.filter((r) => r.address === activeAddress)
          .length > 0
      ) {
        setHasReacted(true);
      } else {
        setHasReacted(false);
      }

      setReactors(thread.associatedReactions.map((t) => t.address));
    };

    fetch();
  }, [activeAddress, setReactors]); // eslint-disable-line react-hooks/exhaustive-deps

  // token balance check if needed
  const isAdmin =
    app.user.isSiteAdmin ||
    app.roles.isAdminOfEntity({ chain: app.activeChainId() });

  let topicName = '';

  if (thread.topic && app.topics) {
    topicName = thread.topic.name;
  }

  const isUserForbidden = !isAdmin && TopicGateCheck.isGatedTopic(topicName);

  const dislike = async () => {
    if (reactedId === -1) {
      return;
    }

    setIsLoading(true);

    app.threadReactions
      .deleteOnThread(thread, reactedId)
      .then(() => {
        setReactors((oldReactors) =>
          oldReactors.filter((r) => r !== activeAddress)
        );
        setReactedId(-1);
        setHasReacted(false);
        setIsLoading(false);
      })
      .catch((e) => {
        console.log(e);
        setIsLoading(false);
      });
  };

  const like = async (
    chain: ChainInfo,
    chainId: string,
    userAddress: string
  ) => {
    setIsLoading(true);
    app.threadReactions
      .createOnThread(userAddress, thread, 'like')
      .then((reaction) => {
        setReactedId(reaction.id);
        setReactors((oldReactors) => [...oldReactors, activeAddress]);
        setHasReacted(true);
        setIsLoading(false);
      })
      .catch((e) => {
        console.log(e);
        setIsLoading(false);
      });
  };

  return {
    dislike,
    hasReacted,
    isLoading,
    isUserForbidden,
    like,
    setIsLoading,
  };
};
