/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';
import $ from 'jquery';

import 'pages/feed/index.scss';

import app from 'state';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';

class FeedPage extends ClassComponent {
  private isLoading: boolean;

  private getGlobalFeed = async () => {
    try {
      const result = await $.post(`${app.serverUrl()}/viewGlobalActivity`);
      console.log('global feed', result);
    } catch (err) {
      console.log('error', err);
    }
  }

  oninit() {
    this.isLoading = true;
    this.getGlobalFeed();
    this.isLoading = false;
  }

  view() {
    if (this.isLoading) {
      return <PageLoading />;
    }

    return (
      <Sublayout>
        <div class="FeedPage">
          Feed
        </div>
      </Sublayout>
    );
  }
}

export default FeedPage;
