/* @jsx m */

import ClassComponent from 'class_component';
import { notifyError } from 'controllers/app/notifications';
import $ from 'jquery';
import m from 'mithril';

import 'modals/unified_user_flow_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import type { ValidationStatus } from '../components/component_kit/cw_validation_text';

class EntryPage extends ClassComponent<{
  onCancel: () => void;
  onSave: () => void;
}> {
  private displayNameValue = '';
  private validatedName = false;
  view(vnode) {
    const { onSave, onCancel } = vnode.attrs;

    return (
      <div class="EntryModal">
        <div class="Header">
          <CWText type="caption" fontWeight="bold">
            INTRODUCING
          </CWText>
          <CWText type="h3" fontWeight="bold">
            Unified User Profiles
          </CWText>
        </div>
        <div class="Description">
          <CWText type="b1">
            With this update you'll have a single display name across all your
            communities, making it easier to connect and engage with others.
          </CWText>
          <CWText type="b1" className="bold-section">
            This change will go into effect
            <span class="bold"> March 9th, 2023. </span>
            To prepare, provide a display name below.
          </CWText>
        </div>
        <div class="Inputs">
          <CWTextInput
            placeholder="ex: Common Cow"
            value={this.displayNameValue}
            oninput={(e) => {
              this.displayNameValue = e.target.value;
            }}
            label="Display Name"
            inputValidationFn={(val: string): [ValidationStatus, string] => {
              // eslint-disable-next-line no-useless-escape
              const regex = /^([a-zA-Z0-9 \_\-]+)$/;

              if (regex.test(val)) {
                this.validatedName = true;
                return ['success', 'Success!'];
              } else {
                this.validatedName = false;
                return [
                  'failure',
                  'Only numbers, letters, underscores, spaces, & dashes.',
                ];
              }
            }}
          />
        </div>
        <div class="Callout">
          <CWText className="bold-section">
            Please note that your current activity and actions
            <span class="bold"> will not </span>
            be erased. Only your current profile name will be replaced by your
            new display name.
          </CWText>
        </div>
        <div class="MoreInfo">
          <CWText>Want a deeper understanding of this change?</CWText>
          <div class="learn-more">
            <CWText
              className="blue-text"
              onclick={() => {
                window.open(
                  'https://commonwealth.ghost.io/p/7f623d2d-3926-4db5-b154-b36c545c5baf/',
                  '_blank'
                );
              }}
            >
              Learn more
            </CWText>
            <CWIcon iconName="blueExternalLink" iconSize="small" />
          </div>
        </div>
        <div class="ButtonRow">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onclick={() => {
              onCancel();
            }}
          />
          <CWButton
            buttonType="primary-black"
            label="Save"
            disabled={!this.validatedName || this.displayNameValue.length === 0}
            onclick={async () => {
              try {
                const res = await $.post(
                  `${app.serverUrl()}/updateProfile/v2`,
                  {
                    name: this.displayNameValue,
                    jwt: app.user.jwt,
                  }
                );
                onSave();
              } catch (e) {
                notifyError('Error updating profile. Please try again later.');
              }
            }}
          />
        </div>
      </div>
    );
  }
}

class Alert extends ClassComponent<{
  onClose: () => void;
  onSetUsername: () => void;
}> {
  view(vnode) {
    const { onClose, onSetUsername } = vnode.attrs;

    return (
      <div class="AlertDangerModal">
        <div class="Header">
          <CWIcon iconName="cautionCircle" size="large" />
          <CWText type="h4" fontWeight="bold">
            Important
          </CWText>
        </div>
        <div class="Description">
          <CWText type="b1">
            No display name has been provided. Please note that if you do not
            provide a display name, the following will occur.
          </CWText>
        </div>
        <div class="Callout">
          <CWText fontWeight="bold">One Profile</CWText>
          <CWText>
            If you have only one profile, your current profile name will be
            automatically used as your default display name.
          </CWText>
        </div>
        <div class="Callout">
          <CWText fontWeight="bold">Multipe Profiles</CWText>
          <CWText>
            If you have multiple profiles and you don't specify a display name,
            each of your profiles will be converted to different accounts. This
            means that you will no longer have access to all of your profiles
            under a single account.
          </CWText>
        </div>
        <div class="Description">
          <CWText type="b1">
            To avoid any confusion or inconvenience, please make sure to provide
            a unique and memorable display name when prompted. Thank you for
            your cooperation.
          </CWText>
        </div>
        <div class="MoreInfo">
          <CWText>Want a deeper understanding of this change?</CWText>

          <div class="learn-more">
            <CWText
              className="blue-text"
              onclick={() => {
                window.open(
                  'https://commonwealth.ghost.io/p/7f623d2d-3926-4db5-b154-b36c545c5baf/',
                  '_blank'
                );
              }}
            >
              Learn more
            </CWText>
            <CWIcon iconName="blueExternalLink" iconSize="small" />
          </div>
        </div>
        <div class="ButtonRow">
          <CWButton
            buttonType="secondary-red"
            label="Close"
            onclick={() => {
              onClose();
            }}
          />
          <CWButton
            buttonType="primary-black"
            label="Set display name"
            onclick={() => {
              onSetUsername();
            }}
          />
        </div>
      </div>
    );
  }
}

class Success extends ClassComponent<{ onClose: () => void }> {
  view(vnode) {
    const { onClose } = vnode.attrs;

    return (
      <div class="SuccessProfileModal">
        <div class="Header">
          <CWText type="h4" fontWeight="bold">
            🎉 Success!
          </CWText>
        </div>
        <div class="Description">
          <CWText type="b1" className="bold-section">
            Great news! You've just submitted your new display name. Starting
            <span class="bold"> March 9th</span>, your current profile name will
            be replaced with the display name you provided.
          </CWText>
        </div>

        <div class="ButtonRow">
          <CWButton
            buttonType="primary-black"
            label="Close"
            onclick={() => {
              onClose();
            }}
          />
        </div>
      </div>
    );
  }
}

type UnifiedUserFlowModalAttrs = {};

type modalStages = 'entry-page' | 'alert' | 'success';

export class UnifiedUserFlowModal extends ClassComponent<UnifiedUserFlowModalAttrs> {
  private modalStage: modalStages = 'entry-page';

  view(vnode) {
    return (
      <div class="UnifiedUserFlowModal">
        {this.modalStage === 'entry-page' && (
          <EntryPage
            onCancel={() => {
              this.modalStage = 'alert';
              m.redraw();
            }}
            onSave={() => {
              this.modalStage = 'success';
              m.redraw();
            }}
          />
        )}
        {this.modalStage === 'alert' && (
          <Alert
            onSetUsername={() => {
              this.modalStage = 'entry-page';
              m.redraw();
            }}
            onClose={() => {
              $('.UnifiedUserFlowModal').trigger('modalexit');
            }}
          />
        )}
        {this.modalStage === 'success' && (
          <Success
            onClose={() => {
              $('.UnifiedUserFlowModal').trigger('modalexit');
            }}
          />
        )}
      </div>
    );
  }
}
