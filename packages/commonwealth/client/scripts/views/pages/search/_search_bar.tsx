/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/search/_search_bar.scss';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTag } from '../../components/component_kit/cw_tag';
import { CWButton } from '../../components/component_kit/cw_button';

export class _SearchBar extends ClassComponent {
  private showDropdown: boolean;

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  view() {
    return (
      <div class="SearchBar">
        <div
          class="search-and-icon-container"
          //   onclick={() => {
          //     this.toggleDropdown();
          //   }}
        >
          <input placeholder="Search Common" />
          <div class="searchbar-icon">
            <CWIconButton
              iconName="search"
              onclick={(e) => {
                e.stopPropagation();
                this.toggleDropdown();
              }}
            />
          </div>
          {this.showDropdown && (
            <div class="search-results-dropdown">
              <CWText type="caption" fontWeight="medium">
                Limit search to
              </CWText>
              <CWButton label="Poop" />
              <CWText type="caption" fontWeight="medium">
                I'm looking for
              </CWText>
              <div class="looking-buttons-row">
                <CWButton label="Poop" />
                <CWButton label="Poop" />
                <CWButton label="Poop" />
                <CWButton label="Poop" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
