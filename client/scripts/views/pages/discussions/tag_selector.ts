/* eslint-disable no-unused-expressions */
import 'pages/discussions.scss';

import _ from 'lodash';
import m from 'mithril';
import dragula from 'dragula';

import app from 'state';
import { link } from 'helpers';
import { OffchainThreadKind } from 'models';

import EditTagModal from '../../modals/edit_tag_modal';
import PageLoading from '../loading';
import { isCommunityAdmin } from './roles';

interface ITagSelectorAttrs {
  activeTag?: string;
}

interface ITagRowAttrs {
  count: number,
  description: string,
  id: number,
  featured: boolean;
  featured_order?: number,
  name: string;
  selected: boolean;
  addFeaturedTag: Function;
  removeFeaturedTag: Function;
}

interface ITagRowState {
  hovered?: boolean;
}

const TagRow: m.Component<ITagRowAttrs, ITagRowState> = {
  view: (vnode) => {
    const {
      count,
      description,
      id,
      featured,
      featured_order,
      name,
      selected,
      addFeaturedTag,
      removeFeaturedTag
    } = vnode.attrs;

    if (featured && typeof Number(featured_order) !== 'number') return null;
    const options = {
      id,
      onmouseenter: (e) => {
        vnode.state.hovered = true;
      },
      onmouseleave: (e) => {
        vnode.state.hovered = false;
      }
    };

    options['class'] = selected ? 'selected' : '';
    // options.onclick = vnode.attrs.onclick(name);
    return m('.tag-selector-item', options, [
      link('a.tag-name',
        selected ? `/${app.activeId()}/` : `/${app.activeId()}/discussions/${name}`,
        `#${name} (${count})`),
      vnode.state.hovered
      && isCommunityAdmin()
      && m('a.edit-button', {
        href: '#',
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({
            modal: EditTagModal,
            data: {
              description,
              featured,
              featured_order,
              id,
              name,
              addFeaturedTag,
              removeFeaturedTag
            }
          });
        }
      }, 'Edit')
    ]);
  }
};

interface IGetTagListingParams {
  activeTag: string,
  featuredTagIds: string[],
  addFeaturedTag: Function,
  removeFeaturedTag: Function
}

const getTagListing = (args: IGetTagListingParams) => {
  const { activeTag, featuredTagIds, addFeaturedTag, removeFeaturedTag } = args;
  const otherTags = {};
  const featuredTags = {};

  app.threads.getType(OffchainThreadKind.Forum, OffchainThreadKind.Link).forEach((thread) => {
    thread.tags.forEach((tag) => {
      const listing = app.tags.getTagListing(tag, activeTag);
      if (featuredTagIds.includes(`${listing.id}`)) {
        if (featuredTags[listing.name]) {
          featuredTags[listing.name].count += 1;
        } else {
          featuredTags[listing.name] = {
            count: 1,
            featured_order: featuredTagIds.indexOf(`${listing.id}`),
            ...listing,
          };
        }
      } else if (otherTags[listing.name]) {
        otherTags[listing.name].count += 1;
      } else {
        otherTags[listing.name] = { count: 1, ...listing };
      }
    });
  });


  const OtherTagListing = Object.keys(otherTags)
    .sort((a, b) => otherTags[b].count - otherTags[a].count)
    .map((name, idx) => m(TagRow, {
      count: otherTags[name].count,
      description: otherTags[name].description,
      featured: false,
      id: otherTags[name].id,
      name: otherTags[name].name,
      selected: otherTags[name].selected,
      addFeaturedTag,
      removeFeaturedTag
    }));

  const FeaturedTagListing = featuredTagIds.length
    ? Object.keys(featuredTags)
      .sort((a, b) => Number(featuredTags[a].featured_order) - Number(featuredTags[b].featured_order))
      .map((name, idx) => m(TagRow, {
        count: featuredTags[name].count,
        description: featuredTags[name].description,
        featured: true,
        featured_order: Number(featuredTags[name].featured_order),
        id: featuredTags[name].id,
        name: featuredTags[name].name,
        selected: featuredTags[name].selected,
        addFeaturedTag,
        removeFeaturedTag
      }))
    : [];

  return ({ FeaturedTagListing, OtherTagListing });
};

const TagSelector: m.Component<ITagSelectorAttrs, { refreshed, featuredTagIds }> = {
  view: (vnode) => {
    const { activeTag } = vnode.attrs;
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return;
    if (!vnode.state.featuredTagIds) {
      vnode.state.featuredTagIds = app.community?.meta?.featuredTags || app.chain?.meta?.chain?.featuredTags;
    }
    const featuredTagIds = vnode.state.featuredTagIds || [];
    const addFeaturedTag = (tagId: string) => {
      vnode.state.featuredTagIds.push(tagId);
      m.redraw();
    };
    const removeFeaturedTag = (tagId: string) => {
      vnode.state.featuredTagIds = vnode.state.featuredTagIds.filter((t) => Number(t) !== Number(tagId));
      m.redraw();
    };

    const params = { activeTag, featuredTagIds, addFeaturedTag, removeFeaturedTag };
    const { FeaturedTagListing, OtherTagListing } = getTagListing(params);

    return m('.TagSelector', [
      !!FeaturedTagListing.length && m('.featured-tags', [
        m('h4.sidebar-header', 'Featured Tags'),
        m('.featured-tag-list', {
          oncreate: () => {
            if (isCommunityAdmin()) {
              dragula([document.querySelector('.featured-tag-list')])
                .on('drop', async (el, target, source) => {
                  const reorder = Array.from(source.children).map((child) => {
                    return (child as HTMLElement).id;
                  });
                  vnode.state.featuredTagIds = reorder;
                  await app.community.meta.updateFeaturedTags(reorder);
                });
            }
          }
        }, FeaturedTagListing)
      ]),
      !!OtherTagListing.length && m('.other-tags', [
        m('h4.sidebar-header', FeaturedTagListing.length ? 'Other Tags' : 'Tags'),
        OtherTagListing
      ])
    ]);
  },
};

export default TagSelector;
