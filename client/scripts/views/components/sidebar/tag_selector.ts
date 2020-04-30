/* eslint-disable no-unused-expressions */
import 'components/sidebar/tag_selector.scss';

import _ from 'lodash';
import m from 'mithril';
import dragula from 'dragula';
import { List, ListItem, Button, Icon, Icons, Checkbox } from 'construct-ui';

import app from 'state';
import { link, pluralize } from 'helpers';
import { OffchainThreadKind } from 'models';

import EditTagModal from 'views/modals/edit_tag_modal';
import PageLoading from 'views/pages/loading';
import { isCommunityAdmin } from 'views/pages/discussions/roles';


interface IEditTagForm {
  description: string,
  featured: boolean
  id: number,
  name: string,
}

const FeaturedCheckbox: m.Component<ITagRowAttrs, {featured: boolean, form: IEditTagForm}> = {
  oninit: (vnode) => {
    vnode.state.featured = vnode.attrs.featured;
  },
  view: (vnode) => {
    if (!isCommunityAdmin()) return null;
    const { id, description, featured, name, addFeaturedTag, removeFeaturedTag } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { description, featured, id, name };
    }
    const updateTag = async (form) => {
      const tagInfo = {
        id,
        description: form.description,
        featured: form.featured,
        name: form.name,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
      };
      if (form.featured !== vnode.attrs.featured) {
        if (form.featured) addFeaturedTag(`${id}`);
        else removeFeaturedTag(`${id}`);
        await app.tags.edit(tagInfo, form.featured);
      } else {
        await app.tags.edit(tagInfo);
      }
      m.redraw();
    };

    return m(Checkbox, {
      defaultChecked: vnode.state.featured,
      class: 'FeaturedCheckbox',
      label: 'Featured Tag',
      size: 'sm',
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
  hideEditButton: boolean;
}

const TagRow: m.Component<ITagRowAttrs, {}> = {
  view: (vnode) => {
    const {
      count, description, id, featured, featured_order,
      name, addFeaturedTag, removeFeaturedTag,
      hideEditButton
    } = vnode.attrs;
    if (featured && typeof Number(featured_order) !== 'number') return null;
    const selected = m.route.get() === `/${app.activeId()}/discussions/${name}`;

    return m(ListItem, {
      class: 'TagRow',
      key: id,
      id,
      selected,
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${app.activeId()}/discussions/${name}`);
      },
      contentLeft: m(Icon, { name: Icons.HASH }),
      label: [
        m('span.tag-name', name),
      ],
      contentRight: [
        !hideEditButton && m('.tag-count', pluralize(count, 'post')),
        !hideEditButton && m(FeaturedCheckbox, { ...vnode.attrs }),
        !hideEditButton && isCommunityAdmin() && m(Button, {
          class: 'edit-button',
          size: 'xs',
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
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
          },
          label: 'Edit',
        })
      ]
    });
  }
};

interface IGetTagListingParams {
  activeTag: string,
  featuredTagIds: string[],
  addFeaturedTag: Function,
  removeFeaturedTag: Function,
  hideEditButton: boolean,
}

export const getTagListing = (params: IGetTagListingParams) => {
  const { activeTag, featuredTagIds, addFeaturedTag, removeFeaturedTag, hideEditButton } = params;
  const otherTags = {};
  const featuredTags = {};

  app.threads.getType(OffchainThreadKind.Forum, OffchainThreadKind.Link).forEach((thread) => {
    const { tags } = thread;
    tags.forEach((tag) => {
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
      hideEditButton
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
        hideEditButton
      }))
    : [];

  return ({ featuredTagListing, otherTagListing });
};

const TagSelector: m.Component<{
  activeTag: string, showFullListing: boolean, hideEditButton?: boolean
}, { refreshed, featuredTagIds }> = {
  view: (vnode) => {
    const { activeTag, showFullListing, hideEditButton } = vnode.attrs;
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

    const params = { activeTag, featuredTagIds, addFeaturedTag, removeFeaturedTag, hideEditButton };
    const { featuredTagListing, otherTagListing } = getTagListing(params);

    return m('.TagSelector', [
      featuredTagListing.length > 0 && showFullListing && m('h4', 'Pinned to sidebar'),
      featuredTagListing.length > 0 && m(List, {
        class: 'featured-tag-list',
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
      }, featuredTagListing),
      showFullListing && m('h4', featuredTagListing.length > 0 ? 'Other tags' : 'Tags'),
      showFullListing && !!otherTagListing.length && m(List, { class: 'other-tag-list' }, otherTagListing),
      !showFullListing
        && (app.community || app.chain)
        && m(List, [
          m(ListItem, {
            class: 'TagRow',
            active: m.route.get() === `/${app.activeId()}/tags/`,
            label: 'Browse tags',
            onclick: (e) => m.route.set(`/${app.activeId()}/tags/`),
            contentLeft: m(Icon, { name: Icons.MORE_HORIZONTAL }),
          }),
        ]),
    ]);
  },
};

export default TagSelector;
