/* eslint-disable no-unused-expressions */
import 'pages/tags.scss';

import _ from 'lodash';
import m from 'mithril';
import $ from 'jquery';
import dragula from 'dragula';
import { Card, List, ListItem, Button, EmptyState, Icon, Icons } from 'construct-ui';

import app from 'state';
import { link, pluralize } from 'helpers';
import { OffchainThreadKind } from 'models';

import Sublayout from 'views/sublayout';
import NewTagModal from 'views/modals/new_tag_modal';
import EditTagModal from 'views/modals/edit_tag_modal';
import PageLoading from 'views/pages/loading';

interface IEditTagForm {
  description: string,
  featured: boolean,
  id: number,
  name: string,
}

const ToggleFeaturedTagButton: m.Component<{
  id, description, featured, name, addFeaturedTag, removeFeaturedTag
}, {form: IEditTagForm}> = {
  view: (vnode) => {
    if (!app.user.isAdmin({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, description, featured, name, addFeaturedTag, removeFeaturedTag } = vnode.attrs;

    vnode.state.form = { description, id, name, featured };

    const updateTag = async (form) => {
      const tagInfo = {
        id,
        description: form.description,
        featured: form.featured,
        name: form.name,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
      };

      if (form.featured) {
        addFeaturedTag(`${id}`);
      } else {
        removeFeaturedTag(`${id}`);
      }
      await app.tags.edit(tagInfo, form.featured);

      m.redraw();
    };

    return m(Button, {
      defaultChecked: vnode.state.form.featured,
      class: 'ToggleFeaturedTagButton',
      label: vnode.state.form.featured ? 'Unpin' : 'Pin to sidebar',
      iconLeft: vnode.state.form.featured ? null : Icons.STAR,
      size: 'xs',
      onclick: async (e) => {
        e.preventDefault();
        vnode.state.form.featured = !vnode.state.form.featured;
        await updateTag(vnode.state.form);
      },
    });
  },
};

interface ITagRowAttrs {
  count: number,
  description: string,
  id: number,
  featured: boolean;
  featured_order?: number,
  name: string;
  addFeaturedTag: Function;
  removeFeaturedTag: Function;
}

const TagRow: m.Component<ITagRowAttrs, {}> = {
  view: (vnode) => {
    const {
      count, description, id, featured, featured_order,
      name, addFeaturedTag, removeFeaturedTag,
    } = vnode.attrs;
    if (featured && typeof Number(featured_order) !== 'number') return null;
    return m(ListItem, {
      class: 'TagRow',
      key: id,
      id,
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeId()}/discussions/${name}`);
      },
      label: [
        m('span.tag-name', name),
      ],
      contentRight: [
        count && m('.tag-count', pluralize(count, 'post')),
        m(ToggleFeaturedTagButton, { description, featured, id, name, addFeaturedTag, removeFeaturedTag }),
        (app.user.isAdmin({ chain: app.activeChainId(), community: app.activeCommunityId() })) && m(Button, {
          class: 'edit-button',
          size: 'xs',
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            app.modals.create({
              modal: EditTagModal,
              data: {
                description,
                id,
                name,
              }
            });
          },
          label: 'Edit',
        })
      ]
    });
  }
};

interface IGetTagListingParams {
  featuredTagIds: string[],
  addFeaturedTag: Function,
  removeFeaturedTag: Function,
}

export const getTagListing = (params: IGetTagListingParams) => {
  const { featuredTagIds, addFeaturedTag, removeFeaturedTag } = params;
  const otherTags = {};
  const featuredTags = {};

  app.threads.getType(OffchainThreadKind.Forum, OffchainThreadKind.Link).forEach((thread) => {
    const { tag } = thread;
    if (!tag) return null;
    // Iff a tag is already in the TagStore, e.g. due to app.tags.edit, it will be excluded from
    // addition to the TagStore, since said store will be more up-to-date
    const existing = app.tags.getByIdentifier(tag.id);
    if (!existing) app.tags.addToStore(tag);
    const { id, name, description } = existing || tag;

    if (featuredTagIds.includes(`${id}`)) {
      if (featuredTags[name]) featuredTags[name].count += 1;
      else {
        featuredTags[name] = {
          count: 1,
          description,
          featured_order: featuredTagIds.indexOf(`${id}`),
          id,
          name,
        };
      }
    } else if (otherTags[name]) {
      otherTags[name].count += 1;
    } else {
      otherTags[name] = {
        count: 1,
        description,
        id,
        name,
      };
    }
  });

  const threadlessTags = app.tags.getByCommunity(app.activeId()).forEach((tag) => {
    if (featuredTagIds.includes(`${tag.id}`)) {
      if (!featuredTags[`${tag.name}`]) {
        featuredTags[tag.name] = {
          count: null,
          description: tag.description,
          featured_order: featuredTagIds.indexOf(`${tag.id}`),
          id: tag.id,
          name: tag.name,
        };
      }
    } else if (!otherTags[tag.name]) {
      otherTags[tag.name] = {
        count: null,
        description: tag.description,
        id: tag.id,
        name: tag.name,
      };
    }
  });

  const otherTagListing = Object.keys(otherTags)
    .sort((a, b) => otherTags[b].count - otherTags[a].count)
    .map((name, idx) => m(TagRow, {
      count: otherTags[name].count,
      description: otherTags[name].description,
      featured: false,
      id: otherTags[name].id,
      name: otherTags[name].name,
      addFeaturedTag,
      removeFeaturedTag,
    }));

  const featuredTagListing = featuredTagIds.length
    ? Object.keys(featuredTags)
      .sort((a, b) => Number(featuredTags[a].featured_order) - Number(featuredTags[b].featured_order))
      .map((name, idx) => m(TagRow, {
        count: featuredTags[name].count,
        description: featuredTags[name].description,
        featured: true,
        featured_order: Number(featuredTags[name].featured_order),
        id: featuredTags[name].id,
        name: featuredTags[name].name,
        addFeaturedTag,
        removeFeaturedTag,
      }))
    : [];

  return ({ featuredTagListing, otherTagListing });
};

export const NewTagButton: m.Component = {
  view: (vnode) => {
    return m(Button, {
      class: '',
      label: 'Create New Tag',
      iconLeft: Icons.PLUS,
      onclick: async (e) => {
        e.preventDefault();
        app.modals.create({ modal: NewTagModal });
      },
    });
  },
};

const TagSelector: m.Component<{}, { refreshed, featuredTagIds }> = {
  view: (vnode) => {
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return;

    vnode.state.featuredTagIds = app.community?.meta?.featuredTags || app.chain?.meta?.chain?.featuredTags;
    const featuredTagIds = vnode.state.featuredTagIds || [];
    const addFeaturedTag = (tagId: string) => {
      if (app.community) {
        app.community.meta.addFeaturedTag(tagId);
      } else if (app.chain) {
        app.chain.meta.chain.addFeaturedTag(tagId);
      }
      m.redraw();
    };
    const removeFeaturedTag = (tagId: string) => {
      if (app.community) {
        app.community.meta.removeFeaturedTag(tagId);
      } else if (app.chain) {
        app.chain.meta.chain.removeFeaturedTag(tagId);
      }
      m.redraw();
    };

    const params = { featuredTagIds, addFeaturedTag, removeFeaturedTag };
    const { featuredTagListing, otherTagListing } = getTagListing(params);

    return m('.TagSelector', [
      featuredTagListing.length > 0 && m(List, {
        class: 'featured-tag-list',
        oncreate: () => {
          if (app.user.isAdmin({ chain: app.activeChainId(), community: app.activeCommunityId() })) {
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
      }, featuredTagListing),
      otherTagListing.length > 0 && m(List, { class: 'other-tag-list' }, otherTagListing),
    ]);
  },
};

const TagsPage = {
  view: (vnode) => {
    return m(Sublayout, {
      class: 'TagsPage',
    }, [
      m('.forum-container', [
        m(TagSelector),
        m('br'),
        app.user.isAdmin({ chain: app.activeChainId(), community: app.activeCommunityId() }) && m(NewTagButton),
      ]),
    ]);
  },
};

export default TagsPage;
