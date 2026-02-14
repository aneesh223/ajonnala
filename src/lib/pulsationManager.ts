/**
 * Pulsation Manager Module
 * 
 * Manages pulsation effects for particles in the beat-reactive starfield.
 * Handles starting, updating, and cleaning up pulsation animations with
 * smooth easing and concurrent pulsation limits for optimal performance.
 * 
 * @module pulsationManager
 */

/**
 * State for a single particle pulsation.
 * 
 * Tracks all information needed to calculate the current pulsation effect
 * for a particle at any given time.
 * 
 * @example
 * ```typescript
 * const pulsation: PulsationState = {
 *   particleId: 'particle-123',
 *   startTime: 1234567890,
 *   duration: 300,
 *   peakScale: 1.75,
 *   originalSize: 3.0
 * };
 * ```
 */
export interface PulsationState {
    /**
     * Unique identifier for the particle.
     * Matches the particle's ID in the particle system.
     */
    particleId: string;

    /**
     * Timestamp when pulsation started in milliseconds.
     * Typically from performance.now().
     */
    startTime: number;

    /**
     * Duration of the pulsation effect in milliseconds.
     * Ranges from 200-400ms based on beat strength.
     */
    duration: number;

    /**
     * Peak scale multiplier for the pulsation.
     * Ranges from 1.5-2.0x original size based on beat strength.
     */
    peakScale: number;

    /**
     * Original size of the particle before pulsation.
     * Used to restore the particle after pulsation completes.
     */
    originalSize: number;
}

/**
 * PulsationManager class for managing particle pulsation effects.
 * 
 * Provides a centralized system for starting, updating, and cleaning up
 * pulsation animations. Implements concurrent pulsation limits and smooth
 * easing for professional-looking effects.
 * 
 * @example
 * ```typescript
 * const manager = new PulsationManager(30);
 * 
 * // Start pulsation on beat
 * function onBeat(beatStrength: number) {
 *   const selectedParticles = selectStars(particles, beatStrength);
 *   selectedParticles.forEach(particle => {
 *     manager.startPulsation(particle.id, beatStrength, particle.size, performance.now());
 *   });
 * }
 * 
 * // Update in animation loop
 * function animate() {
 *   const currentTime = performance.now();
 *   const scales = manager.updatePulsations(currentTime);
 *   
 *   scales.forEach((scale, particleId) => {
 *     updateParticleSize(particleId, scale);
 *   });
 *   
 *   manager.cleanup(currentTime);
 *   requestAnimationFrame(animate);
 * }
 * ```
 */
export class PulsationManager {
    private pulsations: Map<string, PulsationState>;
    private readonly maxConcurrentPulsations: number;

    /**
     * Creates a new PulsationManager instance.
     * 
     * @param maxConcurrentPulsations - Maximum number of simultaneous pulsations. Limits performance impact
     * 
     * @example
     * ```typescript
     * // Create with default limit (30 concurrent pulsations)
     * const manager = new PulsationManager();
     * 
     * // Create with custom limit for lower-end devices
     * const mobileManager = new PulsationManager(15);
     * ```
     */
    constructor(maxConcurrentPulsations: number = 30) {
        this.pulsations = new Map();
        this.maxConcurrentPulsations = maxConcurrentPulsations;
    }

    /**
     * Starts a new pulsation for a particle.
     * 
     * If the particle is already pulsating, restarts the effect with new parameters.
     * If the concurrent pulsation limit is reached, removes the oldest pulsation
     * to make room for the new one.
     * 
     * @param particleId - Unique identifier for the particle
     * @param beatStrength - Beat intensity (0-1) that scales the effect magnitude and duration
     * @param originalSize - Original size of the particle before pulsation
     * @param currentTime - Current timestamp in milliseconds (typically from performance.now())
     * 
     * @example
     * ```typescript
     * const manager = new PulsationManager();
     * 
     * // Start pulsation on beat detection
     * manager.startPulsation('particle-123', 0.8, 3.0, performance.now());
     * 
     * // Weak beat: smaller, shorter pulsation
     * manager.startPulsation('particle-456', 0.2, 2.5, performance.now());
     * 
     * // Strong beat: larger, longer pulsation
     * manager.startPulsation('particle-789', 1.0, 4.0, performance.now());
     * ```
     */
    startPulsation(
        particleId: string,
        beatStrength: number,
        originalSize: number,
        currentTime: number
    ): void {
        // FIX 1: Prevent "Teleporting" by ignoring beats for particles already animating.
        // If we restart, the size snaps from Current -> Start instantly.
        if (this.pulsations.has(particleId)) {
            return;
        }

        // Clamp beat strength to valid range
        const clampedBeatStrength = Math.max(0, Math.min(1, beatStrength));

        // Calculate peak scale based on beat strength (1.5x to 2.0x)
        // Stronger beats produce larger pulsations
        const peakScale = 1.5 + (clampedBeatStrength * 0.5);

        // Calculate duration based on beat strength (200ms to 400ms)
        // Stronger beats have longer durations
        const duration = 200 + (clampedBeatStrength * 200);

        // Check if we've reached the concurrent pulsation limit
        if (this.pulsations.size >= this.maxConcurrentPulsations) {
            // Find and remove the oldest pulsation to make room
            let oldestTime = Infinity;
            let oldestId = '';

            for (const [id, state] of this.pulsations.entries()) {
                if (state.startTime < oldestTime) {
                    oldestTime = state.startTime;
                    oldestId = id;
                }
            }

            if (oldestId) {
                this.pulsations.delete(oldestId);
            }
        }

        // Create pulsation state
        const pulsationState: PulsationState = {
            particleId,
            startTime: currentTime,
            duration,
            peakScale,
            originalSize,
        };

        this.pulsations.set(particleId, pulsationState);
    }

    /**
     * Updates all active pulsations and returns current scale multipliers.
     * 
     * Should be called every frame in the animation loop. Calculates the current
     * scale for each pulsating particle based on elapsed time and easing function.
     * Completed pulsations are not included in the returned map.
     * 
     * @param currentTime - Current timestamp in milliseconds (typically from performance.now())
     * @returns Map of particle ID to current scale multiplier (1.0 = normal size, >1.0 = enlarged)
     * 
     * @example
     * ```typescript
     * const manager = new PulsationManager();
     * 
     * function animate() {
     *   const currentTime = performance.now();
     *   const scales = manager.updatePulsations(currentTime);
     *   
     *   // Apply scales to particles
     *   scales.forEach((scale, particleId) => {
     *     const particle = getParticle(particleId);
     *     particle.size = particle.originalSize * scale;
     *   });
     *   
     *   // Clean up completed pulsations
     *   manager.cleanup(currentTime);
     *   
     *   requestAnimationFrame(animate);
     * }
     * ```
     */
    updatePulsations(currentTime: number): Map<string, number> {
        const scaleMultipliers = new Map<string, number>();

        // Update each active pulsation
        for (const [particleId, state] of this.pulsations.entries()) {
            const elapsed = currentTime - state.startTime;

            // Skip if pulsation hasn't started yet (negative elapsed time)
            if (elapsed < 0) {
                continue;
            }

            // Check if pulsation is complete
            if (elapsed >= state.duration) {
                // Mark for cleanup (will be removed after this update)
                continue;
            }

            // Calculate current scale using easing function
            const progress = elapsed / state.duration;
            const scale = this.calculateScale(progress, state.peakScale);

            scaleMultipliers.set(particleId, scale);
        }

        return scaleMultipliers;
    }

    /**
     * Calculates the current scale multiplier based on progress through the pulsation.
     * 
     * Uses a sine wave for smooth growth (attack) and decay back to normal size.
     * The sine wave creates a natural pulsation that grows from 1.0 to peak and back to 1.0.
     * 
     * @param progress - Progress through pulsation (0-1, where 0=start, 1=end)
     * @param peakScale - Peak scale multiplier (1.5-2.0)
     * @returns Current scale multiplier
     * 
     * @private
     */
    private calculateScale(progress: number, peakScale: number): number {
        // Use a Sine wave for smooth grow (attack) and shrink (decay)
        // Math.sin(0) = 0 (Start at normal size)
        // Math.sin(PI/2) = 1 (Peak size at 50% duration)
        // Math.sin(PI) = 0 (End at normal size)
        const sineValue = Math.sin(progress * Math.PI);

        // Interpolate: 1.0 + (difference * sineCurve)
        const scale = 1.0 + ((peakScale - 1.0) * sineValue);

        return scale;
    }

    /**
     * Returns the current scale multiplier for a specific particle.
     * 
     * Note: This method currently returns 1.0 regardless of pulsation state.
     * Use updatePulsations() to get accurate scale values for all pulsating particles.
     * 
     * @param particleId - Unique identifier for the particle
     * @returns Current scale multiplier (always 1.0 in current implementation)
     * 
     * @deprecated Use updatePulsations() instead for accurate scale values
     */
    getCurrentScale(particleId: string): number {
        return this.pulsations.has(particleId) ? 1.0 : 1.0;
    }

    /**
     * Cleans up completed pulsations.
     * 
     * Should be called after updatePulsations() to remove finished effects
     * and free memory. Removes all pulsations that have exceeded their duration.
     * Optimized to avoid temporary array allocations.
     * 
     * @param currentTime - Current timestamp in milliseconds (typically from performance.now())
     * 
     * @example
     * ```typescript
     * function animate() {
     *   const currentTime = performance.now();
     *   
     *   // Update and apply pulsations
     *   const scales = manager.updatePulsations(currentTime);
     *   applyScales(scales);
     *   
     *   // Clean up completed pulsations
     *   manager.cleanup(currentTime);
     *   
     *   requestAnimationFrame(animate);
     * }
     * ```
     */
    cleanup(currentTime: number): void {
        // Iterate and delete in place to avoid temporary array allocation
        for (const [particleId, state] of this.pulsations.entries()) {
            const elapsed = currentTime - state.startTime;

            if (elapsed >= state.duration) {
                this.pulsations.delete(particleId);
            }
        }
    }

    /**
     * Gets the number of currently active pulsations.
     * 
     * Useful for monitoring performance and debugging.
     * 
     * @returns Number of particles currently pulsating
     * 
     * @example
     * ```typescript
     * const manager = new PulsationManager(30);
     * console.log('Active pulsations:', manager.getActivePulsationCount());
     * ```
     */
    getActivePulsationCount(): number {
        return this.pulsations.size;
    }

    /**
     * Checks if a specific particle is currently pulsating.
     * 
     * @param particleId - Unique identifier for the particle
     * @returns True if the particle is currently pulsating, false otherwise
     * 
     * @example
     * ```typescript
     * if (manager.isPulsating('particle-123')) {
     *   console.log('Particle is pulsating');
     * }
     * ```
     */
    isPulsating(particleId: string): boolean {
        return this.pulsations.has(particleId);
    }

    /**
     * Clears all active pulsations.
     * 
     * Immediately stops all pulsation effects and resets the manager state.
     * Useful when switching audio sources or resetting the visualization.
     * 
     * @example
     * ```typescript
     * // Reset when changing audio tracks
     * function onTrackChange() {
     *   manager.reset();
     * }
     * ```
     */
    reset(): void {
        this.pulsations.clear();
    }
}
