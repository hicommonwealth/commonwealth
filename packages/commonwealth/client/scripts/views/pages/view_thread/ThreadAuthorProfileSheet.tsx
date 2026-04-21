import ClickAwayListener from '@mui/base/ClickAwayListener';
import PopperUnstyled from '@mui/base/Popper';
import clsx from 'clsx';
import NewProfile from 'models/NewProfile';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useBrowserWindow from 'shared/hooks/useBrowserWindow';
import useFetchProfileByIdQuery from 'state/api/profiles/fetchProfileById';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';
import ProfileHeader from 'views/components/Profile/ProfileHeader';
import './ThreadAuthorProfileSheet.scss';

/** Long enough to cross the gap between avatar and popper without closing */
export const THREAD_AUTHOR_PROFILE_HOVER_CLOSE_MS = 300;

export function useThreadAuthorProfileDesktopHover({
  enabled,
  onRequestOpen,
  onRequestClose,
}: {
  enabled: boolean;
  onRequestOpen: () => void;
  onRequestClose: () => void;
}) {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onRequestClose();
    }, THREAD_AUTHOR_PROFILE_HOVER_CLOSE_MS);
  }, [cancelScheduledClose, onRequestClose]);

  useEffect(() => {
    return () => cancelScheduledClose();
  }, [cancelScheduledClose]);

  const avatarHoverProps = enabled
    ? {
        onMouseEnter: () => {
          cancelScheduledClose();
          onRequestOpen();
        },
        onMouseLeave: () => scheduleClose(),
      }
    : {};

  const popoverHoverProps = enabled
    ? {
        onMouseEnter: () => cancelScheduledClose(),
        onMouseLeave: () => scheduleClose(),
      }
    : {};

  return { avatarHoverProps, popoverHoverProps };
}

type ThreadAuthorProfileSheetProps = {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  popoverHoverProps?: React.HTMLAttributes<HTMLDivElement>;
};

export const ThreadAuthorProfileSheet = ({
  userId,
  isOpen,
  onClose,
  anchorRef,
  popoverHoverProps,
}: ThreadAuthorProfileSheetProps) => {
  const { isWindowExtraSmall } = useBrowserWindow({});
  const [desktopPopoverEntered, setDesktopPopoverEntered] = useState(false);

  const { data, isLoading } = useFetchProfileByIdQuery({
    userId,
    apiCallEnabled: isOpen && !!userId,
  });

  const profile =
    data?.profile && data?.tier !== undefined
      ? new NewProfile({
          ...data.profile,
          userId,
          isOwner: data.isOwner ?? false,
          tier: data.tier,
        })
      : undefined;

  const handleDesktopClickAway = (event: MouseEvent | TouchEvent) => {
    const target = event.target as Node;
    if (anchorRef.current?.contains(target)) {
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (isWindowExtraSmall || !isOpen) {
      setDesktopPopoverEntered(false);
      return;
    }

    setDesktopPopoverEntered(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setDesktopPopoverEntered(true);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isOpen, isWindowExtraSmall]);

  const sheet = (
    <div
      className={clsx(
        'ThreadAuthorProfileSheet',
        !isWindowExtraSmall && 'ThreadAuthorProfileSheet--popover',
      )}
    >
      {isLoading ? (
        <div className="thread-author-profile-sheet-loading">
          <CWCircleMultiplySpinner />
        </div>
      ) : profile ? (
        <ProfileHeader profile={profile} isOwner={!!data?.isOwner} />
      ) : (
        <CWText type="b1" className="thread-author-profile-sheet-empty">
          Couldn&apos;t load profile details.
        </CWText>
      )}
    </div>
  );

  if (isWindowExtraSmall) {
    return (
      <CWDrawer
        open={isOpen}
        onClose={onClose}
        direction="bottom"
        size="auto"
        className="ThreadAuthorProfileSheetDrawer"
      >
        {sheet}
      </CWDrawer>
    );
  }

  if (!isOpen || !anchorRef.current) {
    return null;
  }

  return (
    <>
      <div
        className={clsx(
          'ThreadAuthorProfileSheet__backdrop',
          desktopPopoverEntered &&
            'ThreadAuthorProfileSheet__backdrop--visible',
        )}
        aria-hidden
      />
      <PopperUnstyled
        className="ThreadAuthorProfileSheetPopperRoot"
        open={isOpen}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        disablePortal
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
          {
            name: 'preventOverflow',
            options: {
              padding: 16,
            },
          },
        ]}
      >
        <ClickAwayListener onClickAway={handleDesktopClickAway}>
          <div
            className={clsx(
              'ThreadAuthorProfileSheetPopperInner',
              desktopPopoverEntered &&
                'ThreadAuthorProfileSheetPopperInner--visible',
            )}
            {...popoverHoverProps}
          >
            {sheet}
          </div>
        </ClickAwayListener>
      </PopperUnstyled>
    </>
  );
};
