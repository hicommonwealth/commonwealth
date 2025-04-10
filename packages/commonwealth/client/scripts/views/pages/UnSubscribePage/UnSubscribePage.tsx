import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { useUnSubscribeEmailMutation } from 'state/api/trpc/subscription/useUnSubscribeEmailMutation';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import UnSubscribeModal from '../../modals/UnSubscribeModal/UnSubscribeModal';

const UnSubscribePage = () => {
  const { mutateAsync: unSubscribeEmail } = useUnSubscribeEmailMutation();
  const [isModalOpen, setModalOpen] = useState(false);

  const navigate = useCommonNavigate();
  const handleModalClose = () => {
    setModalOpen(false);
    navigate('/dashboard');
  };
  const userId = window.location.pathname.split('/').at(-1);

  const handleUnsubscribe = async () => {
    if (userId) {
      await unSubscribeEmail({
        user_uuid: userId,
        email_notifications_enabled: false,
      }).catch(console.error);
      navigate('/dashboard');
      setModalOpen(false);
    }
  };
  const onUnsubscribe = () => {
    handleUnsubscribe().catch((error) => {
      console.error('Error during unsubscription:', error);
    });
  };

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
            description="Are you sure you want to unsubscribe from recap emails?"
            onModalClose={handleModalClose}
            onUnsubscribe={onUnsubscribe}
          />
        }
        onClose={handleModalClose}
        open={isModalOpen}
      />
    </CWPageLayout>
  );
};

export default UnSubscribePage;
