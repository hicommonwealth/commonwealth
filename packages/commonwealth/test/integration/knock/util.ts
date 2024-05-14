import { NotificationsProvider } from '@hicommonwealth/core';
import sinon from 'sinon';

export function SpyNotificationsProvider(
  sandbox: sinon.SinonSandbox,
  triggerWorkflowStub?: sinon.SinonStub,
): NotificationsProvider {
  return {
    name: 'SpyNotificationsProvider',
    dispose: sandbox.stub().returns(Promise.resolve()),
    triggerWorkflow:
      triggerWorkflowStub || sandbox.stub().returns(Promise.resolve(true)),
  };
}

export function ThrowingSpyNotificationsProvider(
  sandbox: sinon.SinonSandbox,
  triggerWorkflowStub?: sinon.SinonStub,
): NotificationsProvider {
  return {
    name: 'ThrowingNotificationsProvider',
    dispose: sandbox.stub().returns(Promise.resolve()),
    triggerWorkflow:
      triggerWorkflowStub ||
      sandbox.stub().returns(Promise.reject(new Error('some error'))),
  };
}
