import { NotificationsProvider } from '@hicommonwealth/core';
import sinon from 'sinon';

export function SpyNotificationsProvider(
  sandbox: sinon.SinonSandbox,
  stubs?: {
    triggerWorkflowStub?: sinon.SinonStub;
    getMessagesStub?: sinon.SinonStub;
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
  };
}

export const ProviderError = new Error('some error');

export function ThrowingSpyNotificationsProvider(
  sandbox: sinon.SinonSandbox,
  stubs?: {
    triggerWorkflowStub?: sinon.SinonStub;
    getMessagesStub?: sinon.SinonStub;
  },
): NotificationsProvider {
  return {
    name: 'ThrowingNotificationsProvider',
    dispose: sandbox.stub().returns(Promise.resolve()),
    triggerWorkflow:
      stubs?.triggerWorkflowStub || sandbox.stub().rejects(ProviderError),
    getMessages:
      stubs?.getMessagesStub || sandbox.stub().rejects(ProviderError),
  };
}
