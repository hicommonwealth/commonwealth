/* @jsx jsx */

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import moment from 'moment';

import 'pages/search/search_bar_components.scss';

import app from 'state';
import { AddressInfo } from 'models';
import { CWText } from '../../components/component_kit/cw_text';
import { renderQuillTextBody } from '../../components/quill/helpers';
import User from '../../components/widgets/user';
import { getClasses } from '../../components/component_kit/helpers';
import { CommunityLabel } from '../../components/community_label';

type SearchChipAttrs = {
  isActive: boolean;
  label: string;
  onclick: () => void;
};

export class SearchChip extends ClassComponent<SearchChipAttrs> {
  view(vnode: ResultNode<SearchChipAttrs>) {
    const { isActive, label, onclick } = vnode.attrs;

    return (
      <CWText
        type="b2"
        fontWeight="medium"
        class={getClasses<{ isActive: boolean }>(
          {
            isActive,
          },
          'SearchChip'
        )}
        onClick={onclick}
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

export class SearchBarThreadPreviewRow extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: ResultNode<SearchBarPreviewRowAttrs>) {
    const { searchResult, searchTerm } = vnode.attrs;

    return (
      <div
        className="SearchBarThreadPreviewRow"
        onClick={() =>
          setRoute(
            `/${searchResult.chain}/discussion/${searchResult.proposalid}`
          )
        }
      >
        <div className="header-row">
          {render(User, {
            user: new AddressInfo(
              searchResult.address_id,
              searchResult.address,
              searchResult.address_chain,
              null
            ),
          })}
          <CWText class="last-updated-text">•</CWText>
          <CWText type="caption" class="last-updated-text">
            {moment(searchResult.created_at).format('l')}
          </CWText>
          {/* <CWText type="caption">{searchResult.chain}</CWText> */}
        </div>
        <CWText type="b2" fontWeight="bold">
          {decodeURIComponent(searchResult.title)}
        </CWText>
        <CWText type="caption" class="excerpt-text" fontWeight="medium">
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

export class SearchBarCommentPreviewRow extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: ResultNode<SearchBarPreviewRowAttrs>) {
    const { searchResult, searchTerm } = vnode.attrs;

    return (
      <div
        className="SearchBarCommentPreviewRow"
        onClick={() => {
          setRoute(
            `/${searchResult.chain}/proposal/${
              searchResult.proposalid.split('_')[0]
            }/${searchResult.proposalid.split('_')[1]}`
          );
        }}
      >
        <CWText type="caption" class="last-updated-text">
          {moment(searchResult.created_at).format('l')}
        </CWText>
        {/* <CWText type="caption">{searchResult.chain}</CWText> */}
        {/* <CWText type="b2" fontWeight="medium">
          {decodeURIComponent(searchResult.title)}
        </CWText> */}
        <CWText type="caption" class="excerpt-text">
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

export class SearchBarCommunityPreviewRow extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: ResultNode<SearchBarPreviewRowAttrs>) {
    const { searchResult } = vnode.attrs;

    return (
      <div
        className="SearchBarCommunityPreviewRow"
        onClick={() => {
          setRoute(
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

export class SearchBarMemberPreviewRow extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: ResultNode<SearchBarPreviewRowAttrs>) {
    const { searchResult } = vnode.attrs;

    return (
      <div className="SearchBarMemberPreviewRow">
        {render(User, {
          user: app.profiles.getProfile(
            searchResult.chain,
            searchResult.address
          ),
          linkify: true,
        })}
      </div>
    );
  }
}
