/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import app from 'state';
import $ from 'jquery';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import Sublayout from '../sublayout';
import { PageLoading } from './loading';
import { CWButton } from '../components/component_kit/cw_button';

class CommunityArtPage extends ClassComponent {
  private imageUrl: string;
  private rawImg: string;

  oninit() {
    this.imageUrl = '';
    this.rawImg = '';
  }

  view() {
    if (!app.chain) {
      return (
        <PageLoading
          message="Connecting to chain"
          title={<BreadcrumbsTitleTag title="Community Art" />}
        />
      );
    }

    return (
      <Sublayout>
        <div class="CommunityArtPage">
          <CWTextInput />
          <CWButton
            label="generate"
            onclick={async () => {
              console.log('Generating..');
              const url = await app.communityImages?.generateImage(
                'A dude staring at a cow',
                app.user.jwt
              );
              this.imageUrl = url;
              m.redraw();
            }}
          />
          <div
            style={`background-image: url(${this.imageUrl}); height: 500px;`}
          ></div>
          <img src={this.rawImg} style={'height: 500px;'}></img>
        </div>
      </Sublayout>
    );
  }
}

export default CommunityArtPage;
