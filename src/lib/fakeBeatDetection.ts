/**
 * Simulates beat detection when actual audio analysis isn't available (e.g., CORS restrictions).
 * Uses a configurable BPM to trigger beats at regular intervals.
 */

export class FakeBeatDetector {
    private intervalId: number | null = null;
    private callbacks: Set<(strength: number) => void> = new Set();
    private bpm: number;
    private isRunning: boolean = false;

    /**
     * @param bpm - Beats per minute (typical range: 60-180)
     */
    constructor(bpm: number = 120) {
        this.bpm = bpm;
    }

    /**
     * Start generating fake beats
     */
    start(): void {
        if (this.isRunning) {
            console.log('FakeBeatDetector: Already running');
            return;
        }

        this.isRunning = true;
        const intervalMs = (60 / this.bpm) * 1000;
        console.log(`FakeBeatDetector: Starting at ${this.bpm} BPM (interval: ${intervalMs.toFixed(0)}ms)`);

        this.intervalId = window.setInterval(() => {
            // Vary beat strength slightly for more natural feel (0.6-1.0)
            const strength = 0.6 + Math.random() * 0.4;
            console.log(`FakeBeatDetector: Beat! strength=${strength.toFixed(2)}, callbacks=${this.callbacks.size}`);

            this.callbacks.forEach(callback => {
                try {
                    callback(strength);
                } catch (err) {
                    console.error('Error in fake beat callback:', err);
                }
            });
        }, intervalMs);
    }

    /**
     * Stop generating beats
     */
    stop(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    /**
     * Update the BPM
     */
    setBPM(bpm: number): void {
        this.bpm = bpm;
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }

    /**
     * Register a callback for beat events
     */
    onBeat(callback: (strength: number) => void): () => void {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Check if detector is running
     */
    getIsRunning(): boolean {
        return this.isRunning;
    }
}
