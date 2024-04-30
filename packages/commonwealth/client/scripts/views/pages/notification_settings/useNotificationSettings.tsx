import { getMultipleSpacesById } from 'helpers/snapshot_utils';
import useForceRerender from 'hooks/useForceRerender';
import 'pages/notification_settings/index.scss';
import { useEffect, useState } from 'react';
import app from 'state';
import NotificationSubscription from '../../../models/NotificationSubscription';
import { bundleSubs, extractSnapshotProposals } from './helpers';

const useNotificationSettings = () => {
  const forceRerender = useForceRerender();
  const [email, setEmail] = useState('');
  const [emailValidated, setEmailValidated] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const [snapshotsInfo, setSnapshotsInfo] = useState(null);

  const [currentFrequency, setCurrentFrequency] = useState(
    app.user.emailInterval,
  );

  useEffect(() => {
    app.user.notifications.isLoaded.once('redraw', forceRerender);
  }, [forceRerender]);

  useEffect(() => {
    // bundled snapshot subscriptions
    const bundledSnapshotSubs = extractSnapshotProposals(
      app.user.notifications.discussionSubscriptions,
    );
    const snapshotIds = Object.keys(bundledSnapshotSubs);

    const getSpaces = async () => {
      try {
        const getSpaceById = await getMultipleSpacesById(snapshotIds);

        const snapshotsInfoArr = snapshotIds.map((snapshotId) => ({
          snapshotId,
          space: getSpaceById.find((x: { id: string }) => x.id === snapshotId),
          subs: bundledSnapshotSubs[snapshotId],
        }));

        setSnapshotsInfo(snapshotsInfoArr);
      } catch (err) {
        console.error(err);
        return null;
      }
    };

    getSpaces();
  }, []);

  const handleSubscriptions = async (
    hasSomeInAppSubs: boolean,
    subs: NotificationSubscription[],
  ) => {
    if (hasSomeInAppSubs) {
      await app.user.notifications.disableSubscriptions(subs);
    } else {
      await app.user.notifications.enableSubscriptions(subs);
    }
    forceRerender();
  };

  const handleEmailSubscriptions = async (
    hasSomeEmailSubs: boolean,
    subs: NotificationSubscription[],
  ) => {
    if (hasSomeEmailSubs) {
      await app.user.notifications.disableImmediateEmails(subs);
    } else {
      await app.user.notifications.enableImmediateEmails(subs);
    }
    forceRerender();
  };

  const handleUnsubscribe = async (subscription: NotificationSubscription) => {
    await app.user.notifications.deleteSubscription(subscription);
    forceRerender();
  };

  // bundled discussion subscriptions
  const bundledSubs = bundleSubs(
    app?.user.notifications.discussionSubscriptions,
  );

  // bundled chain-event subscriptions
  const chainEventSubs = bundleSubs(
    app?.user.notifications.chainEventSubscriptions,
  );

  const subscribedCommunityIds =
    app?.user.notifications.chainEventSubscribedChainIds;

  // communities the user has addresses for but does not have existing subscriptions for
  const relevantSubscribedCommunities = app?.user?.addresses
    ?.map?.((x) => x?.community)
    ?.filter?.(
      (x) =>
        subscribedCommunityIds?.includes?.(x?.id) && !chainEventSubs?.[x?.id],
    );

  return {
    handleSubscriptions,
    handleEmailSubscriptions,
    handleUnsubscribe,
    snapshotsInfo,
    currentFrequency,
    setCurrentFrequency,
    email,
    setEmail,
    emailValidated,
    setEmailValidated,
    sentEmail,
    setSentEmail,
    bundledSubs,
    chainEventSubs,
    relevantSubscribedCommunities,
  };
};

export default useNotificationSettings;
