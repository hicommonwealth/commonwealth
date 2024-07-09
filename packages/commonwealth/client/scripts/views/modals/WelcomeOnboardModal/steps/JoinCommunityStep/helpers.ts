import { ChainBase, CommunityCategoryType } from '@hicommonwealth/shared';
import ChainInfo from 'models/ChainInfo';
import app from 'state';
import { getCommunityTags } from 'views/pages/CommunityManagement/CommunityProfile/CommunityProfileForm/helpers';

type FindSuggestedCommunitiesProps = {
  userChainBase: ChainBase;
  userPreferenceTags: string[];
  maxCommunitiesToFind: number;
};

// TODO: this method should be deprecated after https://github.com/hicommonwealth/commonwealth/issues/7835
const getAllCommunityTags = (community: ChainInfo): string[] => {
  const deprecatedTags = getCommunityTags(community.id);
  const aggregatedTags = [
    // filter out `defi` and `dao` tags from newer `CommunityTags` array
    ...community.CommunityTags.filter(
      (t) =>
        ![
          CommunityCategoryType.DeFi.toLowerCase(),
          CommunityCategoryType.DeFi.toLowerCase(),
        ].includes(t.name.toLowerCase()),
    ).map((t) => t.name),
  ];
  // add `defi`, `dao` tags from older community category map
  deprecatedTags.DeFi && aggregatedTags.push(CommunityCategoryType.DeFi);
  deprecatedTags.DAO && aggregatedTags.push(CommunityCategoryType.DAO);
  return aggregatedTags;
};

export const findSuggestedCommunities = ({
  userChainBase,
  userPreferenceTags,
  maxCommunitiesToFind,
}: FindSuggestedCommunitiesProps): ChainInfo[] => {
  // this map will hold both the communities that match user preferences and the ones that don't
  const communityPreferenceMap: {
    [key in string]: ChainInfo[];
  } = {
    communitiesMatchingUserPreferences: [],
    communitiesNotMatchingUserPreferences: [],
  };

  // 1. filter communities that match user wallet chain base
  // 2. then sort them by the count of members (from higher to lower)
  // 3. then sort them by the count of threads (from higher to lower)
  // 4. then seperate them into 2 groups, communities that match user preferences and those that don't
  [...app.config.chains.getAll()]
    .filter((community) => community.base === userChainBase)
    .sort((a, b) => b.addressCount - a.addressCount)
    .sort((a, b) => b.threadCount - a.threadCount)
    .map((community) => {
      const aggregatedCommunityTags = getAllCommunityTags(community);

      // We dont want this community here
      // 1. if there are no tags
      // 2. if the community tags don't overlap user preference tags
      if (
        aggregatedCommunityTags.length === 0 ||
        !userPreferenceTags.some((tag) => aggregatedCommunityTags.includes(tag))
      ) {
        communityPreferenceMap.communitiesNotMatchingUserPreferences.push(
          community,
        );
      } else {
        communityPreferenceMap.communitiesMatchingUserPreferences.push(
          community,
        );
      }

      return community;
    });

  const {
    communitiesMatchingUserPreferences,
    communitiesNotMatchingUserPreferences,
  } = communityPreferenceMap;

  // get upto `maxCommunitiesToFind` count of communities from the preference map.
  let suggestedCommunities = communitiesMatchingUserPreferences.slice(
    0,
    maxCommunitiesToFind,
  );
  // if there aren't `maxCommunitiesToFind` count of communities that match user preferences
  // then get the remaining communities from the communities map that doesn't match user preferences
  if (suggestedCommunities.length < maxCommunitiesToFind) {
    const remainingCount = maxCommunitiesToFind - suggestedCommunities.length;
    suggestedCommunities = suggestedCommunities.concat(
      communitiesNotMatchingUserPreferences.slice(0, remainingCount),
    );
  }

  return suggestedCommunities;
};
