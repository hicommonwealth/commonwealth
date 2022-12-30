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
import { CWSpinner } from '../components/component_kit/cw_spinner';

class CommunityArtPage extends ClassComponent {
  private imageUrl: string;
  private prompt: string;
  private generatingImage: boolean;

  oninit() {
    this.imageUrl = '';
    this.generatingImage = false;
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
          <CWTextInput
            placeholder="Enter a prompt"
            oninput={(e) => {
              this.prompt = e.target.value;
            }}
          />
          <CWButton
            label="generate"
            onclick={async () => {
              if (this.prompt.length === 0) return;
              try {
                this.generatingImage = true;
                const imageUrl = await app.communityImages?.generateImage(
                  this.prompt,
                  app.activeChainId()
                );
                this.imageUrl = imageUrl;
                m.redraw();
              } catch (e) {
                console.log(e);
              }
              this.generatingImage = false;
            }}
          />
          {this.generatingImage && <CWSpinner />}
          <div
            style={`background-image: url(${this.imageUrl}); background-size: contain;
            background-repeat: no-repeat;
            background-position: center; height: 500px; width: 500px`}
          ></div>
        </div>
      </Sublayout>
    );
  }
}

export default CommunityArtPage;
