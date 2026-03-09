import { useCallback, useRef } from 'react';

type AnimationStep = () => void | Promise<void>;

/**
 * Queue-based animation sequencer.
 * Enqueue steps that execute sequentially with optional delays between them.
 */
export function useAnimationSequence() {
  const queueRef = useRef<AnimationStep[]>([]);
  const runningRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    while (queueRef.current.length > 0) {
      const step = queueRef.current.shift()!;
      await step();
    }

    runningRef.current = false;
  }, []);

  const enqueue = useCallback(
    (step: AnimationStep) => {
      queueRef.current.push(step);
      processQueue();
    },
    [processQueue],
  );

  const delay = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      }),
    [],
  );

  return { enqueue, delay };
}
