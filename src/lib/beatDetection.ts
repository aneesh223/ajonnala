/**
 * Beat Detection Module
 * 
 * Provides beat detection functionality by analyzing frequency data
 * from the Web Audio API AnalyserNode. Uses adaptive thresholding
 * to detect beats across varying audio volumes and styles.
 * 
 * @module beatDetection
 */

/**
 * Calculates the energy level from frequency data.
 * 
 * Focuses on low-frequency bins (bass range, bins 0-10) as bass frequencies
 * are most indicative of beats in music. With an FFT size of 2048 and a
 * sample rate of 44.1kHz, this covers approximately 0-430 Hz.
 * 
 * @param frequencyData - Uint8Array of frequency data from AnalyserNode (values 0-255)
 * @returns Normalized energy value (0-1)
 * 
 * @example
 * ```typescript
 * const analyser = audioContext.createAnalyser();
 * const frequencyData = new Uint8Array(analyser.frequencyBinCount);
 * analyser.getByteFrequencyData(frequencyData);
 * 
 * const energy = calculateEnergy(frequencyData);
 * console.log('Current energy:', energy);
 * ```
 */
export function calculateEnergy(frequencyData: Uint8Array): number {
    // Handle empty or invalid data
    if (!frequencyData || frequencyData.length === 0) {
        return 0;
    }

    // Focus on low-frequency bins (bass range, bins 0-10)
    // These frequencies (roughly 0-430 Hz with FFT size 2048 at 44.1kHz sample rate)
    // contain the most beat information
    const bassRange = Math.min(11, frequencyData.length); // bins 0-10 inclusive

    let sum = 0;
    for (let i = 0; i < bassRange; i++) {
        sum += frequencyData[i];
    }

    // Calculate average energy in the bass range
    const averageEnergy = sum / bassRange;

    // Normalize to 0-1 range (frequency data is 0-255)
    const normalizedEnergy = averageEnergy / 255;

    return normalizedEnergy;
}

/**
 * State for beat detection algorithm with adaptive thresholding.
 * 
 * Maintains a rolling history of energy levels to calculate dynamic thresholds
 * that adapt to varying audio volumes and characteristics.
 * 
 * @example
 * ```typescript
 * const state: BeatDetectionState = {
 *   energyHistory: [0.2, 0.3, 0.25, 0.4],
 *   lastBeatTime: 1234567890,
 *   averageEnergy: 0.2875,
 *   varianceEnergy: 0.075
 * };
 * ```
 */
export interface BeatDetectionState {
    /**
     * Rolling window of recent energy levels for threshold calculation.
     * Typically maintains 60 frames (1 second at 60fps).
     */
    energyHistory: number[];

    /**
     * Timestamp of last detected beat in milliseconds.
     * Used for debouncing to prevent multiple detections of the same beat.
     */
    lastBeatTime: number;

    /**
     * Running average energy for threshold calculation.
     * Calculated from the energy history window.
     */
    averageEnergy: number;

    /**
     * Energy variance (standard deviation) for adaptive threshold.
     * Higher variance indicates more dynamic audio requiring higher thresholds.
     */
    varianceEnergy: number;
}

/**
 * BeatDetector class for analyzing audio and detecting beats.
 * 
 * Implements an adaptive beat detection algorithm that analyzes frequency data
 * from the Web Audio API and triggers beat events when energy peaks exceed
 * a dynamic threshold. The threshold adapts to audio characteristics to work
 * across different music styles and volume levels.
 * 
 * @example
 * ```typescript
 * const detector = new BeatDetector(60, 1.3, 100);
 * 
 * function analyzeFrame() {
 *   const frequencyData = new Uint8Array(analyser.frequencyBinCount);
 *   analyser.getByteFrequencyData(frequencyData);
 *   
 *   const beatStrength = detector.detectBeat(frequencyData, performance.now());
 *   if (beatStrength !== null) {
 *     console.log('Beat detected with strength:', beatStrength);
 *   }
 *   
 *   requestAnimationFrame(analyzeFrame);
 * }
 * ```
 */
export class BeatDetector {
    private state: BeatDetectionState;
    private readonly historySize: number;
    private readonly thresholdMultiplier: number;
    private readonly debounceMs: number;

    /**
     * Creates a new BeatDetector instance.
     * 
     * @param historySize - Number of frames to keep in energy history. Typically 60 frames (1 second at 60fps)
     * @param thresholdMultiplier - Multiplier for average energy to determine beat threshold. Higher values make detection less sensitive
     * @param debounceMs - Minimum time between beats in milliseconds. Prevents multiple detections of the same beat
     * 
     * @example
     * ```typescript
     * // Create detector with default settings
     * const detector = new BeatDetector();
     * 
     * // Create detector with custom sensitivity
     * const sensitiveDetector = new BeatDetector(60, 1.2, 80);
     * ```
     */
    constructor(
        historySize: number = 60,
        thresholdMultiplier: number = 1.3,
        debounceMs: number = 100
    ) {
        this.historySize = historySize;
        this.thresholdMultiplier = thresholdMultiplier;
        this.debounceMs = debounceMs;

        this.state = {
            energyHistory: [],
            lastBeatTime: 0,
            averageEnergy: 0,
            varianceEnergy: 0,
        };
    }

    /**
     * Analyzes frequency data and detects if a beat occurred.
     * 
     * Uses adaptive thresholding based on recent energy history to detect beats
     * across varying audio volumes. Implements debouncing to prevent multiple
     * detections of the same beat.
     * 
     * @param frequencyData - Uint8Array of frequency data from AnalyserNode
     * @param timestamp - Current timestamp in milliseconds (typically from performance.now())
     * @returns Beat strength (0-1) if beat detected, null otherwise. Higher values indicate stronger beats
     * 
     * @example
     * ```typescript
     * const detector = new BeatDetector();
     * 
     * function analyzeAudio() {
     *   const frequencyData = new Uint8Array(analyser.frequencyBinCount);
     *   analyser.getByteFrequencyData(frequencyData);
     *   
     *   const beatStrength = detector.detectBeat(frequencyData, performance.now());
     *   if (beatStrength !== null) {
     *     triggerVisualEffect(beatStrength);
     *   }
     * }
     * ```
     */
    detectBeat(frequencyData: Uint8Array, timestamp: number): number | null {
        const energy = calculateEnergy(frequencyData);

        // Update history with current energy
        this.updateHistory(energy);

        // Check debounce - prevent beats too close together
        if (timestamp - this.state.lastBeatTime < this.debounceMs) {
            return null;
        }

        // Calculate dynamic threshold with variance factor
        // Threshold adapts to both average energy level and variability
        const threshold = (this.state.averageEnergy * this.thresholdMultiplier) +
            (this.state.varianceEnergy * 0.5);

        // Detect beat if energy exceeds threshold
        if (energy > threshold && this.state.averageEnergy > 0) {
            this.state.lastBeatTime = timestamp;

            // Calculate beat strength (0-1) based on how much energy exceeds threshold
            const beatStrength = Math.min(1, (energy - threshold) / threshold);

            return beatStrength;
        }

        return null;
    }

    /**
     * Updates internal state with new energy value.
     * 
     * Maintains a rolling window of energy history and calculates
     * running statistics (average and variance) used for adaptive thresholding.
     * Optimized to minimize allocations and reuse calculations.
     * 
     * @param energy - Current energy value to add to history (0-1)
     * 
     * @example
     * ```typescript
     * const detector = new BeatDetector();
     * const energy = calculateEnergy(frequencyData);
     * detector.updateHistory(energy);
     * ```
     */
    updateHistory(energy: number): void {
        const history = this.state.energyHistory;

        // Add to history
        history.push(energy);

        // Maintain history size limit - remove oldest entry
        if (history.length > this.historySize) {
            history.shift();
        }

        // Calculate average energy using cached sum
        let sum = 0;
        const len = history.length;
        for (let i = 0; i < len; i++) {
            sum += history[i];
        }
        this.state.averageEnergy = sum / len;

        // Calculate variance efficiently
        let varianceSum = 0;
        const avg = this.state.averageEnergy;
        for (let i = 0; i < len; i++) {
            const diff = history[i] - avg;
            varianceSum += diff * diff;
        }
        this.state.varianceEnergy = Math.sqrt(varianceSum / len);
    }

    /**
     * Gets the current beat detection state.
     * 
     * Useful for testing, debugging, or monitoring the detector's internal state.
     * Returns a readonly copy to prevent external modification.
     * 
     * @returns Readonly copy of the current beat detection state
     * 
     * @example
     * ```typescript
     * const detector = new BeatDetector();
     * const state = detector.getState();
     * console.log('Average energy:', state.averageEnergy);
     * console.log('History size:', state.energyHistory.length);
     * ```
     */
    getState(): Readonly<BeatDetectionState> {
        return { ...this.state };
    }

    /**
     * Resets the beat detector state to initial values.
     * 
     * Clears energy history, resets statistics, and allows the detector
     * to adapt to new audio from scratch. Useful when switching audio sources.
     * 
     * @example
     * ```typescript
     * const detector = new BeatDetector();
     * 
     * // When switching to a new audio track
     * detector.reset();
     * ```
     */
    reset(): void {
        this.state = {
            energyHistory: [],
            lastBeatTime: 0,
            averageEnergy: 0,
            varianceEnergy: 0,
        };
    }
}
