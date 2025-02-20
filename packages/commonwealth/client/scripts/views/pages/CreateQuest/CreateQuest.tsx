import React from 'react';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
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
            requirements must be fulfilled for users to earn XP, so we encourage
            relevant quest items to be grouped into multiple quests.
          </CWText>
        </div>
        <QuestForm />
      </div>
    </CWPageLayout>
  );
};

export default CreateQuest;
