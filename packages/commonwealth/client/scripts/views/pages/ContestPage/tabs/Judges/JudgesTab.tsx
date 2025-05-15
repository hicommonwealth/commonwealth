import React from 'react';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import { CWAvatar } from 'client/scripts/views/components/component_kit/cw_avatar';
import './JudgesTab.scss';

interface JudgesTabProps {
  contestAddress: string;
}

const JudgesTab = ({ contestAddress }: JudgesTabProps) => {
  const { getContestByAddress } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

  const judgeAddresses = contest?.namespace_judges || [];
  const communityId = contest?.community_id || '';

  const isLoading = false;
  const profiles = [];

  if (isLoading) {
    return (
      <div className="JudgesTab">
        <CWCard>
          <div className="loading-container">
            <CWCircleMultiplySpinner />
            <CWText type="b1">Loading judges...</CWText>
          </div>
        </CWCard>
      </div>
    );
  }

  if (!judgeAddresses.length) {
    return (
      <div className="JudgesTab">
        <CWCard>
          <div className="empty-state">
            <CWText type="h3">No Judges</CWText>
            <CWText type="b1">
              This contest does not have any judges assigned yet.
            </CWText>
          </div>
        </CWCard>
      </div>
    );
  }

  return (
    <div className="JudgesTab">
      <CWCard>
        <CWText type="h3">Contest Judges</CWText>
        <CWText type="b2" className="description">
          The following judges have been nominated to vote on entries in this
          contest.
        </CWText>

        <div className="judges-list">
          {judgeAddresses.map((address) => {
            const profile = profiles?.find((p) => p.address === address);

            return (
              <div key={address} className="judge-item">
                <CWAvatar
                  size="medium"
                  address={address}
                  avatarUrl={profile?.avatarUrl}
                />
                <div className="judge-info">
                  <CWText type="h5">{profile?.name || 'Anonymous'}</CWText>
                  <CWText type="b2" className="address">
                    {address}
                  </CWText>
                </div>
              </div>
            );
          })}
        </div>
      </CWCard>
    </div>
  );
};

export default JudgesTab;
