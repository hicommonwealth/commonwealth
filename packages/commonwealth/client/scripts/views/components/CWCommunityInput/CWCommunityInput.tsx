import { APIOrderBy, APIOrderDirection } from 'helpers/constants';
import React, { useState } from 'react';
import { components } from 'react-select';
import { useSearchChainsQuery } from 'state/api/chains';
import { useDebounce } from 'usehooks-ts';
import CommunityInfo from '../component_kit/CommunityInfo';
import { CWSelectList } from '../component_kit/new_designs/CWSelectList';
import './CWCommunityInput.scss';

type CWCommunityInputProps = Parameters<typeof CWSelectList>[0] & {
  // add more as needed
};

type CWCommunityInputOption = {
  label: {
    name: string;
    imageURL: string;
  };
  value: string;
};

const DEFAULT_COMMUNITY_SEARCH = 'common';

const CWCommunityInput = (props: CWCommunityInputProps) => {
  const {
    // destruct custom props here
    ...rest
  } = props;

  const [communitySearch, setCommunitySearch] = useState(
    DEFAULT_COMMUNITY_SEARCH,
  );
  const debouncedSearchTerm = useDebounce<string>(communitySearch, 300);

  const { data: communityResults } = useSearchChainsQuery({
    searchTerm: debouncedSearchTerm, // we want to display the common community as a default
    limit: debouncedSearchTerm === DEFAULT_COMMUNITY_SEARCH ? 1 : 100,
    orderBy: APIOrderBy.Rank,
    orderDirection: APIOrderDirection.Desc,
    enabled: debouncedSearchTerm.trim().length > 0,
    communityId: '',
  });
  const communities = (communityResults?.pages || []).flatMap(
    (page) => page.results,
  );

  return (
    <CWSelectList
      label="Community"
      placeholder="Search community or select from list below"
      {...rest}
      backspaceRemovesValue
      onInputChange={(value, actionMeta) => {
        rest?.onInputChange?.(value, actionMeta);
        setCommunitySearch(
          value.trim().toLowerCase() || DEFAULT_COMMUNITY_SEARCH,
        );
      }}
      options={communities.map((c) => ({
        label: { imageURL: c.icon_url, name: c.name },
        value: c.id,
      }))}
      components={{
        // option item in the dropdown
        // eslint-disable-next-line react/no-multi-comp
        Option: (originalProps) => {
          // eslint-disable-next-line react/destructuring-assignment
          const { value, label } = originalProps.data as CWCommunityInputOption;
          return (
            <components.Option {...originalProps}>
              <CommunityInfo
                communityId={value}
                iconUrl={label.imageURL}
                name={label.name}
                linkToCommunity={false}
              />
            </components.Option>
          );
        },
      }}
      formatOptionLabel={(option: CWCommunityInputOption) => (
        // selected option
        <CommunityInfo
          communityId={option.value}
          iconUrl={option.label.imageURL}
          name={option.label.name}
          linkToCommunity={false}
        />
      )}
    />
  );
};

export default CWCommunityInput;
