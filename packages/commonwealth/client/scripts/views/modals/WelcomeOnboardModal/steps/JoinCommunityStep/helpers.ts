import { ChainBase } from '@hicommonwealth/shared';
import ChainInfo from 'models/ChainInfo';
import app from 'state';

type FindSuggestedCommunitiesProps = {
  userChainBase: ChainBase;
  userPreferenceTags: string[];
  maxCommunitiesToFind: number;
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
      const communityTagNames = community.CommunityTags.map((t) => t.name);

      // We dont want this community here
      // 1. if there are no tags
      // 2. if the community tags don't overlap user preference tags
      if (
        communityTagNames.length === 0 ||
        !userPreferenceTags.some((tag) => communityTagNames.includes(tag))
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
