import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  WithRouteValidationProps,
  withRouteValidation,
} from '../../../client/scripts/navigation/withRouteValidation';

// Mock the isValidSlug function
vi.mock('../../../client/scripts/utils/url-validation', () => ({
  isValidSlug: vi.fn((url: string) => {
    const urlPattern = /^https?:\/\//i;
    const htmlPattern = /[<>]/;
    const jsPattern = /javascript:/i;
    const dataPattern = /data:/i;
    const whitespacePattern = /\s/;

    return !(
      urlPattern.test(url) ||
      htmlPattern.test(url) ||
      jsPattern.test(url) ||
      dataPattern.test(url) ||
      whitespacePattern.test(url)
    );
  }),
}));

interface TestComponentProps extends WithRouteValidationProps {
  testProp?: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ testProp }) => (
  <div data-testid="test-component">Test Component {testProp}</div>
);

const WrappedComponent = withRouteValidation<TestComponentProps>(TestComponent);

describe('withRouteValidation HOC', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderWithRouter = (path: string) => {
    cleanup(); // Clean up before each render
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/:param/*"
            element={<WrappedComponent testProp="test" />}
          />
          <Route
            path="/dashboard"
            element={<div data-testid="dashboard">Dashboard</div>}
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('should redirect to dashboard for malicious URLs', () => {
    renderWithRouter('/javascript:alert(1)');
    expect(screen.queryByTestId('test-component')).toBeNull();
    expect(screen.queryByTestId('dashboard')).toBeTruthy();
  });

  it('should redirect to dashboard for HTML injection attempts', () => {
    renderWithRouter('/<script>alert(1)</script>');
    expect(screen.queryByTestId('test-component')).toBeNull();
    expect(screen.queryByTestId('dashboard')).toBeTruthy();
  });

  it('should redirect to dashboard for data URI attacks', () => {
    renderWithRouter('/data:text/html,<script>alert(1)</script>');
    expect(screen.queryByTestId('test-component')).toBeNull();
    expect(screen.queryByTestId('dashboard')).toBeTruthy();
  });

  it('should render component for valid profile path', () => {
    renderWithRouter('/profile/123');
    expect(screen.queryByTestId('test-component')).toBeTruthy();
  });

  it('should render component for valid stake path', () => {
    renderWithRouter('/myCommunityStake/123');
    expect(screen.queryByTestId('test-component')).toBeTruthy();
  });

  it('should render component for valid community path', () => {
    renderWithRouter('/community/test-community');
    expect(screen.queryByTestId('test-component')).toBeTruthy();
  });
});
