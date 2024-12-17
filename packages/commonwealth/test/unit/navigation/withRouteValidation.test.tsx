import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { withRouteValidation } from '../../../client/scripts/navigation/withRouteValidation';

// Mock the isValidSlug function
vi.mock('../../../client/scripts/utils/url-validation', () => ({
  isValidSlug: (url: string) => {
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
  },
}));

const TestComponent = () => <div>Test Component</div>;
const WrappedComponent = withRouteValidation(TestComponent);

describe('withRouteValidation HOC', () => {
  afterEach(() => {
    cleanup();
  });

  const renderWithRouter = (path: string) => {
    cleanup(); // Clean up before each render
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:param/*" element={<WrappedComponent />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('should redirect to dashboard for malicious URLs', () => {
    // Test malicious URL with http protocol
    renderWithRouter('/Please reset your password at https://evil.com');
    expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).toBeInTheDocument();

    // Test malicious URL with HTML injection
    renderWithRouter('/profile/edit/<script>alert(1)</script>');
    expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).toBeInTheDocument();

    // Test malicious URL with javascript protocol
    renderWithRouter('/community/javascript:alert(1)');
    expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).toBeInTheDocument();
  });

  it('should render component for legitimate URLs', () => {
    // Test legitimate profile URL
    renderWithRouter('/profile/edit/123');
    expect(screen.queryByText('Test Component')).toBeInTheDocument();

    // Test legitimate stake URL
    renderWithRouter('/myCommunityStake/valid-stake');
    expect(screen.queryByText('Test Component')).toBeInTheDocument();

    // Test legitimate community URL
    renderWithRouter('/community/valid-community');
    expect(screen.queryByText('Test Component')).toBeInTheDocument();
  });
});
