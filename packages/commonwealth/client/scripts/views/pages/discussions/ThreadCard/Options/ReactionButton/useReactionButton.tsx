import { useEffect, useState } from 'react';
import TopicGateCheck from '../../../../../../controllers/chain/ethereum/gatedTopic';
import type ChainInfo from '../../../../../../models/ChainInfo';
import Thread from '../../../../../../models/Thread';
import app from '../../../../../../state';
import Permissions from '../../../../../../utils/Permissions';

export const useReactionButton = (thread: Thread, setReactors) => {
  const activeAddress = app.user.activeAccount?.address;

  const [isLoading, setIsLoading] = useState(false);

  const thisUserReaction = thread?.associatedReactions?.filter(
    (r) => r.address === activeAddress
  );
  const [hasReacted, setHasReacted] = useState(thisUserReaction?.length !== 0);
  const [reactedId, setReactedId] = useState(
    thisUserReaction?.length === 0 ? -1 : thisUserReaction?.[0]?.id
  );

  useEffect(() => {
    const fetch = () => {
      if (
        activeAddress &&
        thread?.associatedReactions?.filter((r) => r.address === activeAddress)
          .length > 0
      ) {
        setHasReacted(true);
      } else {
        setHasReacted(false);
      }

      setReactors(thread?.associatedReactions?.map((t) => t.address));
    };

    fetch();
  }, [activeAddress, setReactors]); // eslint-disable-line react-hooks/exhaustive-deps

  // token balance check if needed
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const isUserForbidden =
    !isAdmin && TopicGateCheck.isGatedTopic(thread?.topic?.name);

  const dislike = async () => {
    if (reactedId === -1 || !hasReacted || isLoading) {
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

        // update in store
        const foundThread = app.threads.getById(thread?.id);
        if (foundThread) {
          foundThread.associatedReactions = [
            ...foundThread.associatedReactions,
          ].filter((x) => x.address !== activeAddress);
          app.threads.updateThreadInStore(foundThread);
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const like = async (
    chain: ChainInfo,
    chainId: string,
    userAddress: string
  ) => {
    const foundThread = app.threads.getById(thread?.id);
    if (
      (foundThread &&
        foundThread.associatedReactions.find(
          (x) => x.address === activeAddress
        )) ||
      reactedId !== -1 ||
      hasReacted ||
      isLoading
    ) {
      return;
    }

    setIsLoading(true);
    app.threadReactions
      .createOnThread(userAddress, thread, 'like')
      .then((reaction) => {
        setReactedId(reaction.id);
        setReactors((oldReactors) => [
          ...oldReactors.filter((o) => o !== activeAddress),
          activeAddress,
        ]);
        setHasReacted(true);

        // update in store
        const tempReaction = {
          id: (reaction.id + '') as any,
          type: reaction.reaction,
          address: activeAddress,
        };
        if (foundThread) {
          foundThread.associatedReactions = [
            ...foundThread.associatedReactions.filter(
              (x) => x.address !== activeAddress
            ),
            tempReaction,
          ];
          app.threads.updateThreadInStore(foundThread);
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
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
