import {
  dispose,
  disposeAdapter,
  NotificationsProvider,
  notificationsProvider,
  NotificationsProviderGetMessagesReturn,
  NotificationsProviderSchedulesReturn,
  RepeatFrequency,
  WorkflowKeys,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vi,
} from 'vitest';
import z from 'zod';
// eslint-disable-next-line max-len
import { models } from '@hicommonwealth/model/db';
import * as tester from '@hicommonwealth/model/tester';
import { processSubscriptionPreferencesUpdated } from '../../../server/workers/knock/subscriptionPreferencesUpdated';

function SpyNotificationsProvider(stubs?: {
  triggerWorkflowStub?: Mock<
    [],
    Promise<PromiseSettledResult<{ workflow_run_id: string }>[]>
  >;
  getMessagesStub?: Mock<[], Promise<NotificationsProviderGetMessagesReturn>>;
  getSchedulesStub?: Mock<[], Promise<NotificationsProviderSchedulesReturn>>;
  createSchedulesStub?: Mock<[], Promise<NotificationsProviderSchedulesReturn>>;
  deleteSchedulesStub?: Mock<[], Promise<Set<string>>>;
  identifyUserStub?: Mock<[], Promise<{ id: string }>>;
  registerClientRegistrationToken?: Mock<[], Promise<boolean>>;
  unregisterClientRegistrationToken?: Mock<[], Promise<boolean>>;
}): NotificationsProvider {
  return {
    name: 'SpyNotificationsProvider',
    dispose: vi.fn(() => Promise.resolve()),
    triggerWorkflow:
      stubs?.triggerWorkflowStub || vi.fn(() => Promise.resolve([])),
    getMessages: stubs?.getMessagesStub || vi.fn(() => Promise.resolve([])),
    getSchedules: stubs?.getSchedulesStub || vi.fn(() => Promise.resolve([])),
    createSchedules:
      stubs?.createSchedulesStub || vi.fn(() => Promise.resolve([])),
    deleteSchedules:
      stubs?.deleteSchedulesStub || vi.fn(() => Promise.resolve(new Set())),
    identifyUser:
      stubs?.identifyUserStub || vi.fn(() => Promise.resolve({ id: '' })),
    registerClientRegistrationToken:
      stubs?.registerClientRegistrationToken ||
      vi.fn(() => Promise.resolve(true)),
    unregisterClientRegistrationToken:
      stubs?.unregisterClientRegistrationToken ||
      vi.fn(() => Promise.resolve(true)),
    signUserToken: vi.fn(() => Promise.resolve(undefined)),
  };
}

// TODO: this should be in libs/model, but currently depending on libs/adapter for config
describe('subscriptionPreferencesUpdated', () => {
  let user: z.infer<typeof schemas.User> | undefined;

  beforeAll(async () => {
    [user] = await tester.seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
  });

  beforeEach(async () => {
    await tester.seed('SubscriptionPreference', {
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

    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should delete all exiting email schedules if emails are disabled', async () => {
    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider({
        getSchedulesStub: vi.fn().mockResolvedValue([
          { id: '1', workflow: WorkflowKeys.EmailRecap },
          { id: '2', workflow: WorkflowKeys.EmailDigest },
        ]),
        deleteSchedulesStub: vi.fn().mockResolvedValue(new Set(['1', '2'])),
      }),
    });

    const res = await processSubscriptionPreferencesUpdated({
      id: 0,
      name: 'SubscriptionPreferencesUpdated',
      payload: {
        user_id: user!.id!,
        email_notifications_enabled: false,
        recap_email_enabled: true,
        digest_email_enabled: false,
      },
    });

    expect(res).to.be.true;
    expect(provider.getSchedules as Mock).toHaveBeenCalledOnce();
    expect((provider.getSchedules as Mock).mock.calls[0][0]).to.deep.equal({
      // @ts-expect-error StrictNullChecks
      user_id: String(user.id!),
    });
    expect(provider.deleteSchedules as Mock).toHaveBeenCalledOnce();
    expect((provider.deleteSchedules as Mock).mock.calls[0][0]).to.deep.equal({
      schedule_ids: ['1', '2'],
    });
  });

  test('should create schedules if emails are enabled', async () => {
    await models.SubscriptionPreference.update(
      {
        email_notifications_enabled: true,
      },
      {
        where: {
          user_id: user!.id!,
        },
      },
    );

    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider({
        getSchedulesStub: vi.fn().mockResolvedValue([]),
        createSchedulesStub: vi.fn().mockResolvedValue({}),
      }),
    });

    const res = await processSubscriptionPreferencesUpdated({
      id: 0,
      name: 'SubscriptionPreferencesUpdated',
      payload: {
        user_id: user!.id!,
        recap_email_enabled: true,
      },
    });

    expect(res).to.be.true;
    expect(provider.getSchedules as Mock).toHaveBeenCalledOnce();
    expect(provider.createSchedules as Mock).toHaveBeenCalledOnce();
    // console.log((provider.createSchedules as Mock)).mock.calls[0][0]);
    expect(
      (provider.createSchedules as Mock).mock.calls[0][0].user_ids,
      // @ts-expect-error StrictNullChecks
    ).to.deep.equal([String(user.id!)]);
    expect(
      (provider.createSchedules as Mock).mock.calls[0][0].workflow_id,
    ).to.deep.equal(WorkflowKeys.EmailRecap);
    expect(
      (provider.createSchedules as Mock).mock.calls[0][0].schedule.length,
    ).to.equal(1);
    expect(
      (provider.createSchedules as Mock).mock.calls[0][0].schedule[0],
    ).to.have.property('days');
    expect(
      (provider.createSchedules as Mock).mock.calls[0][0].schedule[0],
    ).to.have.property('hours');
    expect(
      (provider.createSchedules as Mock).mock.calls[0][0].schedule[0].frequency,
    ).to.equal(RepeatFrequency.Weekly);
  });

  test('should not create a schedule if one already exists', async () => {
    await models.SubscriptionPreference.update(
      {
        email_notifications_enabled: true,
      },
      {
        where: {
          user_id: user!.id!,
        },
      },
    );

    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider({
        getSchedulesStub: vi
          .fn()
          .mockResolvedValue([{ id: '1', workflow: WorkflowKeys.EmailRecap }]),
        createSchedulesStub: vi.fn().mockResolvedValue({}),
      }),
    });

    const res = await processSubscriptionPreferencesUpdated({
      id: 0,
      name: 'SubscriptionPreferencesUpdated',
      payload: {
        user_id: user!.id!,
        recap_email_enabled: true,
      },
    });

    expect(res).to.be.true;
    expect(provider.createSchedules as Mock).not.toHaveBeenCalled();
    expect(provider.getSchedules as Mock).toHaveBeenCalledOnce();
    expect((provider.getSchedules as Mock).mock.calls[0][0]).to.deep.equal({
      user_id: String(user!.id!),
      workflow_id: WorkflowKeys.EmailRecap,
    });
  });

  test('should delete a single schedule even if emails are enabled', async () => {
    await models.SubscriptionPreference.update(
      {
        email_notifications_enabled: true,
      },
      {
        where: {
          user_id: user!.id!,
        },
      },
    );

    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider({
        getSchedulesStub: vi
          .fn()
          .mockResolvedValue([{ id: '1', workflow: WorkflowKeys.EmailRecap }]),
        createSchedulesStub: vi.fn().mockResolvedValue({}),
        deleteSchedulesStub: vi.fn().mockResolvedValue(new Set(['1'])),
      }),
    });

    const res = await processSubscriptionPreferencesUpdated({
      id: 0,
      name: 'SubscriptionPreferencesUpdated',
      payload: {
        user_id: user!.id!,
        recap_email_enabled: false,
      },
    });

    expect(res).to.be.true;
    expect(provider.createSchedules as Mock).not.toHaveBeenCalled();
    expect(provider.getSchedules as Mock).toHaveBeenCalledOnce();
    expect((provider.getSchedules as Mock).mock.calls[0][0]).to.deep.equal({
      user_id: String(user!.id!),
      workflow_id: WorkflowKeys.EmailRecap,
    });
    expect((provider.deleteSchedules as Mock).mock.calls[0][0]).to.deep.equal({
      schedule_ids: ['1'],
    });
  });

  test('should not throw if attempting to delete a schedule that does not exist', async () => {
    await models.SubscriptionPreference.update(
      {
        email_notifications_enabled: true,
      },
      {
        where: {
          user_id: user!.id!,
        },
      },
    );

    const provider = notificationsProvider({
      adapter: SpyNotificationsProvider({
        getSchedulesStub: vi.fn().mockResolvedValue([]),
        createSchedulesStub: vi.fn().mockResolvedValue({}),
        deleteSchedulesStub: vi.fn().mockResolvedValue(new Set(['1'])),
      }),
    });

    const res = await processSubscriptionPreferencesUpdated({
      id: 0,
      name: 'SubscriptionPreferencesUpdated',
      payload: {
        user_id: user!.id!,
        recap_email_enabled: false,
      },
    });

    expect(res).to.be.true;
    expect(provider.createSchedules as Mock).not.toHaveBeenCalled();
    expect(provider.getSchedules as Mock).toHaveBeenCalled();
    expect((provider.getSchedules as Mock).mock.calls[0][0]).to.deep.equal({
      // @ts-expect-error StrictNullChecks
      user_id: String(user.id!),
      workflow_id: WorkflowKeys.EmailRecap,
    });
    expect(provider.deleteSchedules as Mock).not.toHaveBeenCalled();
  });
});
