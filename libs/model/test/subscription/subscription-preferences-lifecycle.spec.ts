import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { expect } from 'chai';
import { models } from '../../src/database';
import {
  GetSubscriptionPreferences,
  UpdateSubscriptionPreferences,
} from '../../src/subscription';
import { seed } from '../../src/tester';

describe('Subscription preferences lifecycle', () => {
  let actor: Actor;
  let subPreferences;
  before(async () => {
    const [user] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address_id: null,
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
      id: subPreferences.id,
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
      id: subPreferences.id,
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
      id: subPreferences.id,
      user_id: actor.user.id,
      email_notifications_enabled: false,
      digest_email_enabled: false,
      recap_email_enabled: false,
      mobile_push_notifications_enabled: false,
      mobile_push_discussion_activity_enabled: false,
      mobile_push_admin_alerts_enabled: false,
    });
  });
});
