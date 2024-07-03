import React, { useState, useEffect, useRef, useCallback } from 'react';
import useTransactionHistory from 'client/scripts/hooks/useTransactionHistory';
import { FilterOptions } from '../../pages/MyCommunityStake/types';
import app from 'state';

import 'components/Profile/ProfileActivity.scss';

import type AddressInfo from 'models/AddressInfo';
import type Comment from 'models/Comment';
import type Thread from 'models/Thread';
import type { IUniqueId } from 'models/interfaces';
import { CWTab, CWTabsRow } from '../component_kit/new_designs/CWTabs';
import ProfileActivityContent from './ProfileActivityContent';

enum ProfileActivityType {
  Addresses,
  Comments,
  Communities,
  Threads,
  Portfolio
}

export type CommentWithAssociatedThread = Comment<IUniqueId> & {
  thread: Thread;
};

type ProfileActivityProps = {
  addresses: AddressInfo[];
  comments: CommentWithAssociatedThread[];
  threads: Thread[];
};

const ProfileActivity = ({ comments, threads }: ProfileActivityProps) => {
  const [selectedActivity, setSelectedActivity] = useState(
    ProfileActivityType.Comments,
  );
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText: '',
    selectedAddress: { label: 'All addresses', value: '' },
  });

  const possibleAddresses = app?.user?.addresses?.map(x => x.address) || [];
  const addressFilter = filterOptions?.selectedAddress?.value ? [filterOptions.selectedAddress.value] : possibleAddresses;

  const transactionData = useTransactionHistory({
    filterOptions,
    addressFilter,
  });

  const processPortfolioData = useCallback(() => {
    if (transactionData) {
      const newPortfolioData = transactionData.map((info) => ({
        ...info,
        chain: app.config.chains.getById(info.community.id)?.ChainNode?.name || '',
      }));
      setPortfolioData(newPortfolioData);
      setIsPortfolioLoading(false);
    }
  }, [transactionData]);

  useEffect(() => {
    if (selectedActivity === ProfileActivityType.Portfolio && !portfolioData.length) {
      setIsPortfolioLoading(true);
      processPortfolioData();
    }
  }, [selectedActivity, portfolioData.length, processPortfolioData]);

  const handleTabChange = useCallback((newActivity: ProfileActivityType) => {
    setSelectedActivity(newActivity);
  }, []);

  return (
    <div className="ProfileActivity">
      <div className="activity-nav">
        <CWTabsRow>
          <CWTab
            label="All"
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Comments);
            }}
            isSelected={selectedActivity === ProfileActivityType.Comments}
          />
          <CWTab
            label="Portfolio"
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Portfolio);
            }}
            isSelected={selectedActivity === ProfileActivityType.Portfolio}
          />
          <CWTab
            label={
              <div className="tab-header">
                Threads
                <div className="count">{threads.length}</div>
              </div>
            }
            onClick={() => {
              setSelectedActivity(ProfileActivityType.Threads);
            }}
            isSelected={selectedActivity === ProfileActivityType.Threads}
          />
        </CWTabsRow>
      </div>
      <div className="activity-content">
        <ProfileActivityContent
          option={selectedActivity}
          threads={threads}
          comments={comments}
          portfolioData={portfolioData}
          isLoading={isPortfolioLoading}
        />
      </div>
    </div>
  );
};

export default ProfileActivity;
