import { useState, useRef, useCallback, useEffect } from 'react';
import { AI_DEMO_SCRIPT } from '../demo/aiDemoScript';
import { demoAudio } from '../demo/audioPlayer';
import type { Screen } from '../App';

export type DemoStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface DemoState {
  status: DemoStatus;
  currentStepIndex: number;
  totalSteps: number;
}

export interface UseAIDemoModeProps {
  onNavigate: (screen: Screen) => void;
  onAssistantMessage: (content: string) => void;
  onActionMessage: (content: string) => void;
  onOpenPanel: () => void;
}

function queryDemoElement(id: string) {
  return document.querySelector(`[data-demo-id="${id}"]`);
}

function applyHighlights(targets: string[]) {
  clearAllHighlights();
  targets.forEach((id) => {
    const els = document.querySelectorAll(`[data-demo-id="${id}"]`);
    els.forEach((el) => el.classList.add('demo-spotlight'));
  });
}

function clearAllHighlights() {
  document.querySelectorAll('.demo-spotlight').forEach((el) => {
    el.classList.remove('demo-spotlight');
  });
}

function estimateAudioDurationMs(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(words * 400 + 500, 2000);
}

function createDelayWithCancel(ms: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let resolveFn: (() => void) | null = null;

  const promise = new Promise<void>((resolve) => {
    resolveFn = resolve;
    timeoutId = setTimeout(resolve, ms);
  });

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (resolveFn) {
      resolveFn();
      resolveFn = null;
    }
  };

  return { promise, cancel };
}

function waitForAnyElement(targetIds: string[], timeoutMs: number) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let resolveFn: ((foundId: string | null) => void) | null = null;

  const promise = new Promise<string | null>((resolve) => {
    resolveFn = resolve;

    const check = () => {
      for (const id of targetIds) {
        if (queryDemoElement(id)) {
          resolve(id);
          return;
        }
      }
    };

    check();
    intervalId = setInterval(check, 100);
    timeoutId = setTimeout(() => resolve(null), timeoutMs);
  });

  const cancel = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (resolveFn) {
      resolveFn(null);
      resolveFn = null;
    }
  };

  return { promise, cancel };
}

export function useAIDemoMode({
  onNavigate,
  onAssistantMessage,
  onActionMessage,
  onOpenPanel,
}: UseAIDemoModeProps) {
  const [demoState, setDemoState] = useState<DemoState>({
    status: 'idle',
    currentStepIndex: 0,
    totalSteps: AI_DEMO_SCRIPT.length,
  });

  const pausedIndexRef = useRef<number>(0);
  const currentStepIndexRef = useRef<number>(0);
  const statusRef = useRef<DemoStatus>('idle');
  const cancelDelayRef = useRef<(() => void) | null>(null);

  const cancelCurrentDelay = useCallback(() => {
    cancelDelayRef.current?.();
    cancelDelayRef.current = null;
  }, []);

  const wait = useCallback(async (ms: number) => {
    const { promise, cancel } = createDelayWithCancel(ms);
    cancelDelayRef.current = cancel;
    await promise;
    cancelDelayRef.current = null;
  }, []);

  const playSegmentAudio = useCallback(async (text: string) => {
    const fallbackMs = estimateAudioDurationMs(text);
    const audioPromise = demoAudio.play(text);

    // Safety: ensure the narration is visible/audible for at least the estimated
    // duration, even if the speech engine reports completion early or fails.
    const { promise: fallbackPromise, cancel: cancelFallback } = createDelayWithCancel(fallbackMs);
    cancelDelayRef.current = () => {
      cancelFallback();
      demoAudio.stop();
    };

    await Promise.all([audioPromise, fallbackPromise]);
    cancelDelayRef.current = null;
  }, []);

  const runStep = useCallback(
    async (stepIndex: number) => {
      if (statusRef.current !== 'running') return;
      if (stepIndex >= AI_DEMO_SCRIPT.length) {
        setDemoState((prev) => ({ ...prev, status: 'completed', currentStepIndex: stepIndex }));
        statusRef.current = 'completed';
        clearAllHighlights();
        console.log(`[Demo] Presentation completed.`);
        return;
      }

      const step = AI_DEMO_SCRIPT[stepIndex];
      currentStepIndexRef.current = stepIndex;
      setDemoState((prev) => ({ ...prev, currentStepIndex: stepIndex }));
      console.log(`[Demo] Step start: ${step.id} (${step.screenName})`);

      // 1. Show assistant message
      onAssistantMessage(step.assistantMessage);
      await wait(700);
      if (statusRef.current !== 'running') return;

      // 2. Show action executing
      onActionMessage(step.actionMessage);
      await wait(700);
      if (statusRef.current !== 'running') return;

      // 3. Show success + navigate to screen
      onActionMessage(step.successMessage);
      if (step.targetScreen) {
        onNavigate(step.targetScreen);
      }

      // 4. Wait 2-3 seconds after navigation for the screen to render
      const entryDelay = 2500;
      console.log(`[Demo] Waiting ${entryDelay}ms after navigation for screen to render...`);
      await wait(entryDelay);
      if (statusRef.current !== 'running') return;

      // 5. Wait until the first expected data-demo-id exists in the DOM
      const expectedTargetIds = step.segments
        .map((s) => s.highlightTargetId)
        .filter((id): id is string => Boolean(id));
      if (expectedTargetIds.length > 0) {
        console.log(
          `[Demo] Waiting for screen readiness. Expected targets: ${expectedTargetIds.join(', ')}`
        );
        const { promise, cancel } = waitForAnyElement(expectedTargetIds, 5000);
        cancelDelayRef.current = cancel;
        const foundId = await promise;
        cancelDelayRef.current = null;
        if (statusRef.current !== 'running') return;
        if (foundId) {
          console.log(`[Demo] Screen ready. First target found: ${foundId}`);
        } else {
          console.warn(
            `[Demo] Screen readiness timeout. No expected targets found. Continuing narration without highlights. Targets: ${expectedTargetIds.join(', ')}`
          );
        }
      }

      // 6. Event-driven segment narration
      for (const segment of step.segments) {
        if (statusRef.current !== 'running') return;
        console.log(
          `[Demo] Segment start: ${segment.id}${
            segment.highlightTargetId ? ` (target: ${segment.highlightTargetId})` : ''
          }`
        );

        let targetFound = false;
        if (segment.highlightTargetId) {
          const el = queryDemoElement(segment.highlightTargetId);
          if (el) {
            applyHighlights([segment.highlightTargetId]);
            console.log(`[Demo] Target found: ${segment.highlightTargetId}`);
            targetFound = true;
          } else {
            console.warn(
              `[Demo] Target missing: ${segment.highlightTargetId}. Playing narration without highlight.`
            );
            clearAllHighlights();
          }
        } else {
          clearAllHighlights();
        }

        onAssistantMessage(segment.narrationText);
        await playSegmentAudio(segment.narrationText);
        if (statusRef.current !== 'running') return;

        // Observation pause so the user can see the highlighted element
        const observationMs = segment.observationMs ?? 800;
        if (observationMs > 0) {
          console.log(`[Demo] Observation pause: ${observationMs}ms`);
          await wait(observationMs);
          if (statusRef.current !== 'running') return;
        }

        clearAllHighlights();

        if (segment.pauseAfterMs > 0) {
          await wait(segment.pauseAfterMs);
          if (statusRef.current !== 'running') return;
        }

        console.log(`[Demo] Segment complete: ${segment.id}`);
      }

      // 7. Closing statement for the screen
      clearAllHighlights();
      console.log(`[Demo] Closing statement: ${step.closingStatement}`);
      onAssistantMessage(step.closingStatement);
      await playSegmentAudio(step.closingStatement);
      if (statusRef.current !== 'running') return;

      // 8. Pause before transition
      if (step.transitionPauseMs > 0) {
        console.log(`[Demo] Transition pause: ${step.transitionPauseMs}ms`);
        await wait(step.transitionPauseMs);
        if (statusRef.current !== 'running') return;
      }

      // 9. Transition statement
      if (step.transitionStatement) {
        console.log(`[Demo] Transition statement: ${step.transitionStatement}`);
        onAssistantMessage(step.transitionStatement);
        await playSegmentAudio(step.transitionStatement);
        if (statusRef.current !== 'running') return;
      }

      // 10. Move to next step
      console.log(`[Demo] Step complete: ${step.id}. Moving to next step.`);
      runStep(stepIndex + 1);
    },
    [onAssistantMessage, onActionMessage, onNavigate, wait, playSegmentAudio]
  );

  const start = useCallback(() => {
    cancelCurrentDelay();
    demoAudio.stop();
    clearAllHighlights();
    statusRef.current = 'running';
    pausedIndexRef.current = 0;
    currentStepIndexRef.current = 0;
    setDemoState({
      status: 'running',
      currentStepIndex: 0,
      totalSteps: AI_DEMO_SCRIPT.length,
    });
    onOpenPanel();
    console.log(`[Demo] Presentation started.`);
    runStep(0);
  }, [cancelCurrentDelay, runStep, onOpenPanel]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    cancelCurrentDelay();
    demoAudio.stop();
    pausedIndexRef.current = currentStepIndexRef.current;
    statusRef.current = 'paused';
    setDemoState((prev) => ({ ...prev, status: 'paused' }));
    console.log(`[Demo] Presentation paused at step ${pausedIndexRef.current}.`);
  }, [cancelCurrentDelay]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    statusRef.current = 'running';
    setDemoState((prev) => ({ ...prev, status: 'running' }));
    console.log(`[Demo] Presentation resumed from step ${pausedIndexRef.current}.`);
    runStep(pausedIndexRef.current);
  }, [runStep]);

  const stop = useCallback(() => {
    cancelCurrentDelay();
    demoAudio.stop();
    clearAllHighlights();
    statusRef.current = 'idle';
    pausedIndexRef.current = 0;
    currentStepIndexRef.current = 0;
    setDemoState({
      status: 'idle',
      currentStepIndex: 0,
      totalSteps: AI_DEMO_SCRIPT.length,
    });
    console.log(`[Demo] Presentation stopped.`);
  }, [cancelCurrentDelay]);

  useEffect(() => {
    return () => {
      cancelCurrentDelay();
      demoAudio.stop();
      clearAllHighlights();
    };
  }, [cancelCurrentDelay]);

  return { demoState, start, pause, resume, stop };
}
