import 'components/NewThreadForm.scss';
import { notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { parseCustomStages } from 'helpers';
import { detectURL } from 'helpers/threads';
import { capitalize } from 'lodash';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import { useFetchTopicsQuery } from 'state/api/topics';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { CWTab, CWTabBar } from 'views/components/component_kit/cw_tabs';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { TopicSelector } from 'views/components/topic_selector';
import { ThreadKind, ThreadStage } from '../../../models/types';
import Permissions from '../../../utils/Permissions';
import { ReactQuillEditor } from '../react_quill_editor';
import {
  createDeltaFromText,
  getTextFromDelta,
  serializeDelta,
} from '../react_quill_editor/utils';
import { checkNewThreadErrors, useNewThreadForm } from './helpers';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import moment from 'moment';
import useJoinCommunity from 'views/components/Header/useJoinCommunity';
import { Modal } from 'views/components/component_kit/cw_modal';
import { AccountSelector } from 'views/components/component_kit/cw_wallets_list';
import { TOSModal } from 'views/components/Header/TOSModal';
import { LoginModal } from 'views/modals/login_modal';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import useUserActiveAccount from 'hooks/useUserActiveAccount';

const JOIN_COMMUNITY_BANNER_KEY = (communityId) =>
  `${communityId}-joinCommunityBannerClosedAt`;

export const NewThreadForm = () => {
  const navigate = useCommonNavigate();
  const { data: topics } = useFetchTopicsQuery({
    chainId: app.activeChainId(),
  });
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAccountSelectorModalOpen, setIsAccountSelectorModalOpen] =
    useState(false);
  const [isTOSModalOpen, setIsTOSModalOpen] = useState(false);

  const chainId = app.chain.id;
  const hasTopics = topics?.length;
  const isAdmin = Permissions.isCommunityAdmin();
  const activeChainInfo = app.chain?.meta;

  const topicsForSelector =
    topics ||
    [].filter((t) => {
      return (
        isAdmin ||
        t.tokenThreshold.isZero() ||
        !TopicGateCheck.isGatedTopic(t.name)
      );
    });

  const {
    threadTitle,
    setThreadTitle,
    threadKind,
    setThreadKind,
    threadTopic,
    setThreadTopic,
    threadUrl,
    setThreadUrl,
    threadContentDelta,
    setThreadContentDelta,
    setIsSaving,
    isDisabled,
    clearDraft,
  } = useNewThreadForm(chainId, topicsForSelector);

  const {
    handleJoinCommunity,
    sameBaseAddressesRemoveDuplicates,
    performJoinCommunityLinking,
    linkToCommunity,
  } = useJoinCommunity({
    setIsAccountSelectorModalOpen,
    setIsLoginModalOpen,
    setIsTOSModalOpen,
  });

  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const isDiscussion = threadKind === ThreadKind.Discussion;

  const isPopulated = useMemo(() => {
    return threadTitle || getTextFromDelta(threadContentDelta).length > 0;
  }, [threadContentDelta, threadTitle]);

  const handleNewThreadCreation = async () => {
    if (!isDiscussion && !detectURL(threadUrl)) {
      notifyError('Must provide a valid URL.');
      return;
    }

    const deltaString = JSON.stringify(threadContentDelta);

    checkNewThreadErrors(
      { threadKind, threadUrl, threadTitle, threadTopic },
      deltaString,
      !!hasTopics
    );

    setIsSaving(true);

    await app.sessions.signThread({
      community: app.activeChainId(),
      title: threadTitle,
      body: deltaString,
      link: threadUrl,
      topic: threadTopic,
    });

    try {
      const result = await app.threads.create(
        app.user.activeAccount.address,
        threadKind,
        app.chain.meta.customStages
          ? parseCustomStages(app.chain.meta.customStages)[0]
          : ThreadStage.Discussion,
        app.activeChainId(),
        threadTitle,
        threadTopic,
        serializeDelta(threadContentDelta),
        threadUrl
      );

      setThreadContentDelta(createDeltaFromText(''));
      clearDraft();

      navigate(`/discussion/${result.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setThreadTitle('');
    setThreadTopic(
      topicsForSelector.find((t) => t.name.includes('General')) || null
    );
    setThreadContentDelta(createDeltaFromText(''));
  };

  useEffect(() => {
    const bannerClosedAt = Number(
      localStorage.getItem(JOIN_COMMUNITY_BANNER_KEY(app.activeChainId()))
    );

    if (!bannerClosedAt) {
      setIsBannerVisible(true);
      return;
    }

    const timeDifference = moment().diff(moment(bannerClosedAt), 'week');
    const bannerClosedMoreThanWeekAgo = timeDifference >= 1;
    setIsBannerVisible(bannerClosedMoreThanWeekAgo);
  }, []);

  const handleCloseBanner = () => {
    localStorage.setItem(
      JOIN_COMMUNITY_BANNER_KEY(app.activeChainId()),
      String(Date.now())
    );
    setIsBannerVisible(false);
  };

  const showBanner = !hasJoinedCommunity && isBannerVisible;

  return (
    <>
      <div className="NewThreadForm">
        <div className="new-thread-header">
          <CWTabBar>
            <CWTab
              label={capitalize(ThreadKind.Discussion)}
              isSelected={threadKind === ThreadKind.Discussion}
              onClick={() => setThreadKind(ThreadKind.Discussion)}
            />
            <CWTab
              label={capitalize(ThreadKind.Link)}
              isSelected={threadKind === ThreadKind.Link}
              onClick={() => setThreadKind(ThreadKind.Link)}
            />
          </CWTabBar>
        </div>
        <div className="new-thread-body">
          <div className="new-thread-form-inputs">
            <div className="topics-and-title-row">
              {hasTopics && (
                <TopicSelector
                  topics={topicsForSelector}
                  value={threadTopic}
                  onChange={setThreadTopic}
                />
              )}
              <CWTextInput
                autoFocus
                placeholder="Title"
                value={threadTitle}
                tabIndex={1}
                onInput={(e) => setThreadTitle(e.target.value)}
              />
            </div>

            {!isDiscussion && (
              <CWTextInput
                placeholder="https://"
                value={threadUrl}
                tabIndex={2}
                onInput={(e) => setThreadUrl(e.target.value)}
              />
            )}

            <ReactQuillEditor
              contentDelta={threadContentDelta}
              setContentDelta={setThreadContentDelta}
              isDisabled={!hasJoinedCommunity}
            />

            <div className="buttons-row">
              {isPopulated && (
                <CWButton
                  buttonType="tertiary"
                  onClick={handleCancel}
                  tabIndex={3}
                  label="Cancel"
                />
              )}
              <CWButton
                label={
                  app.user.activeAccount ? 'Post' : 'Join community to create'
                }
                disabled={isDisabled || !hasJoinedCommunity}
                onClick={handleNewThreadCreation}
                tabIndex={4}
                buttonWidth="wide"
              />
            </div>

            {showBanner && (
              <CWBanner
                className="join-community-banner"
                title="Want to contribute to this discussion?"
                body="Join now to engage in discussions, leave comments, reply to others,
                    upvote content, and enjoy a host of additional features."
                onClose={handleCloseBanner}
                buttons={[
                  {
                    label: 'Join community',
                    buttonType: 'primary',
                    onClick: handleJoinCommunity,
                  },
                ]}
              />
            )}
          </div>
        </div>
      </div>
      <Modal
        content={
          <AccountSelector
            accounts={sameBaseAddressesRemoveDuplicates.map((addressInfo) => ({
              address: addressInfo.address,
            }))}
            walletNetwork={activeChainInfo?.network}
            walletChain={activeChainInfo?.base}
            onSelect={async (accountIndex) => {
              await linkToCommunity(accountIndex);
              setIsAccountSelectorModalOpen(false);
            }}
            onModalClose={() => setIsAccountSelectorModalOpen(false)}
          />
        }
        onClose={() => setIsAccountSelectorModalOpen(false)}
        open={isAccountSelectorModalOpen}
      />
      <Modal
        content={
          <TOSModal
            onAccept={async () => {
              await performJoinCommunityLinking();
              setIsTOSModalOpen(false);
            }}
            onModalClose={() => setIsTOSModalOpen(false)}
          />
        }
        onClose={() => setIsTOSModalOpen(false)}
        open={isTOSModalOpen}
      />
      <Modal
        content={<LoginModal onModalClose={() => setIsLoginModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </>
  );
};
