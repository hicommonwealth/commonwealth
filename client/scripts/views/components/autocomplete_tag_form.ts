import 'components/autocomplete_tag_form.scss';

import m from 'mithril';
import { SelectList, ListItem, Colors, Button, Icons, List } from 'construct-ui';
import { OffchainTag } from '../../models';
import { symbols } from '../../helpers';

interface IAutoCompleteTagFormAttrs {
  tags: OffchainTag[];
  featuredTags: OffchainTag[];
  activeTag?: OffchainTag | string;
  tabindex?: number;
  updateFormData: Function;
  updateParentErrors?: Function;
}

interface IAutoCompleteTagFormState {
  error: string;
  selectedTag: OffchainTag | string;
}

const AutoCompleteTagForm: m.Component<IAutoCompleteTagFormAttrs, IAutoCompleteTagFormState> = {
  view: (vnode) => {
    const { featuredTags, activeTag, tabindex, tags, updateFormData } = vnode.attrs;

    const itemRender = (tag) => {
      return m(ListItem, {
        class: featuredTags.includes(tag) ? 'featured-tag' : 'other-tag',
        // contentLeft: m('.tagItem', `# ${tag.name}`),
        label: `# ${tag.name}`,
        selected: (vnode.state.selectedTag as OffchainTag)?.name === tag.name,
      });
    };

    const itemPredicate = (query: string, item: OffchainTag) => {
      return item.name.toLowerCase().includes(query.toLowerCase());
    };

    const onSelect = (item: OffchainTag) => {
      vnode.state.selectedTag = item;
      updateFormData(item.name, item.id);
    };

    const manuallyClosePopover = () => {
      const button = document.getElementsByClassName('tag-selection-drop-menu')[0];
      if (button) (button as HTMLButtonElement).click();
    };

    const addTag = (tag?) => {
      const newTag = tag || (document.getElementsByClassName('autocomplete-tag-input')[0]
        .firstChild as HTMLInputElement).value;
      tags.push({ name: newTag, id: null, description: '' });
      setTimeout(() => { vnode.state.selectedTag = newTag; m.redraw(); }, 1);
      updateFormData(newTag);
      if (!tag) manuallyClosePopover();
    };

    const sortTags = (tags_: OffchainTag[]) => {
      return tags_.filter((tag) => featuredTags.includes(tag)).sort((a, b) => a.name > b.name ? 1 : -1)
        .concat(tags_.filter((tag) => !featuredTags.includes(tag)).sort((a, b) => a.name > b.name ? 1 : -1));
    };

    const EmptyContent: m.Component<{}, {}> = {
      view: (vnode_) => {
        return m('a.no-matching-tags', {
          href: '#',
          onclick: () => addTag(),
        }, 'No matches found. Add tag?');
      }
    };
    if ((activeTag as OffchainTag)?.id) {
      (vnode.state.selectedTag as any) = activeTag;
    } else if (typeof activeTag === 'string') {
      addTag(activeTag);
    } else if (!activeTag) {
      vnode.state.selectedTag = null;
    }

    return m(SelectList, {
      class: 'AutocompleteTagForm',
      checkmark: false,
      emptyContent: m(EmptyContent),
      inputAttrs: {
        class: 'autocomplete-tag-input',
        placeholder: 'Select a tag...',
      },
      itemPredicate,
      itemRender,
      items: sortTags(tags),
      onSelect,
      trigger: m(Button, {
        align: 'left',
        class: 'tag-selection-drop-menu',
        compact: true,
        iconRight: Icons.CHEVRON_DOWN,
        label: vnode.state.selectedTag
          ? ((vnode.state.selectedTag as OffchainTag).name || (vnode.state.selectedTag as string))
          : '',
        sublabel: vnode.state.selectedTag ? '' : 'Select a tag (required)',
        tabindex
      }),
    });
  },
};

export default AutoCompleteTagForm;
