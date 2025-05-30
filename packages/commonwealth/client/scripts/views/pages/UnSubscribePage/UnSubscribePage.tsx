import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { useUnSubscribeEmailMutation } from 'state/api/trpc/subscription/useUnSubscribeEmailMutation';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import UnSubscribeModal from '../../modals/UnSubscribeModal/UnSubscribeModal';
import { PageNotFound } from '../404';

type UnSubscribePageProps = {
  userId: string;
};

const UnSubscribePage = ({ userId }: UnSubscribePageProps) => {
  const _userId = parseInt(`${userId || 0}`);
  const { mutateAsync: unSubscribeEmail } = useUnSubscribeEmailMutation();
  const [isModalOpen, setModalOpen] = useState(false);

  const navigate = useCommonNavigate();
  const handleModalClose = () => {
    setModalOpen(false);
    navigate('/dashboard');
  };

  const handleUnsubscribe = async () => {
    if (_userId) {
      await unSubscribeEmail({
        user_uuid: String(_userId),
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
    if (_userId) {
      setModalOpen(true);
    }
  }, [_userId]);

  if (!_userId) {
    return <PageNotFound />;
  }

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
