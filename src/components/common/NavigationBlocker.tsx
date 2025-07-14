'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUserData } from '@/hooks/use-user-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/use-auth';

// This component is a workaround for the lack of a stable navigation blocking API in Next.js App Router.
// It combines listening to `beforeunload` for browser-level events (close tab, refresh)
// and watching the `pathname` for client-side navigation.

export default function NavigationBlocker() {
  const { isDirty, setIsDirty } = useUserData();
  const { auth } = useAuth();
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);
  const [nextPath, setNextPath] = useState('');
  
  // Use a ref to store the current pathname to compare against on the next render
  const previousPathnameRef = useRef(pathname);

  // This effect handles client-side navigation (e.g. clicking a <Link>)
  useEffect(() => {
    // If the pathname has changed and there are unsaved changes, show the dialog.
    if (isDirty && pathname !== previousPathnameRef.current) {
        setShowDialog(true);
        // Store the path the user was trying to go to.
        setNextPath(pathname);
        
        // This is a bit of a hack: we can't truly "cancel" the navigation that already started.
        // Instead, we immediately navigate *back* to the previous page.
        // The user can then choose to proceed from the dialog.
        // We use window.history.pushState to avoid triggering another navigation event.
        window.history.pushState(null, '', previousPathnameRef.current);
    } else {
        // If navigation is allowed, update the ref to the new pathname.
        previousPathnameRef.current = pathname;
    }
  }, [pathname, isDirty]);

  // This effect handles browser-level navigation (closing tab, refresh, back button)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        // Standard for most browsers.
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);


  const handleConfirm = () => {
    // The user wants to leave, so we abandon the changes.
    setIsDirty(false);
    setShowDialog(false);
    
    // Now that isDirty is false, we can safely navigate to the intended path.
    // We use a small timeout to ensure the state has updated before navigating.
    setTimeout(() => {
        window.location.pathname = nextPath;
    }, 50);
  };

  const handleCancel = () => {
    // The user wants to stay on the page.
    setShowDialog(false);
    setNextPath('');
  };
  
  // Don't show the blocker on login page.
  if (!auth?.role) return null;

  return (
    <AlertDialog open={showDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. If you leave this page, your changes will be lost. Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Stay on Page</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Leave Page</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
