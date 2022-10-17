/* @jsx m */

import m from 'mithril';
import dragula from 'dragula';
import $ from 'jquery';

import 'modals/order_topics_modal.scss';

import app from 'state';
import { Topic } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';

export class OrderTopicsModal implements m.ClassComponent {
  private topics: Array<Topic>;

  private _getTopicFromElement = (
    htmlEle: HTMLElement,
    allTopics: Array<Topic>
  ): Topic => allTopics.find((t: Topic) => t.name.trim() === htmlEle.innerText);

  private _storeNewTopicOrder = (HTMLContainer: HTMLElement) => {
    this.topics = Array.from(HTMLContainer.childNodes).map(
      (node: HTMLElement) => this._getTopicFromElement(node, this.topics)
    );

    this.topics.forEach((t, idx) => {
      t.order = idx + 1;
    });
  };

  oninit() {
    this.topics = app.topics.store
      .getByCommunity(app.chain.id)
      .filter((topic) => topic.featuredInSidebar)
      .map((topic) => ({ ...topic } as Topic));
    // If featured topics have not been re-ordered previously, they may lack
    // an order prop. We auto-generate a temporary order for these topics so
    // they may be properly shuffled.
    if (!this.topics[0].order) {
      this.topics
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((topic, idx) => {
          topic.order = idx + 1;
        });
    } else {
      this.topics.sort((a, b) => a.order - b.order);
    }
  }

  oncreate() {
    dragula([document.querySelector('.featured-topic-list')]).on(
      'drop',
      async (_draggedEle, _targetDiv, sourceDiv) => {
        this._storeNewTopicOrder(sourceDiv);
      }
    );
  }

  view() {
    return (
      <div class="OrderTopicsModal">
        <h3 class="compact-modal-title">Reorder Topics</h3>
        <div class="compact-modal-body">
          <div class="featured-topic-list">
            {this.topics.map((t) => (
              <div class="topic-row">
                <CWText>{t.name}</CWText>
                <CWIcon iconName="hamburger" />
              </div>
            ))}
          </div>
          <CWButton
            onclick={async (e) => {
              e.preventDefault();
              try {
                app.topics.updateFeaturedOrder(this.topics);
                $(e.target).trigger('modalexit');
              } catch (err) {
                notifyError('Failed to update order');
              }
            }}
            label="Save"
          />
        </div>
      </div>
    );
  }
}
