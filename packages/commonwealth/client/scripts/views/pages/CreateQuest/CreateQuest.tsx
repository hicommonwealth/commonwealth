import React from 'react';
import Permissions from 'shared/utils/Permissions';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../404';
import './CreateQuest.scss';
import QuestForm from './QuestForm';

const CreateQuest = () => {
  const user = useUserStore();

  if (!user.isLoggedIn || !Permissions.isSiteAdmin()) return <PageNotFound />;

  return (
    <CWPageLayout>
      <div className="CreateQuest">
        <div className="header">
          <CWText type="h2">Create a Quest</CWText>
          <CWText type="b1">
            Create community-focused tasks to increase engagement! Note: All
            requirements must be fulfilled for users to earn Aura, so we
            encourage relevant quest items to be grouped into multiple quests.
          </CWText>
        </div>
        <QuestForm mode="create" />
      </div>
    </CWPageLayout>
  );
};

export default CreateQuest;
