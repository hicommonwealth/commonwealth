import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { SubscriptionPreference } from '@hicommonwealth/schemas';
import { expect } from 'chai';
import z from 'zod';
import { models } from '../../src/database';
import {
  GetSubscriptionPreferences,
  UpdateSubscriptionPreferences,
} from '../../src/subscription';
import { seed } from '../../src/tester';

describe('Subscription preferences lifecycle', () => {
  let actor: Actor;
  let subPreferences: z.infer<typeof SubscriptionPreference> | undefined;
  before(async () => {
    const [user] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address_id: '0x',
    };
  });

  after(async () => {
    await dispose()();
  });

  beforeEach(async () => {
    [subPreferences] = await seed('SubscriptionPreference', {
      user_id: actor.user.id,
      email_notifications_enabled: false,
      digest_email_enabled: false,
      recap_email_enabled: false,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
    });
  });

  afterEach(async () => {
    await models.SubscriptionPreference.truncate({});
    await models.Outbox.truncate({});
  });

  it('should update a single property in subscription preferences', async () => {
    const payload = {
      email_notifications_enabled: true,
    };

    const res = await command(UpdateSubscriptionPreferences(), {
      payload,
      actor,
    });

    expect(res).to.deep.contains({
      id: subPreferences!.id,
      user_id: actor.user.id,
      digest_email_enabled: false,
      recap_email_enabled: false,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
      ...payload,
    });
  });

  it('should update multiple properties in subscription preferences', async () => {
    const payload = {
      email_notifications_enabled: true,
      digest_email_enabled: true,
    };

    const res = await command(UpdateSubscriptionPreferences(), {
      payload,
      actor,
    });

    expect(res).to.deep.contains({
      id: subPreferences!.id,
      user_id: actor.user.id,
      recap_email_enabled: false,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
      ...payload,
    });
  });

  it('should get subscription preferences', async () => {
    const res = await query(GetSubscriptionPreferences(), {
      actor,
      payload: {},
    });

    expect(res).to.deep.contains({
      id: subPreferences!.id,
      user_id: actor.user.id,
      email_notifications_enabled: false,
      digest_email_enabled: false,
      recap_email_enabled: false,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
    });
  });

  it('should not throw if the subscription preference does not', async () => {
    const numDeleted = await models.SubscriptionPreference.destroy({
      where: { user_id: actor.user.id },
    });
    expect(numDeleted).to.equal(1);
    const res = await query(GetSubscriptionPreferences(), {
      actor,
      payload: {},
    });
    expect(res).to.deep.equal({});
  });

  it.skip('should emit a SubscriptionPreferencesUpdated event if emails are enabled', async () => {
    const payload = {
      email_notifications_enabled: true,
    };

    const res = await command(UpdateSubscriptionPreferences(), {
      payload,
      actor,
    });

    expect(res).to.deep.contains({
      id: subPreferences!.id,
      user_id: actor.user.id,
      digest_email_enabled: false,
      recap_email_enabled: false,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
      ...payload,
    });

    const event = await models.Outbox.findAll();
    expect(event[0]).to.exist;
    expect(event[0]!.event_payload).to.deep.equal({
      id: subPreferences!.id,
      user_id: actor.user.id,
      email_notifications_enabled: true,
    });
  });

  it.skip('should emit a SubscriptionPreferencesUpdated event if recap emails are enabled', async () => {
    const payload = {
      email_notifications_enabled: true,
      recap_email_enabled: true,
    };

    const res = await command(UpdateSubscriptionPreferences(), {
      payload,
      actor,
    });

    expect(res).to.deep.contains({
      id: subPreferences!.id,
      user_id: actor.user.id,
      digest_email_enabled: false,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
      ...payload,
    });

    const event = await models.Outbox.findAll();
    expect(event[0]).to.exist;
    expect(event[0]!.event_payload).to.deep.equal({
      id: subPreferences!.id,
      user_id: actor.user.id,
      email_notifications_enabled: true,
      recap_email_enabled: true,
    });
  });

  it.skip('should emit a SubscriptionPreferencesUpdated event if emails are disabled', async () => {
    await models.SubscriptionPreference.update(
      { email_notifications_enabled: true },
      {
        where: {
          id: subPreferences!.id,
        },
      },
    );

    const payload = {
      email_notifications_enabled: false,
    };

    const res = await command(UpdateSubscriptionPreferences(), {
      payload,
      actor,
    });

    expect(res).to.deep.contains({
      id: subPreferences!.id,
      user_id: actor.user.id,
      digest_email_enabled: false,
      recap_email_enabled: false,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
      ...payload,
    });

    const event = await models.Outbox.findAll();
    expect(event[0]).to.exist;
    expect(event[0]!.event_payload).to.deep.equal({
      id: subPreferences!.id,
      user_id: actor.user.id,
      email_notifications_enabled: false,
    });
  });

  it.skip('should emit a SubscriptionPreferencesUpdated event if recap emails are disabled', async () => {
    await models.SubscriptionPreference.update(
      { recap_email_enabled: true },
      {
        where: {
          id: subPreferences!.id,
        },
      },
    );

    const payload = {
      recap_email_enabled: false,
    };

    const res = await command(UpdateSubscriptionPreferences(), {
      payload,
      actor,
    });

    expect(res).to.deep.contains({
      id: subPreferences!.id,
      user_id: actor.user.id,
      digest_email_enabled: false,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
      ...payload,
    });

    const event = await models.Outbox.findAll();
    expect(event[0]).to.exist;
    expect(event[0]!.event_payload).to.deep.equal({
      id: subPreferences!.id,
      user_id: actor.user.id,
      recap_email_enabled: false,
    });
  });

  it.skip('should emit a SubscriptionPreferencesUpdated event if both emails are disabled', async () => {
    await models.SubscriptionPreference.update(
      {
        recap_email_enabled: true,
        digest_email_enabled: true,
      },
      {
        where: {
          id: subPreferences!.id,
        },
      },
    );

    const payload = {
      email_notifications_enabled: true,
      recap_email_enabled: false,
      digest_email_enabled: false,
    };

    const res = await command(UpdateSubscriptionPreferences(), {
      payload,
      actor,
    });

    expect(res).to.deep.contains({
      id: subPreferences!.id,
      user_id: actor.user.id,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
      ...payload,
    });

    const event = await models.Outbox.findAll();
    expect(event[0]).to.exist;
    expect(event[0]!.event_payload).to.deep.equal({
      id: subPreferences!.id,
      user_id: actor.user.id,
      email_notifications_enabled: true,
      recap_email_enabled: false,
      digest_email_enabled: false,
    });
  });
});
