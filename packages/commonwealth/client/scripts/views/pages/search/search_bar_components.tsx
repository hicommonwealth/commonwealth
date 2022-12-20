/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
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
        {m(User, {
          user: new AddressInfo(
            searchResult.address_id,
            searchResult.address,
            searchResult.address_chain,
            null
          ),
        })}
        <CWText>{moment(searchResult.created_at).fromNow()}</CWText>
        <CWText>{searchResult.chain}</CWText>
        <CWText>{decodeURIComponent(searchResult.title)}</CWText>
        <CWText>
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
            `/${searchResult.chain}/proposal/${
              searchResult.proposalid.split('_')[0]
            }/${searchResult.proposalid.split('_')[1]}`
          );
        }}
      >
        <CWText>{`Comment on ${decodeURIComponent(
          searchResult.title
        )}`}</CWText>
        <CWText>{moment(searchResult.created_at).fromNow()}</CWText>
        {m(User, {
          user: new AddressInfo(
            searchResult.address_id,
            searchResult.address,
            searchResult.address_chain,
            null
          ),
        })}
        {renderQuillTextBody(searchResult.text, {
          hideFormatting: true,
          collapse: true,
          searchTerm,
        })}
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
