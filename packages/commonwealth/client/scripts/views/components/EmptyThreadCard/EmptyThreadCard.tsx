import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { AuthModal } from 'views/modals/AuthModal';
import './EmptyThreadCard.scss';

export const EmptyThreadCard = () => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleStartThread = () => {
    if (user.isLoggedIn) {
      navigate(`/new/discussion`);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthModalOpen(false);
    navigate(`/new/discussion`);
  };

  return (
    <>
      <CWCard className="EmptyThreadCard">
        <div className="content-wrapper">
          <CWIcon iconName="chats" iconSize="large" className="icon" />
          <CWText type="h2" fontWeight="bold" className="title">
            No threads yet!
          </CWText>
          <CWText type="b1" className="subtitle">
            Be the first to start a thread in this community!
          </CWText>
          <CWButton
            label="Start a new thread"
            iconLeft="plus"
            onClick={handleStartThread}
            buttonType="primary"
            buttonHeight="sm"
            className="start-thread-button"
          />
        </div>
      </CWCard>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};
