/* @jsx jsx */
import React from 'react';

import { AddressInfo } from 'models';
import type { ResultNode } from 'mithrilInterop';
import { ClassComponent, jsx } from 'mithrilInterop';
import moment from 'moment';

import 'pages/search/search_bar_components.scss';

import app from 'state';
import { CommunityLabel } from '../../components/community_label';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { User } from '../../components/user/user';
import withRouter from 'navigation/helpers';

type SearchChipAttrs = {
  isActive: boolean;
  label: string;
  onClick: () => void;
};

export class SearchChip extends ClassComponent<SearchChipAttrs> {
  view(vnode: ResultNode<SearchChipAttrs>) {
    const { isActive, label, onClick } = vnode.attrs;

    return (
      <CWText
        type="b2"
        fontWeight="medium"
        className={getClasses<{ isActive: boolean }>(
          {
            isActive,
          },
          'SearchChip'
        )}
        onClick={onClick}
      >
        {label}
      </CWText>
    );
  }
}

type SearchBarPreviewRowAttrs = {
  searchResult: any;
  searchTerm?: string;
};

export class SearchBarThreadPreviewRowComponent extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: ResultNode<SearchBarPreviewRowAttrs>) {
    const { searchResult, searchTerm } = vnode.attrs;

    return (
      <div
        className="SearchBarThreadPreviewRow"
        onClick={() =>
          this.setRoute(
            `/${searchResult.chain}/discussion/${searchResult.proposalid}`
          )
        }
      >
        <div className="header-row">
          <User
            user={
              new AddressInfo(
                searchResult.address_id,
                searchResult.address,
                searchResult.address_chain,
                null
              )
            }
          />
          <CWText className="last-updated-text">•</CWText>
          <CWText type="caption" className="last-updated-text">
            {moment(searchResult.created_at).format('l')}
          </CWText>
          {/* <CWText type="caption">{searchResult.chain}</CWText> */}
        </div>
        <CWText type="b2" fontWeight="bold">
          {decodeURIComponent(searchResult.title)}
        </CWText>
        <CWText type="caption" className="excerpt-text" fontWeight="medium">
          {renderQuillTextBody(searchResult.body, {
            hideFormatting: true,
            collapse: true,
            searchTerm,
          })}
        </CWText>
      </div>
    );
  }
}

export const SearchBarThreadPreviewRow = withRouter(
  SearchBarThreadPreviewRowComponent
);

class SearchBarCommentPreviewRowComponent extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: ResultNode<SearchBarPreviewRowAttrs>) {
    const { searchResult, searchTerm } = vnode.attrs;

    return (
      <div
        className="SearchBarCommentPreviewRow"
        onClick={() => {
          this.setRoute(
            `/${searchResult.chain}/proposal/${
              searchResult.proposalid.split('_')[0]
            }/${searchResult.proposalid.split('_')[1]}`
          );
        }}
      >
        <CWText type="caption" className="last-updated-text">
          {moment(searchResult.created_at).format('l')}
        </CWText>
        {/* <CWText type="caption">{searchResult.chain}</CWText> */}
        {/* <CWText type="b2" fontWeight="medium">
          {decodeURIComponent(searchResult.title)}
        </CWText> */}
        <CWText type="caption" className="excerpt-text">
          {renderQuillTextBody(searchResult.text, {
            hideFormatting: true,
            collapse: true,
            searchTerm,
          })}
        </CWText>
      </div>
    );
  }
}

export const SearchBarCommentPreviewRow = withRouter(
  SearchBarCommentPreviewRowComponent
);

class SearchBarCommunityPreviewRowComponent extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: ResultNode<SearchBarPreviewRowAttrs>) {
    const { searchResult } = vnode.attrs;

    return (
      <div
        className="SearchBarCommunityPreviewRow"
        onClick={() => {
          this.setRoute(
            searchResult.address
              ? `/${searchResult.address}`
              : searchResult.id
              ? `/${searchResult.id}`
              : '/'
          );
        }}
      >
        <CommunityLabel community={searchResult} />
      </div>
    );
  }
}

export const SearchBarCommunityPreviewRow = withRouter(
  SearchBarCommunityPreviewRowComponent
);

export class SearchBarMemberPreviewRow extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: ResultNode<SearchBarPreviewRowAttrs>) {
    const { searchResult } = vnode.attrs;

    return (
      <div className="SearchBarMemberPreviewRow">
        <User
          user={app.profiles.getProfile(
            searchResult.chain,
            searchResult.address
          )}
          linkify
        />
      </div>
    );
  }
}
