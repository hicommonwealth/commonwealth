import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { withRouteValidation } from './withRouteValidation';

const TestComponent = () => <div>Test Component</div>;
const WrappedComponent = withRouteValidation(TestComponent);

describe('withRouteValidation HOC', () => {
  const renderWithRouter = (path: string) => {
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
    renderWithRouter('/Please reset your password at https://evil.com');
    expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    renderWithRouter('/profile/edit/<script>alert(1)</script>');
    expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    renderWithRouter('/community/javascript:alert(1)');
    expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render component for legitimate URLs', () => {
    renderWithRouter('/profile/edit/123');
    expect(screen.getByText('Test Component')).toBeInTheDocument();

    renderWithRouter('/myCommunityStake/valid-stake');
    expect(screen.getByText('Test Component')).toBeInTheDocument();

    renderWithRouter('/community/valid-community');
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
