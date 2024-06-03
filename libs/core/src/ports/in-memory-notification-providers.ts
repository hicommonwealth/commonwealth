import { NotificationsProvider } from '@hicommonwealth/core';
import sinon from 'sinon';

export function SpyNotificationsProvider(
  sandbox: sinon.SinonSandbox,
  stubs?: {
    triggerWorkflowStub?: sinon.SinonStub;
    getMessagesStub?: sinon.SinonStub;
    getSchedulesStub?: sinon.SinonStub;
    createSchedulesStub?: sinon.SinonStub;
    deleteSchedulesStub?: sinon.SinonStub;
    registerClientRegistrationToken?: sinon.SinonStub;
  },
): NotificationsProvider {
  return {
    name: 'SpyNotificationsProvider',
    dispose: sandbox.stub().returns(Promise.resolve()),
    triggerWorkflow:
      stubs?.triggerWorkflowStub ||
      sandbox.stub().returns(Promise.resolve(true)),
    getMessages:
      stubs?.getMessagesStub || sandbox.stub().returns(Promise.resolve([])),
    getSchedules:
      stubs?.getSchedulesStub || sandbox.stub().returns(Promise.resolve([])),
    createSchedules:
      stubs?.createSchedulesStub || sandbox.stub().returns(Promise.resolve([])),
    deleteSchedules:
      stubs?.deleteSchedulesStub || sandbox.stub().returns(Promise.resolve([])),
    registerClientRegistrationToken:
      stubs?.registerClientRegistrationToken ||
      sandbox.stub().returns(Promise.resolve(true)),
  };
}

export const ProviderError = new Error('some error');

export function ThrowingSpyNotificationsProvider(
  sandbox: sinon.SinonSandbox,
  stubs?: {
    triggerWorkflowStub?: sinon.SinonStub;
    getMessagesStub?: sinon.SinonStub;
    getSchedulesStub?: sinon.SinonStub;
    createSchedulesStub?: sinon.SinonStub;
    deleteSchedulesStub?: sinon.SinonStub;
    registerClientRegistrationToken?: sinon.SinonStub;
  },
): NotificationsProvider {
  return {
    name: 'ThrowingNotificationsProvider',
    dispose: sandbox.stub().returns(Promise.resolve()),
    triggerWorkflow:
      stubs?.triggerWorkflowStub || sandbox.stub().rejects(ProviderError),
    getMessages:
      stubs?.getMessagesStub || sandbox.stub().rejects(ProviderError),
    getSchedules:
      stubs?.getSchedulesStub || sandbox.stub().rejects(ProviderError),
    createSchedules:
      stubs?.createSchedulesStub || sandbox.stub().rejects(ProviderError),
    deleteSchedules:
      stubs?.deleteSchedulesStub || sandbox.stub().rejects(ProviderError),
    registerClientRegistrationToken:
      stubs?.registerClientRegistrationToken ||
      sandbox.stub().rejects(ProviderError),
  };
}
