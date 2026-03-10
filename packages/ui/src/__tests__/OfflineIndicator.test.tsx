/**
 * Unit Tests for OfflineIndicator Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the hooks
jest.mock('@/lib/offline', () => ({
  useNetworkStatus: jest.fn(),
  useSync: jest.fn(),
}));

import { useNetworkStatus, useSync } from '@/lib/offline';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';

const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
const mockUseSync = useSync as jest.Mock;

describe('OfflineIndicator', () => {
  beforeEach(() => {
    mockUseSync.mockReturnValue({
      pendingCount: 0,
      isSyncing: false,
      lastSyncTime: null,
      triggerSync: jest.fn(),
    });
  });

  it('should render nothing when online with no pending items', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      wasOffline: false,
    });

    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should show offline indicator when offline', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      wasOffline: false,
    });

    render(<OfflineIndicator />);
    expect(screen.getByText('オフライン')).toBeInTheDocument();
  });

  it('should show syncing indicator when syncing', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      wasOffline: false,
    });
    mockUseSync.mockReturnValue({
      pendingCount: 5,
      isSyncing: true,
      lastSyncTime: null,
      triggerSync: jest.fn(),
    });

    render(<OfflineIndicator />);
    expect(screen.getByText('同期中...')).toBeInTheDocument();
  });

  it('should show pending count when items are pending', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      wasOffline: false,
    });
    mockUseSync.mockReturnValue({
      pendingCount: 3,
      isSyncing: false,
      lastSyncTime: null,
      triggerSync: jest.fn(),
    });

    render(<OfflineIndicator />);
    expect(screen.getByText('未同期: 3件')).toBeInTheDocument();
  });

  it('should show reconnected message after coming back online', () => {
    mockUseNetworkStatus.mockReturnValue({
      isOnline: true,
      wasOffline: true,
    });

    render(<OfflineIndicator />);
    expect(screen.getByText('オンラインに復帰しました')).toBeInTheDocument();
  });
});
