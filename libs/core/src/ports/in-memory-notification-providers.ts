import {
  NotificationsProvider,
  NotificationsProviderGetMessagesReturn,
  NotificationsProviderSchedulesReturn,
} from '@hicommonwealth/core';
import { Mock, vi } from 'vitest';

export function SpyNotificationsProvider(stubs?: {
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
  };
}

export const ProviderError = new Error('some error');

export function ThrowingSpyNotificationsProvider(stubs?: {
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
    name: 'ThrowingNotificationsProvider',
    dispose: vi.fn(() => Promise.resolve()),
    triggerWorkflow:
      stubs?.triggerWorkflowStub || vi.fn(() => Promise.reject(ProviderError)),
    getMessages:
      stubs?.getMessagesStub || vi.fn(() => Promise.reject(ProviderError)),
    getSchedules:
      stubs?.getSchedulesStub || vi.fn(() => Promise.reject(ProviderError)),
    createSchedules:
      stubs?.createSchedulesStub || vi.fn(() => Promise.reject(ProviderError)),
    deleteSchedules:
      stubs?.deleteSchedulesStub || vi.fn(() => Promise.reject(ProviderError)),
    identifyUser:
      stubs?.identifyUserStub || vi.fn(() => Promise.reject(ProviderError)),
    registerClientRegistrationToken:
      stubs?.registerClientRegistrationToken ||
      vi.fn(() => Promise.reject(ProviderError)),
    unregisterClientRegistrationToken:
      stubs?.unregisterClientRegistrationToken ||
      vi.fn(() => Promise.reject(ProviderError)),
  };
}
