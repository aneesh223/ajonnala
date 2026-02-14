/**
 * Weighted Star Selection Module
 * 
 * Provides weighted random selection of particles for beat-reactive pulsation.
 * Larger particles have higher probability of selection based on configurable
 * weighting (quadratic by default), creating a natural visual hierarchy where
 * prominent stars react more frequently to beats.
 * 
 * @module weightedSelection
 */

/**
 * Configuration for star selection behavior.
 * 
 * Controls how many particles are selected per beat and how size affects
 * selection probability.
 * 
 * @example
 * ```typescript
 * const config: StarSelectionConfig = {
 *   minSelectionPercent: 0.05,  // Select at least 5% of particles
 *   maxSelectionPercent: 0.15,  // Select at most 15% of particles
 *   sizeWeightExponent: 2       // Quadratic weighting (size^2)
 * };
 * ```
 */
export interface StarSelectionConfig {
    /**
     * Minimum percentage of particles to select per beat.
     * Used when beat strength is 0.
     * 
     * @default 0.05 (5%)
     */
    minSelectionPercent: number;

    /**
     * Maximum percentage of particles to select per beat.
     * Used when beat strength is 1.
     * 
     * @default 0.15 (15%)
     */
    maxSelectionPercent: number;

    /**
     * Exponent for size-based weighting.
     * Higher values increase the advantage of larger particles.
     * 
     * @default 2 (quadratic weighting)
     */
    sizeWeightExponent: number;
}

/**
 * Represents a particle with size information for selection.
 * 
 * Minimal interface required for weighted selection algorithm.
 * 
 * @example
 * ```typescript
 * const particle: Particle = {
 *   id: 'particle-123',
 *   size: 3.5
 * };
 * ```
 */
export interface Particle {
    /**
     * Unique identifier for the particle.
     * Used to track which particles are selected.
     */
    id: string;

    /**
     * Size or radius of the particle.
     * Larger values result in higher selection probability.
     */
    size: number;
}

/**
 * Calculates the selection weight for a particle based on its size.
 * 
 * Uses exponential weighting (size^exponent) to favor larger particles.
 * The default quadratic weighting (exponent=2) means a particle twice as large
 * is four times more likely to be selected.
 * 
 * @param particle - The particle to calculate weight for
 * @param exponent - The exponent to apply to size (default: 2 for quadratic)
 * @returns The calculated weight (0 or positive number)
 * 
 * @example
 * ```typescript
 * const smallParticle = { id: '1', size: 2 };
 * const largeParticle = { id: '2', size: 4 };
 * 
 * const smallWeight = calculateWeight(smallParticle);  // 4
 * const largeWeight = calculateWeight(largeParticle);  // 16
 * // Large particle is 4x more likely to be selected
 * ```
 */
export function calculateWeight(particle: Particle, exponent: number = 2): number {
    // Handle edge cases
    if (particle.size <= 0) {
        return 0;
    }

    // Calculate weight using size^exponent
    return Math.pow(particle.size, exponent);
}

/**
 * Default configuration for star selection.
 * 
 * Provides sensible defaults optimized for music beat detection:
 * - 5-15% selection range creates visible but not overwhelming effects
 * - Quadratic weighting creates natural visual hierarchy
 * 
 * @example
 * ```typescript
 * // Use default config
 * const selected = selectStars(particles, beatStrength);
 * 
 * // Override specific values
 * const customConfig = {
 *   ...DEFAULT_SELECTION_CONFIG,
 *   maxSelectionPercent: 0.20  // Select up to 20%
 * };
 * ```
 */
export const DEFAULT_SELECTION_CONFIG: StarSelectionConfig = {
    minSelectionPercent: 0.05,
    maxSelectionPercent: 0.15,
    sizeWeightExponent: 2,
};

/**
 * Selects particles using weighted random selection based on size.
 * 
 * Selection count is determined by beat strength, interpolating between
 * minSelectionPercent and maxSelectionPercent. Uses weighted random sampling
 * without replacement, where larger particles have higher probability of selection.
 * 
 * @param particles - Array of particles to select from
 * @param beatStrength - Beat intensity (0-1) that scales selection count
 * @param config - Configuration for selection behavior (uses defaults if not provided)
 * @returns Array of selected particles (empty if no particles provided)
 * 
 * @example
 * ```typescript
 * const particles = [
 *   { id: '1', size: 2 },
 *   { id: '2', size: 4 },
 *   { id: '3', size: 3 }
 * ];
 * 
 * // Weak beat: selects ~5% of particles
 * const weakSelection = selectStars(particles, 0.2);
 * 
 * // Strong beat: selects ~15% of particles
 * const strongSelection = selectStars(particles, 1.0);
 * 
 * // Custom configuration
 * const customSelection = selectStars(particles, 0.5, {
 *   minSelectionPercent: 0.10,
 *   maxSelectionPercent: 0.25,
 *   sizeWeightExponent: 3  // Cubic weighting
 * });
 * ```
 */
export function selectStars(
    particles: Particle[],
    beatStrength: number,
    config: StarSelectionConfig = DEFAULT_SELECTION_CONFIG
): Particle[] {
    // Handle edge cases
    if (particles.length === 0) {
        return [];
    }

    // Clamp beat strength to valid range
    const clampedBeatStrength = Math.max(0, Math.min(1, beatStrength));

    // Calculate selection count based on beat strength
    // Interpolate between min and max percentage based on beat strength
    const selectionPercent = config.minSelectionPercent +
        (config.maxSelectionPercent - config.minSelectionPercent) * clampedBeatStrength;

    const selectionCount = Math.max(1, Math.floor(particles.length * selectionPercent));

    // Calculate weights for all particles
    const weights = particles.map(p => calculateWeight(p, config.sizeWeightExponent));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Handle case where all weights are zero
    if (totalWeight === 0) {
        // Fall back to uniform random selection
        return selectUniformRandom(particles, selectionCount);
    }

    // Perform weighted random sampling without replacement
    const selected: Particle[] = [];
    const availableParticles = [...particles];
    const availableWeights = [...weights];

    for (let i = 0; i < selectionCount && availableParticles.length > 0; i++) {
        // Calculate current total weight
        const currentTotalWeight = availableWeights.reduce((sum, w) => sum + w, 0);

        // Generate random value in range [0, totalWeight)
        const randomValue = Math.random() * currentTotalWeight;

        // Find the particle corresponding to this random value
        let cumulativeWeight = 0;
        let selectedIndex = 0;

        for (let j = 0; j < availableWeights.length; j++) {
            cumulativeWeight += availableWeights[j];
            if (randomValue < cumulativeWeight) {
                selectedIndex = j;
                break;
            }
        }

        // Add selected particle to result
        selected.push(availableParticles[selectedIndex]);

        // Remove selected particle and its weight (sampling without replacement)
        availableParticles.splice(selectedIndex, 1);
        availableWeights.splice(selectedIndex, 1);
    }

    return selected;
}

/**
 * Helper function for uniform random selection (fallback when all weights are zero)
 */
function selectUniformRandom(particles: Particle[], count: number): Particle[] {
    const shuffled = [...particles].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, particles.length));
}
