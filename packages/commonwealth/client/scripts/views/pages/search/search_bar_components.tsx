/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';
import { AddressInfo } from 'models';
import moment from 'moment';

import 'pages/search/search_bar_components.scss';

import app from 'state';
import { CommunityLabel } from '../../components/community_label';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { renderQuillTextBody } from '../../components/quill/helpers';
import User from '../../components/widgets/user';

type SearchChipAttrs = {
  isActive: boolean;
  label: string;
  onclick: () => void;
};

export class SearchChip extends ClassComponent<SearchChipAttrs> {
  view(vnode: m.Vnode<SearchChipAttrs>) {
    const { isActive, label, onclick } = vnode.attrs;

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
        onclick={onclick}
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
  view(vnode: m.Vnode<SearchBarPreviewRowAttrs>) {
    const { searchResult, searchTerm } = vnode.attrs;

    return (
      <div
        class="SearchBarThreadPreviewRow"
        onclick={() =>
          m.route.set(
            `/${searchResult.chain}/discussion/${searchResult.proposalid}`
          )
        }
      >
        <div class="header-row">
          {m(User, {
            user: new AddressInfo(
              searchResult.address_id,
              searchResult.address,
              searchResult.address_chain,
              null
            ),
          })}
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

export class SearchBarCommentPreviewRow extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: m.Vnode<SearchBarPreviewRowAttrs>) {
    const { searchResult, searchTerm } = vnode.attrs;

    return (
      <div
        class="SearchBarCommentPreviewRow"
        onclick={() => {
          m.route.set(
            `/${searchResult.chain}/discussion/${searchResult.proposalid}`
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

export class SearchBarCommunityPreviewRow extends ClassComponent<SearchBarPreviewRowAttrs> {
  view(vnode: m.Vnode<SearchBarPreviewRowAttrs>) {
    const { searchResult } = vnode.attrs;

    return (
      <div
        class="SearchBarCommunityPreviewRow"
        onclick={() => {
          m.route.set(
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
  view(vnode: m.Vnode<SearchBarPreviewRowAttrs>) {
    const { searchResult } = vnode.attrs;

    return (
      <div class="SearchBarMemberPreviewRow">
        {m(User, {
          user: app.newProfiles.getProfile(
            searchResult.chain,
            searchResult.address
          ),
          linkify: true,
        })}
      </div>
    );
  }
}
