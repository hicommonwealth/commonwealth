/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import * as Cui from 'construct-ui';

import app from 'state';
import { RolePermission, Webhook } from 'models';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import WebhookSettingsModal from 'views/modals/webhook_settings_modal';
import { link, pluralize } from 'helpers';

type WebhooksFormAttrs = {
  webhooks: Webhook[];
};

class WebhooksForm implements m.ClassComponent<WebhooksFormAttrs> {
  private disabled: boolean;
  private failure: boolean;
  private success: boolean;

  view(vnode) {
    const { webhooks } = vnode.attrs;
    const chainOrCommObj = { chain: app.activeChainId() };

    const createWebhook = (e) => {
      e.preventDefault();
      const $webhookInput = $(e.target)
        .closest('form')
        .find('[name="webhookUrl"]');
      const webhookUrl = $webhookInput.val();
      if (webhookUrl === null) return;

      this.disabled = true;
      this.success = false;
      this.failure = false;

      // TODO: Change to POST /webhook
      $.post(`${app.serverUrl()}/createWebhook`, {
        ...chainOrCommObj,
        webhookUrl,
        auth: true,
        jwt: app.user.jwt,
      }).then(
        (result) => {
          this.disabled = false;
          if (result.status === 'Success') {
            this.success = true;
            const newWebhook = Webhook.fromJSON(result.result);
            vnode.attrs.webhooks.push(newWebhook);
            app.modals.create({
              modal: WebhookSettingsModal,
              data: {
                webhook: newWebhook,
                updateSuccessCallback: (webhook) => {
                  const idx = vnode.attrs.webhooks.findIndex(
                    (wh) => wh.id === webhook.id
                  );
                  vnode.attrs.webhooks[idx].categories = webhook.categories;
                },
              },
            });
            $webhookInput.val('');
          } else {
            this.failure = true;
            notifyError(result.message);
          }
          m.redraw();
        },
        (err) => {
          this.failure = true;
          this.disabled = false;
          notifyError(err?.responseJSON?.error || 'Unknown error');
          m.redraw();
        }
      );
    };

    return (
      <Cui.Form class="WebhooksForm">
        <Cui.FormGroup>
          <Cui.List interactive={false} class="active-webhooks">
            {webhooks.map((webhook) => {
              const label =
                webhook.url.indexOf('discord') !== -1
                  ? 'Discord'
                  : webhook.url.indexOf('slack') !== -1
                  ? 'Slack'
                  : null;
              return (
                <Cui.ListItem
                  contentLeft={
                    <>
                      <div class="top" style="display: block;">
                        {webhook.url}
                      </div>
                      <div class="bottom">
                        {label && <Cui.Tag size="xs" label={label} />}
                        <Cui.Button
                          class="settings-button"
                          iconRight={Cui.Icons.SETTINGS}
                          rounded={true}
                          onclick={(e) => {
                            e.preventDefault();
                            app.modals.create({
                              modal: WebhookSettingsModal,
                              data: {
                                webhook,
                                updateSuccessCallback: (wh) => {
                                  const idx = vnode.attrs.webhooks.findIndex(
                                    (wh2) => wh2.id === wh.id
                                  );
                                  vnode.attrs.webhooks[idx].categories =
                                    wh.categories;
                                },
                              },
                            });
                          }}
                        />
                        <Cui.Tag
                          size="xs"
                          label={pluralize(webhook.categories.length, 'event')}
                        />
                      </div>
                    </>
                  }
                  contentRight={
                    <Cui.Icon
                      name={Cui.Icons.X}
                      class={this.disabled ? 'disabled' : ''}
                      onclick={(e) => {
                        e.preventDefault();
                        this.disabled = true;
                        this.success = false;
                        this.failure = false;
                        // TODO: Change to DELETE /webhook
                        $.post(`${app.serverUrl()}/deleteWebhook`, {
                          ...chainOrCommObj,
                          webhookUrl: webhook.url,
                          auth: true,
                          jwt: app.user.jwt,
                        }).then(
                          (result) => {
                            this.disabled = false;
                            if (result.status === 'Success') {
                              const idx = vnode.attrs.webhooks.findIndex(
                                (w) => w.url === webhook.url
                              );
                              if (idx !== -1)
                                vnode.attrs.webhooks.splice(idx, 1);
                              this.success = true;
                              notifySuccess('Success! Webhook deleted');
                            } else {
                              this.failure = true;
                              notifyError(result.message);
                            }
                            m.redraw();
                          },
                          (err) => {
                            this.failure = true;
                            this.disabled = false;
                            notifyError(
                              err?.responseJSON?.error || 'Unknown error'
                            );
                            m.redraw();
                          }
                        );
                      }}
                    />
                  }
                />
              );
            })}
            {webhooks.length === 0 && (
              <Cui.ListItem
                contentLeft={`No webhooks yet. Slack, Discord, and Telegram webhooks are
                    supported. For more information and examples for setting
                    these up, please view our ${link(
                      'a',
                      'https://docs.commonwealth.im',
                      ['documentation.']
                    )}`}
              />
            )}
          </Cui.List>
        </Cui.FormGroup>
        <Cui.FormGroup>
          <Cui.Input
            name="webhookUrl"
            id="webhookUrl"
            autocomplete="off"
            placeholder="https://hooks.slack.com/services/"
          />
          <Cui.Button
            class="admin-panel-tab-button"
            intent="none"
            label="Add webhook"
            style="margin: 10px 0"
            onclick={createWebhook}
            rounded={true}
          />
        </Cui.FormGroup>
      </Cui.Form>
    );
  }
}

type UpgradeRolesFormAttrs = {
  onRoleUpgrade: (oldRole: string, newRole: string) => void;
  roleData: any[];
};

class UpgradeRolesForm implements m.ClassComponent<UpgradeRolesFormAttrs> {
  private role: string;
  private user: string;

  view(vnode) {
    const { roleData, onRoleUpgrade } = vnode.attrs;

    const noAdmins = roleData.filter((role) => {
      return (
        role.permission === RolePermission.member ||
        role.permission === RolePermission.moderator
      );
    });

    const names: string[] = noAdmins.map((role) => {
      const displayName = app.profiles.getProfile(
        role.Address.chain,
        role.Address.address
      ).displayName;
      const roletext = role.permission === 'moderator' ? '(moderator)' : '';
      return `${displayName}: ${role.Address.address.slice(
        0,
        6
      )}...${roletext}`;
    });

    const chainOrCommObj = { chain: app.activeChainId() };

    return (
      <div class="UpgradeRolesForm">
        <Cui.RadioGroup
          name="members/mods"
          class="members-list"
          options={names}
          value={this.user}
          onchange={(e: Event) => {
            this.user = (e.currentTarget as HTMLInputElement).value;
          }}
        />
        <div class="upgrade-buttons-wrap">
          <Cui.RadioGroup
            name="roles"
            options={['Admin', 'Moderator']}
            value={this.role}
            onchange={(e: Event) => {
              this.role = (e.currentTarget as HTMLInputElement).value;
            }}
          />
          <div class="button-container">
            <Cui.Button
              class="admin-panel-tab-button"
              label="Upgrade Member"
              disabled={!this.role || !this.user}
              onclick={() => {
                const indexOfName = names.indexOf(this.user);
                const user = noAdmins[indexOfName];
                const newRole =
                  this.role === 'Admin'
                    ? 'admin'
                    : this.role === 'Moderator'
                    ? 'moderator'
                    : '';
                if (!user) return;
                if (!newRole) return;
                $.post(`${app.serverUrl()}/upgradeMember`, {
                  new_role: newRole,
                  address: user.Address.address,
                  ...chainOrCommObj,
                  jwt: app.user.jwt,
                }).then((r) => {
                  if (r.status === 'Success') {
                    notifySuccess('Member upgraded');
                    delete this.user;
                    delete this.role;
                    m.redraw();
                  } else {
                    notifyError('Upgrade failed');
                  }
                  onRoleUpgrade(user, r.result);
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

type AdminPanelTabsAttrs = {
  defaultTab: number;
  onRoleUpgrade: (oldRole: string, newRole: string) => void;
  roleData: any[];
  webhooks: Webhook[];
};

export class AdminPanelTabs implements m.ClassComponent<AdminPanelTabsAttrs> {
  private index: number;

  oninit(vnode) {
    this.index = vnode.attrs.defaultTab;
  }

  view(vnode) {
    return (
      <div class="AdminPanelTabs">
        <Cui.Tabs align="left" bordered={true} fluid={true}>
          <Cui.TabItem
            label="Webhooks"
            active={this.index === 2}
            onclick={() => {
              this.index = 2;
            }}
          />
          <Cui.TabItem
            label="Admins"
            active={this.index === 1}
            onclick={() => {
              this.index = 1;
            }}
          />
        </Cui.Tabs>
        {this.index === 1 && (
          <UpgradeRolesForm
            roleData={vnode.attrs.roleData}
            onRoleUpgrade={(x, y) => vnode.attrs.onRoleUpgrade(x, y)}
          />
        )}
        {this.index === 2 && <WebhooksForm webhooks={vnode.attrs.webhooks} />}
      </div>
    );
  }
}
