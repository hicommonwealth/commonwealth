import { splitAndDecodeURL } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import React, { useEffect, useState } from 'react';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import UnSubscribeModal from '../../modals/UnSubscribeModal/UnSubscribeModal';

const UnSubscribePage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useCommonNavigate();
  const handleModalClose = () => {
    setModalOpen(false);
    navigate('/dashboard');
  };
  const handleUnsubscribe = () => {
    // will do the unsubscribe api call
    navigate('/dashboard');
    setModalOpen(false);
  };

  const userId = splitAndDecodeURL(window.location.pathname);

  useEffect(() => {
    if (userId) {
      setModalOpen(true);
    }
  }, [userId]);

  return (
    <CWPageLayout>
      <CWModal
        size="medium"
        visibleOverflow
        content={
          <UnSubscribeModal
            label="Unsubscribe"
            description="Are you sure you want to unsubscribe from CommonWealth?"
            onModalClose={handleModalClose}
            onUnsubscribe={handleUnsubscribe}
          />
        }
        onClose={handleModalClose}
        open={isModalOpen}
      />
    </CWPageLayout>
  );
};

export default UnSubscribePage;
