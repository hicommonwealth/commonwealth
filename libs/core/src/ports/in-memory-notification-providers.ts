import { NotificationsProvider } from '@hicommonwealth/core';
import { Mock, vi } from 'vitest';

export function SpyNotificationsProvider(stubs?: {
  triggerWorkflowStub?: Mock<[], Promise<any>>;
  getMessagesStub?: Mock<[], Promise<any[]>>;
  getSchedulesStub?: Mock<[], Promise<any[]>>;
  createSchedulesStub?: Mock<[], Promise<any[]>>;
  deleteSchedulesStub?: Mock<[], Promise<Set<string>>>;
  identifyUserStub?: Mock<[], Promise<{ id: string }>>;
  registerClientRegistrationToken?: Mock<[], Promise<boolean>>;
  unregisterClientRegistrationToken?: Mock<[], Promise<boolean>>;
}): NotificationsProvider {
  return {
    name: 'SpyNotificationsProvider',
    dispose: vi.fn((): Promise<void> => Promise.resolve()),
    triggerWorkflow:
      stubs?.triggerWorkflowStub ||
      vi.fn((): Promise<any> => Promise.resolve([])),
    getMessages:
      stubs?.getMessagesStub ||
      vi.fn((): Promise<any[]> => Promise.resolve([])),
    getSchedules:
      stubs?.getSchedulesStub ||
      vi.fn((): Promise<any[]> => Promise.resolve([])),
    createSchedules:
      stubs?.createSchedulesStub ||
      vi.fn((): Promise<any[]> => Promise.resolve([])),
    deleteSchedules:
      stubs?.deleteSchedulesStub ||
      vi.fn((): Promise<Set<string>> => Promise.resolve(new Set())),
    identifyUser:
      stubs?.identifyUserStub ||
      vi.fn((): Promise<{ id: string }> => Promise.resolve({ id: '' })),
    registerClientRegistrationToken:
      stubs?.registerClientRegistrationToken ||
      vi.fn((): Promise<boolean> => Promise.resolve(true)),
    unregisterClientRegistrationToken:
      stubs?.unregisterClientRegistrationToken ||
      vi.fn((): Promise<boolean> => Promise.resolve(true)),
  };
}

export const ProviderError = new Error('some error');

export function ThrowingSpyNotificationsProvider(stubs?: {
  triggerWorkflowStub?: Mock<[], Promise<any>>;
  getMessagesStub?: Mock<[], Promise<any[]>>;
  getSchedulesStub?: Mock<[], Promise<any[]>>;
  createSchedulesStub?: Mock<[], Promise<any[]>>;
  deleteSchedulesStub?: Mock<[], Promise<Set<string>>>;
  identifyUserStub?: Mock<[], Promise<{ id: string }>>;
  registerClientRegistrationToken?: Mock<[], Promise<boolean>>;
  unregisterClientRegistrationToken?: Mock<[], Promise<boolean>>;
}): NotificationsProvider {
  return {
    name: 'ThrowingNotificationsProvider',
    dispose: vi.fn((): Promise<void> => Promise.resolve()),
    triggerWorkflow:
      stubs?.triggerWorkflowStub ||
      vi.fn((): Promise<any> => Promise.reject(ProviderError)),
    getMessages:
      stubs?.getMessagesStub ||
      vi.fn((): Promise<any[]> => Promise.reject(ProviderError)),
    getSchedules:
      stubs?.getSchedulesStub ||
      vi.fn((): Promise<any[]> => Promise.reject(ProviderError)),
    createSchedules:
      stubs?.createSchedulesStub ||
      vi.fn((): Promise<any[]> => Promise.reject(ProviderError)),
    deleteSchedules:
      stubs?.deleteSchedulesStub ||
      vi.fn((): Promise<Set<string>> => Promise.reject(ProviderError)),
    identifyUser:
      stubs?.identifyUserStub ||
      vi.fn((): Promise<{ id: string }> => Promise.reject(ProviderError)),
    registerClientRegistrationToken:
      stubs?.registerClientRegistrationToken ||
      vi.fn((): Promise<boolean> => Promise.reject(ProviderError)),
    unregisterClientRegistrationToken:
      stubs?.unregisterClientRegistrationToken ||
      vi.fn((): Promise<boolean> => Promise.reject(ProviderError)),
  };
}
