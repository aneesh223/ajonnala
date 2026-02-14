import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { BeatDetector } from '../lib/beatDetection';

/**
 * Callback function invoked when a beat is detected in the audio.
 * 
 * @param beatStrength - Normalized beat intensity (0-1), where higher values indicate stronger beats
 * 
 * @example
 * ```typescript
 * const unsubscribe = onBeat((strength) => {
 *   console.log(`Beat detected with strength: ${strength}`);
 * });
 * ```
 */
export type BeatCallback = (beatStrength: number) => void;

/**
 * Context value providing audio analysis capabilities and beat detection.
 * 
 * This interface exposes methods for registering audio elements, subscribing to beat events,
 * and monitoring the analysis state. It integrates Web Audio API with React components
 * to enable beat-reactive visual effects.
 * 
 * @example
 * ```typescript
 * const { onBeat, registerAudioElement, isAnalyzing, config } = useAudioAnalysis();
 * 
 * // Register audio element
 * useEffect(() => {
 *   if (audioRef.current) {
 *     registerAudioElement(audioRef.current);
 *     return () => unregisterAudioElement();
 *   }
 * }, []);
 * 
 * // Subscribe to beat events
 * useEffect(() => {
 *   return onBeat((strength) => {
 *     console.log('Beat detected:', strength);
 *   });
 * }, []);
 * ```
 */
export interface AudioAnalysisContextValue {
    /**
     * Indicates whether audio analysis is currently active.
     * True when an audio element is registered and the analysis loop is running.
     */
    isAnalyzing: boolean;

    /**
     * Indicates whether the Web Audio API is supported in the current browser.
     * When false, beat-reactive features will gracefully degrade.
     */
    isWebAudioSupported: boolean;

    /**
     * Registers a callback to be invoked when beats are detected.
     * 
     * @param callback - Function to call when a beat is detected
     * @returns Cleanup function to unsubscribe the callback
     * 
     * @example
     * ```typescript
     * useEffect(() => {
     *   const unsubscribe = onBeat((strength) => {
     *     triggerPulsation(strength);
     *   });
     *   return unsubscribe;
     * }, []);
     * ```
     */
    onBeat: (callback: BeatCallback) => () => void;

    /**
     * Registers an HTML5 audio element for analysis.
     * Creates an AudioContext and connects it to the audio element for real-time frequency analysis.
     * 
     * @param element - The HTML audio element to analyze
     * 
     * @example
     * ```typescript
     * const audioRef = useRef<HTMLAudioElement>(null);
     * 
     * useEffect(() => {
     *   if (audioRef.current) {
     *     registerAudioElement(audioRef.current);
     *   }
     * }, []);
     * ```
     */
    registerAudioElement: (element: HTMLAudioElement) => void;

    /**
     * Unregisters the current audio element and cleans up all audio analysis resources.
     * Disconnects audio nodes, closes the AudioContext, and stops the analysis loop.
     * 
     * @example
     * ```typescript
     * useEffect(() => {
     *   return () => {
     *     unregisterAudioElement();
     *   };
     * }, []);
     * ```
     */
    unregisterAudioElement: () => void;

    /**
     * Error message if audio analysis initialization or operation failed.
     * Null when no error has occurred.
     */
    error: string | null;

    /**
     * Configuration values for pulsation and selection behavior.
     * Allows components to access the current configuration settings.
     */
    config: {
        pulsationIntensity: number;
        selectionPercentage: number;
    };
}

/**
 * Props for the AudioAnalysisProvider component.
 * 
 * Allows configuration of beat detection parameters and Web Audio API settings.
 * All configuration options have sensible defaults optimized for music beat detection.
 * 
 * @example
 * ```typescript
 * <AudioAnalysisProvider
 *   fftSize={2048}
 *   beatThreshold={1.3}
 *   beatDebounceMs={100}
 *   pulsationIntensity={0.75}
 *   selectionPercentage={0.10}
 * >
 *   <App />
 * </AudioAnalysisProvider>
 * ```
 */
export interface AudioAnalysisProviderProps {
    /** React children to render within the provider */
    children: React.ReactNode;

    /**
     * FFT size for frequency analysis. Must be a power of 2.
     * Larger values provide better frequency resolution but higher computational cost.
     * 
     * @default 2048
     */
    fftSize?: number;

    /**
     * Smoothing time constant for the AnalyserNode (0-1).
     * Higher values provide smoother frequency data but slower response to changes.
     * 
     * @default 0.8
     */
    smoothingTimeConstant?: number;

    /**
     * Multiplier applied to average energy to determine beat threshold.
     * Higher values make beat detection less sensitive (fewer beats detected).
     * Lower values make beat detection more sensitive (more beats detected).
     * 
     * @default 1.3
     */
    beatThreshold?: number;

    /**
     * Minimum time between beat detections in milliseconds.
     * Prevents multiple beats from being detected in rapid succession.
     * 
     * @default 100
     */
    beatDebounceMs?: number;

    /**
     * Intensity of pulsation effects (0-1).
     * Controls the magnitude and duration of star pulsations.
     * - 0: Minimal pulsation (1.5x scale, 200ms duration)
     * - 0.5: Medium pulsation (1.75x scale, 300ms duration)
     * - 1: Maximum pulsation (2.0x scale, 400ms duration)
     * 
     * @default 1.0
     */
    pulsationIntensity?: number;

    /**
     * Base percentage of stars to select for pulsation per beat (0-1).
     * The actual selection varies with beat strength:
     * - Weak beats: selectionPercentage * 0.5
     * - Strong beats: selectionPercentage * 1.5
     * 
     * @default 0.10 (10% of stars)
     */
    selectionPercentage?: number;
}

// Create context with undefined default (will throw if used outside provider)
const AudioAnalysisContext = createContext<AudioAnalysisContextValue | undefined>(undefined);

// Feature detection function
const detectWebAudioSupport = (): boolean => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        return typeof AudioContextClass !== 'undefined';
    } catch {
        return false;
    }
};

/**
 * Provider component that enables audio analysis and beat detection for child components.
 * 
 * This component creates an AudioContext, manages the beat detection algorithm,
 * and broadcasts beat events to subscribers. It handles Web Audio API initialization,
 * error handling, and graceful degradation when audio features are unavailable.
 * 
 * @param props - Configuration props for audio analysis
 * 
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <AudioAnalysisProvider
 *       fftSize={2048}
 *       beatThreshold={1.3}
 *       beatDebounceMs={100}
 *       pulsationIntensity={0.75}
 *       selectionPercentage={0.10}
 *     >
 *       <MusicPlayer />
 *       <StarfieldBackground />
 *     </AudioAnalysisProvider>
 *   );
 * }
 * ```
 */
export const AudioAnalysisProvider: React.FC<AudioAnalysisProviderProps> = ({
    children,
    fftSize = 2048,
    smoothingTimeConstant = 0.8,
    beatThreshold = 1.3,
    beatDebounceMs = 100,
    pulsationIntensity = 1.0,
    selectionPercentage = 0.10,
}) => {
    // State management
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isWebAudioSupported] = useState(() => detectWebAudioSupport());

    // Clamp configuration values to valid ranges
    const clampedPulsationIntensity = Math.max(0, Math.min(1, pulsationIntensity));
    const clampedSelectionPercentage = Math.max(0, Math.min(1, selectionPercentage));

    // Refs for audio analysis
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const beatCallbacksRef = useRef<Set<BeatCallback>>(new Set());
    const beatDetectorRef = useRef<BeatDetector | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const audioErrorHandlerRef = useRef<((event: Event) => void) | null>(null);

    // Register beat callback and return cleanup function
    const onBeat = useCallback((callback: BeatCallback) => {
        beatCallbacksRef.current.add(callback);

        // Return unsubscribe function
        return () => {
            beatCallbacksRef.current.delete(callback);
        };
    }, []);

    // Stop analysis loop
    const stopAnalysisLoop = useCallback(() => {
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
    }, []);

    // Analysis loop using requestAnimationFrame
    const analysisLoop = useCallback(() => {
        try {
            const analyser = analyserRef.current;
            const beatDetector = beatDetectorRef.current;
            const frequencyData = frequencyDataRef.current;
            const audioElement = audioElementRef.current;

            // Check if we should continue analyzing
            if (!analyser || !beatDetector || !frequencyData || !audioElement) {
                return;
            }

            // Only analyze if audio is playing
            if (!audioElement.paused && !audioElement.ended) {
                // Get frequency data from analyser (reuses existing TypedArray buffer)
                analyser.getByteFrequencyData(frequencyData);

                // Detect beat (cast to satisfy TypeScript - Web Audio API returns compatible type)
                const timestamp = performance.now();
                const beatStrength = beatDetector.detectBeat(frequencyData as unknown as Uint8Array, timestamp);

                // If beat detected, notify all subscribers
                if (beatStrength !== null && beatCallbacksRef.current.size > 0) {
                    // Cache callbacks to avoid iterator allocation on every frame
                    beatCallbacksRef.current.forEach(callback => {
                        try {
                            callback(beatStrength);
                        } catch (err) {
                            console.error('AudioAnalysisContext: Error in beat callback', err);
                        }
                    });
                }
            }

            // Schedule next frame
            animationFrameIdRef.current = requestAnimationFrame(analysisLoop);
        } catch (err) {
            // Catch any errors in the analysis loop to prevent crashes
            console.error('AudioAnalysisContext: Error in analysis loop', err);
            setError(err instanceof Error ? err.message : 'Analysis loop error');
            // Stop the loop on error - use direct implementation to avoid circular dependency
            if (animationFrameIdRef.current !== null) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            setIsAnalyzing(false);
        }
    }, []);

    // Start analysis loop when audio element is registered
    const startAnalysisLoop = useCallback(() => {
        // Stop any existing loop
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }

        // Start new loop
        animationFrameIdRef.current = requestAnimationFrame(analysisLoop);
    }, [analysisLoop]);

    // Register audio element for analysis
    const registerAudioElement = useCallback((element: HTMLAudioElement) => {
        try {
            // Validate audio element
            if (!element) {
                throw new Error('Invalid audio element provided');
            }

            // Check for Web Audio API support
            if (!isWebAudioSupported) {
                const errorMessage = 'Web Audio API is not supported in this browser';
                setError(errorMessage);
                console.warn('AudioAnalysisContext:', errorMessage);
                return; // Gracefully degrade - don't throw
            }

            audioElementRef.current = element;

            // Add error event listener to audio element if it supports addEventListener
            if (typeof element.addEventListener === 'function') {
                const handleAudioError = (event: Event) => {
                    const audioError = (event.target as HTMLAudioElement).error;
                    const errorMessage = audioError
                        ? `Audio playback error: ${audioError.message} (code: ${audioError.code})`
                        : 'Unknown audio playback error';

                    console.error('AudioAnalysisContext:', errorMessage);
                    setError(errorMessage);
                    // Continue with non-reactive starfield - don't stop the app
                };

                element.addEventListener('error', handleAudioError);
                audioErrorHandlerRef.current = handleAudioError;
            }

            // Create AudioContext
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            // Create AnalyserNode
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = fftSize;
            analyser.smoothingTimeConstant = smoothingTimeConstant;
            analyserRef.current = analyser;

            // Connect audio element to analyser
            const source = audioContext.createMediaElementSource(element);
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            // Create BeatDetector instance
            beatDetectorRef.current = new BeatDetector(
                60, // historySize: 60 frames (1 second at 60fps)
                beatThreshold,
                beatDebounceMs
            );

            // Create frequency data buffer with explicit ArrayBuffer type
            const bufferLength = analyser.frequencyBinCount;
            const buffer = new ArrayBuffer(bufferLength);
            frequencyDataRef.current = new Uint8Array(buffer);

            // Start analysis loop
            startAnalysisLoop();

            setIsAnalyzing(true);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to register audio element';
            setError(errorMessage);
            console.error('AudioAnalysisContext: Failed to register audio element', err);
            setIsAnalyzing(false);
        }
    }, [fftSize, smoothingTimeConstant, beatThreshold, beatDebounceMs, startAnalysisLoop, isWebAudioSupported]);

    // Unregister audio element and cleanup
    const unregisterAudioElement = useCallback(() => {
        try {
            // Stop analysis loop
            stopAnalysisLoop();

            // Remove error event listener
            if (audioElementRef.current && audioErrorHandlerRef.current) {
                audioElementRef.current.removeEventListener('error', audioErrorHandlerRef.current);
                audioErrorHandlerRef.current = null;
            }

            // Disconnect analyser node
            if (analyserRef.current) {
                analyserRef.current.disconnect();
                analyserRef.current = null;
            }

            // Close AudioContext
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }

            // Clear references
            audioElementRef.current = null;
            beatDetectorRef.current = null;
            frequencyDataRef.current = null;

            // Clear all beat callbacks
            beatCallbacksRef.current.clear();

            // Reset state
            setIsAnalyzing(false);
            setError(null);
        } catch (err) {
            console.error('AudioAnalysisContext: Failed to unregister audio element', err);
        }
    }, [stopAnalysisLoop]);

    const contextValue: AudioAnalysisContextValue = {
        isAnalyzing,
        isWebAudioSupported,
        onBeat,
        registerAudioElement,
        unregisterAudioElement,
        error,
        config: {
            pulsationIntensity: clampedPulsationIntensity,
            selectionPercentage: clampedSelectionPercentage,
        },
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAnalysisLoop();
        };
    }, [stopAnalysisLoop]);

    return (
        <AudioAnalysisContext.Provider value={contextValue}>
            {children}
        </AudioAnalysisContext.Provider>
    );
};

/**
 * Custom React hook for accessing audio analysis context.
 * 
 * Provides access to audio analysis state, beat event subscription,
 * and audio element registration. Must be used within an AudioAnalysisProvider.
 * 
 * @returns Audio analysis context value
 * @throws Error if used outside of AudioAnalysisProvider
 * 
 * @example
 * ```typescript
 * function BeatReactiveComponent() {
 *   const { onBeat, isAnalyzing, error } = useAudioAnalysis();
 * 
 *   useEffect(() => {
 *     if (!isAnalyzing) return;
 * 
 *     const unsubscribe = onBeat((strength) => {
 *       console.log('Beat detected:', strength);
 *     });
 * 
 *     return unsubscribe;
 *   }, [isAnalyzing, onBeat]);
 * 
 *   if (error) {
 *     return <div>Audio analysis error: {error}</div>;
 *   }
 * 
 *   return <div>Analyzing: {isAnalyzing}</div>;
 * }
 * ```
 */
export const useAudioAnalysis = (): AudioAnalysisContextValue => {
    const context = useContext(AudioAnalysisContext);

    if (context === undefined) {
        throw new Error('useAudioAnalysis must be used within an AudioAnalysisProvider');
    }

    return context;
};
