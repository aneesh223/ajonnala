import { useEffect, useRef } from 'react';
import { FakeBeatDetector } from './fakeBeatDetection';

/**
 * Hook that integrates fake beat detection with the AudioAnalysisContext.
 * Returns a controller to start/stop/update BPM of fake beat detection.
 */
export function useFakeBeatDetection() {
    const detectorRef = useRef<FakeBeatDetector | null>(null);
    const beatCallbacksRef = useRef<Set<(strength: number) => void>>(new Set());

    // Initialize detector
    useEffect(() => {
        const detector = new FakeBeatDetector(100);
        detectorRef.current = detector;

        // Subscribe to fake beats and forward to our callbacks
        const unsubscribe = detector.onBeat((strength) => {
            // Call all registered callbacks
            beatCallbacksRef.current.forEach(callback => {
                try {
                    callback(strength);
                } catch (err) {
                    console.error('Error in fake beat callback:', err);
                }
            });
        });

        return () => {
            detector.stop();
            unsubscribe();
        };
    }, []);

    return {
        start: () => {
            console.log('FakeBeatDetector: start() called');
            detectorRef.current?.start();
        },
        stop: () => {
            console.log('FakeBeatDetector: stop() called');
            detectorRef.current?.stop();
        },
        setBPM: (bpm: number) => {
            console.log('FakeBeatDetector: setBPM() called with', bpm);
            detectorRef.current?.setBPM(bpm);
        },
        onBeat: (callback: (strength: number) => void) => {
            beatCallbacksRef.current.add(callback);
            return () => beatCallbacksRef.current.delete(callback);
        },
    };
}
