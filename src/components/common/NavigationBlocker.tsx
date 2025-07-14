'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

export default function NavigationBlocker() {
  const { isDirty, setIsDirty } = useUserData();
  const { stopUserView } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [showDialog, setShowDialog] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [isHardNavigation, setIsHardNavigation] = useState(false);

  const handleRouteChange = useCallback((url: string) => {
    if (isDirty) {
      setNextPath(url);
      setShowDialog(true);
      return false; // Prevent navigation
    }
    return true; // Allow navigation
  }, [isDirty]);

  // Handle client-side navigation (Next.js Links)
  useEffect(() => {
    // This is a simplified approach. A more robust solution might involve patching `next/link`.
    // For this app, we listen to all clicks and check if they're on an `<a>` tag.
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;

      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      // If it's not a link, or it's an external link, or a download link, let it go.
      if (!link || link.target === '_blank' || link.hasAttribute('download')) {
        return;
      }
      
      // Ignore clicks on the same page
      if (link.href === window.location.href) {
        return;
      }
      
      // Check if it's a special action like logout or view switching
      const isLogout = link.textContent?.toLowerCase().includes('log out');
      const isUserViewSwitch = link.textContent?.toLowerCase().includes('view as user') || link.textContent?.toLowerCase().includes('return to hr view');

      if (isLogout || isUserViewSwitch) {
         if (isDirty) {
            e.preventDefault();
            e.stopPropagation();
            setNextPath(isLogout ? 'logout' : 'user-view-switch');
            setShowDialog(true);
         }
         return;
      }
      
      // For all other internal links
      if (link.href.startsWith(window.location.origin)) {
        if (!handleRouteChange(link.pathname)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);

  }, [handleRouteChange, isDirty]);


  // Handle browser navigation (back/forward buttons, closing tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // This is a fallback for hard navigation.
        setNextPath(window.location.pathname); 
        setShowDialog(true);
        setIsHardNavigation(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);


  const handleConfirm = () => {
    setIsDirty(false); // We are abandoning the changes
    setShowDialog(false);
    
    if (nextPath) {
      if (nextPath === 'logout') {
          // This path will now be taken care of by the original click handler in Header
      } else if (nextPath === 'user-view-switch') {
          // This path will now be taken care of by the original click handler in Header
      }
      else if (!isHardNavigation) {
        router.push(nextPath);
      }
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setNextPath(null);
    setIsHardNavigation(false);
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. If you leave this page, your changes will be lost. Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Leave Page</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
