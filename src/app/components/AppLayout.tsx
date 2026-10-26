import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from './ui/sonner';
import { Sidebar } from './Sidebar';
import FloatingAIAssistant, { FloatingAIAssistantHandle } from './FloatingAIAssistant';
import { AIDemoControls } from './AIDemoControls';
import { Screen, SCREEN_PATHS, screenFromPath } from '../navigation';
import type { AuthUser } from '../../auth/useAuth';
import type { DemoState } from '../hooks/useAIDemoMode';
import type { RefObject } from 'react';

interface AppLayoutProps {
  currentUser: AuthUser;
  onLogout: () => void;
  fabRef: RefObject<FloatingAIAssistantHandle>;
  demoState: DemoState;
  onStartDemo: () => void;
  onPauseDemo: () => void;
  onResumeDemo: () => void;
  onStopDemo: () => void;
}

/**
 * Authenticated app shell (ERP-PORTAL-UX-ARCHITECTURE-002A).
 * The active screen is derived from the URL — sidebar, AI assistant and
 * demo mode still speak in `Screen` keys via onScreenChange, so their
 * public interface is unchanged.
 */
export function AppLayout({
  currentUser,
  onLogout,
  fabRef,
  demoState,
  onStartDemo,
  onPauseDemo,
  onResumeDemo,
  onStopDemo,
}: AppLayoutProps) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const activeScreen: Screen = screenFromPath(location.pathname) ?? 'home';
  const navigateToScreen = (screen: Screen) =>
    navigate(SCREEN_PATHS[screen] ?? '/');

  return (
    <>
      <div
        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        className="h-screen flex bg-background"
        style={{ fontFamily: 'Cairo, sans-serif' }}
      >
        <Sidebar
          activeScreen={activeScreen}
          onScreenChange={navigateToScreen}
          currentUser={currentUser}
          onLogout={onLogout}
        />
        {/*
          Content area: flex-1 + min-w-0 so it takes the width left by the
          sidebar and can shrink for inner scroll regions. .erp-content > *
          forces each routed screen to fill the area horizontally —
          replaces the per-screen <div className="flex-1"> wrappers that
          existed before routing.
        */}
        <div className="flex-1 min-w-0 min-h-0 flex erp-content">
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>
      <FloatingAIAssistant
        ref={fabRef}
        onScreenChange={navigateToScreen}
        currentUser={currentUser}
        onStartDemo={onStartDemo}
        isDemoRunning={demoState.status === 'running' || demoState.status === 'paused'}
      />
      <AIDemoControls
        demoState={demoState}
        onPause={onPauseDemo}
        onResume={onResumeDemo}
        onStop={onStopDemo}
      />
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            direction: 'rtl',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
        }}
      />
    </>
  );
}
