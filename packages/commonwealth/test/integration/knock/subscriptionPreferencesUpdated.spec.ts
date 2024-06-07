import {
  dispose,
  disposeAdapter,
  EventNames,
  notificationsProvider,
  RepeatFrequency,
  SpyNotificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models, tester } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import z from 'zod';
// eslint-disable-next-line max-len
import { processSubscriptionPreferencesUpdated } from '../../../server/workers/knock/eventHandlers/subscriptionPreferencesUpdated';

chai.use(chaiAsPromised);

describe('subscriptionPreferencesUpdated', () => {
  let sandbox: sinon.SinonSandbox;
  let user: z.infer<typeof schemas.User> | undefined;
  let subPreferences:
    | z.infer<typeof schemas.SubscriptionPreference>
    | undefined;

  before(async () => {
    [user] = await tester.seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
  });

  beforeEach(async () => {
    [subPreferences] = await tester.seed('SubscriptionPreference', {
      // @ts-expect-error StrictNullChecks
      user_id: user.id,
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

    const provider = notificationsProvider();
    disposeAdapter(provider.name);

    if (sandbox) {
      sandbox.restore();
    }
  });

  after(async () => {
    await dispose()();
  });

  it('should delete all exiting email schedules if emails are disabled', async () => {
    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(
      SpyNotificationsProvider(sandbox, {
        getSchedulesStub: sandbox.stub().returns(
          Promise.resolve([
            { id: '1', workflow: WorkflowKeys.EmailRecap },
            { id: '2', workflow: WorkflowKeys.EmailDigest },
          ]),
        ),
        deleteSchedulesStub: sandbox
          .stub()
          .returns(Promise.resolve(new Set(['1', '2']))),
      }),
    );

    const res = await processSubscriptionPreferencesUpdated({
      name: EventNames.SubscriptionPreferencesUpdated,
      payload: {
        // @ts-expect-error StrictNullChecks
        id: subPreferences.id!,
        // @ts-expect-error StrictNullChecks
        user_id: user.id!,
        email_notifications_enabled: false,
        recap_email_enabled: true,
        digest_email_enabled: false,
      },
    });

    expect(res).to.be.true;
    expect((provider.getSchedules as sinon.SinonStub).calledOnce).to.be.true;
    expect(
      (provider.getSchedules as sinon.SinonStub).getCall(0).args[0],
    ).to.deep.equal({
      // @ts-expect-error StrictNullChecks
      user_id: String(user.id!),
    });
    expect((provider.deleteSchedules as sinon.SinonStub).calledOnce).to.be.true;
    expect(
      (provider.deleteSchedules as sinon.SinonStub).getCall(0).args[0],
    ).to.deep.equal({
      schedule_ids: ['1', '2'],
    });
  });

  it('should create schedules if emails are enabled', async () => {
    await models.SubscriptionPreference.update(
      {
        email_notifications_enabled: true,
      },
      {
        where: {
          // @ts-expect-error StrictNullChecks
          id: subPreferences.id!,
        },
      },
    );

    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(
      SpyNotificationsProvider(sandbox, {
        getSchedulesStub: sandbox.stub().returns(Promise.resolve([])),
        createSchedulesStub: sandbox.stub().returns(Promise.resolve({})),
      }),
    );

    const res = await processSubscriptionPreferencesUpdated({
      name: EventNames.SubscriptionPreferencesUpdated,
      payload: {
        // @ts-expect-error StrictNullChecks
        id: subPreferences.id!,
        // @ts-expect-error StrictNullChecks
        user_id: user.id!,
        recap_email_enabled: true,
      },
    });

    expect(res).to.be.true;
    expect((provider.getSchedules as sinon.SinonStub).calledOnce).to.be.true;
    expect((provider.createSchedules as sinon.SinonStub).calledOnce).to.be.true;
    // console.log((provider.createSchedules as sinon.SinonStub).getCall(0).args[0]);
    expect(
      (provider.createSchedules as sinon.SinonStub).getCall(0).args[0].user_ids,
      // @ts-expect-error StrictNullChecks
    ).to.deep.equal([String(user.id!)]);
    expect(
      (provider.createSchedules as sinon.SinonStub).getCall(0).args[0]
        .workflow_id,
    ).to.deep.equal(WorkflowKeys.EmailRecap);
    expect(
      (provider.createSchedules as sinon.SinonStub).getCall(0).args[0].schedule
        .length,
    ).to.equal(1);
    expect(
      (provider.createSchedules as sinon.SinonStub).getCall(0).args[0]
        .schedule[0],
    ).to.have.property('days');
    expect(
      (provider.createSchedules as sinon.SinonStub).getCall(0).args[0]
        .schedule[0],
    ).to.have.property('hours');
    expect(
      (provider.createSchedules as sinon.SinonStub).getCall(0).args[0]
        .schedule[0].frequency,
    ).to.equal(RepeatFrequency.Weekly);
  });

  it('should not create a schedule if one already exists', async () => {
    await models.SubscriptionPreference.update(
      {
        email_notifications_enabled: true,
      },
      {
        where: {
          // @ts-expect-error StrictNullChecks
          id: subPreferences.id!,
        },
      },
    );

    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(
      SpyNotificationsProvider(sandbox, {
        getSchedulesStub: sandbox
          .stub()
          .returns(
            Promise.resolve([{ id: '1', workflow: WorkflowKeys.EmailRecap }]),
          ),
        createSchedulesStub: sandbox.stub().returns(Promise.resolve({})),
      }),
    );

    const res = await processSubscriptionPreferencesUpdated({
      name: EventNames.SubscriptionPreferencesUpdated,
      payload: {
        // @ts-expect-error StrictNullChecks
        id: subPreferences.id!,
        // @ts-expect-error StrictNullChecks
        user_id: user.id!,
        recap_email_enabled: true,
      },
    });

    expect(res).to.be.true;
    expect((provider.createSchedules as sinon.SinonStub).called).to.be.false;
    expect((provider.getSchedules as sinon.SinonStub).calledOnce).to.be.true;
    expect(
      (provider.getSchedules as sinon.SinonStub).getCall(0).args[0],
    ).to.deep.equal({
      // @ts-expect-error StrictNullChecks
      user_id: String(user.id!),
      workflow_id: WorkflowKeys.EmailRecap,
    });
  });

  it('should delete a single schedule even if emails are enabled', async () => {
    await models.SubscriptionPreference.update(
      {
        email_notifications_enabled: true,
      },
      {
        where: {
          // @ts-expect-error StrictNullChecks
          id: subPreferences.id!,
        },
      },
    );

    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(
      SpyNotificationsProvider(sandbox, {
        getSchedulesStub: sandbox
          .stub()
          .returns(
            Promise.resolve([{ id: '1', workflow: WorkflowKeys.EmailRecap }]),
          ),
        createSchedulesStub: sandbox.stub().returns(Promise.resolve({})),
        deleteSchedulesStub: sandbox
          .stub()
          .returns(Promise.resolve(new Set(['1']))),
      }),
    );

    const res = await processSubscriptionPreferencesUpdated({
      name: EventNames.SubscriptionPreferencesUpdated,
      payload: {
        // @ts-expect-error StrictNullChecks
        id: subPreferences.id!,
        // @ts-expect-error StrictNullChecks
        user_id: user.id!,
        recap_email_enabled: false,
      },
    });

    expect(res).to.be.true;
    expect((provider.createSchedules as sinon.SinonStub).called).to.be.false;
    expect((provider.getSchedules as sinon.SinonStub).calledOnce).to.be.true;
    expect(
      (provider.getSchedules as sinon.SinonStub).getCall(0).args[0],
    ).to.deep.equal({
      // @ts-expect-error StrictNullChecks
      user_id: String(user.id!),
      workflow_id: WorkflowKeys.EmailRecap,
    });
    expect(
      (provider.deleteSchedules as sinon.SinonStub).getCall(0).args[0],
    ).to.deep.equal({
      schedule_ids: ['1'],
    });
  });

  it('should not throw if attempting to delete a schedule that does not exist', async () => {
    await models.SubscriptionPreference.update(
      {
        email_notifications_enabled: true,
      },
      {
        where: {
          // @ts-expect-error StrictNullChecks
          id: subPreferences.id!,
        },
      },
    );

    sandbox = sinon.createSandbox();
    const provider = notificationsProvider(
      SpyNotificationsProvider(sandbox, {
        getSchedulesStub: sandbox.stub().returns(Promise.resolve([])),
        createSchedulesStub: sandbox.stub().returns(Promise.resolve({})),
        deleteSchedulesStub: sandbox
          .stub()
          .returns(Promise.resolve(new Set(['1']))),
      }),
    );

    const res = await processSubscriptionPreferencesUpdated({
      name: EventNames.SubscriptionPreferencesUpdated,
      payload: {
        // @ts-expect-error StrictNullChecks
        id: subPreferences.id!,
        // @ts-expect-error StrictNullChecks
        user_id: user.id!,
        recap_email_enabled: false,
      },
    });

    expect(res).to.be.true;
    expect((provider.createSchedules as sinon.SinonStub).called).to.be.false;
    expect((provider.getSchedules as sinon.SinonStub).calledOnce).to.be.true;
    expect(
      (provider.getSchedules as sinon.SinonStub).getCall(0).args[0],
    ).to.deep.equal({
      // @ts-expect-error StrictNullChecks
      user_id: String(user.id!),
      workflow_id: WorkflowKeys.EmailRecap,
    });
    expect((provider.deleteSchedules as sinon.SinonStub).called).to.be.false;
  });
});
