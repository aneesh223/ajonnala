import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { useAudioAnalysis } from "../contexts/AudioAnalysisContext";
import { selectStars } from "../lib/weightedSelection";
import { PulsationManager } from "../lib/pulsationManager";

const StarfieldBackground = () => {
  const [init, setInit] = useState(false);
  const [beatStrength, setBeatStrength] = useState<number>(0);
  const containerRef = useRef<any>(null);
  const pulsationManagerRef = useRef<PulsationManager | null>(null);

  // Subscribe to audio analysis context
  const { onBeat, isWebAudioSupported, config } = useAudioAnalysis();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  // Initialize PulsationManager
  useEffect(() => {
    pulsationManagerRef.current = new PulsationManager();
  }, []);

  // Subscribe to beat events and trigger pulsations
  useEffect(() => {
    // Only subscribe if Web Audio API is supported
    if (!isWebAudioSupported) {
      return;
    }

    const unsubscribe = onBeat((strength) => {
      setBeatStrength(strength);

      // Get particles from container
      if (!containerRef.current) return;

      const container = containerRef.current;
      const particles = container.particles?.array || [];

      if (particles.length === 0) return;

      // Convert particles to format expected by selectStars
      const particleData = particles.map((p: any) => ({
        id: p.id,
        size: p.size?.value || 1,
      }));

      // Calculate selection percentages based on configuration
      // The config.selectionPercentage is the base (at medium beat strength)
      // We scale it: weak beats use 50% of base, strong beats use 150% of base
      const minPercent = config.selectionPercentage * 0.5;
      const maxPercent = config.selectionPercentage * 1.5;

      // Use selectStars with custom configuration
      const selectedParticles = selectStars(particleData, strength, {
        minSelectionPercent: minPercent,
        maxSelectionPercent: maxPercent,
        sizeWeightExponent: 2, // Keep quadratic weighting
      });

      // Start pulsations via PulsationManager with configured intensity
      const currentTime = performance.now();
      selectedParticles.forEach((particle) => {
        // Scale beat strength by pulsation intensity configuration
        const adjustedStrength = strength * config.pulsationIntensity;

        pulsationManagerRef.current?.startPulsation(
          particle.id,
          adjustedStrength,
          particle.size,
          currentTime
        );
      });
    });

    // Unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, [onBeat, isWebAudioSupported, config]);

  // Animation loop to update pulsations
  useEffect(() => {
    let animationFrameId: number;

    const updatePulsations = () => {
      if (!containerRef.current || !pulsationManagerRef.current) {
        animationFrameId = requestAnimationFrame(updatePulsations);
        return;
      }

      const currentTime = performance.now();
      const scaleMultipliers = pulsationManagerRef.current.updatePulsations(currentTime);

      // Only update particles if there are active pulsations
      if (scaleMultipliers.size > 0) {
        const container = containerRef.current;
        const particles = container.particles?.array || [];

        // Batch particle updates to minimize overhead
        for (let i = 0; i < particles.length; i++) {
          const particle = particles[i];
          const scale = scaleMultipliers.get(particle.id);

          if (scale !== undefined) {
            // Store original size if not already stored
            if (!particle._originalSize) {
              particle._originalSize = particle.size?.value || 1;
            }
            // Apply scale
            if (particle.size) {
              particle.size.value = particle._originalSize * scale;
            }
          } else if (particle._originalSize && particle.size) {
            // Reset to original size if not pulsating
            particle.size.value = particle._originalSize;
          }
        }

        // Cleanup completed pulsations
        pulsationManagerRef.current.cleanup(currentTime);
      }

      animationFrameId = requestAnimationFrame(updatePulsations);
    };

    if (init) {
      animationFrameId = requestAnimationFrame(updatePulsations);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [init]);

  const particlesLoaded = useCallback(async (container: any) => {
    containerRef.current = container;
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: {
          value: 120,
          density: { enable: true, width: 1920, height: 1080 },
        },
        color: { value: ["#ffffff", "#c0c0c0", "#a0a0a0"] },
        opacity: {
          value: { min: 0.1, max: 0.8 },
          animation: { enable: true, speed: 0.5, sync: false },
        },
        size: {
          value: { min: 0.5, max: 2.5 },
        },
        move: {
          enable: true,
          speed: 0.3,
          direction: "none" as const,
          random: true,
          straight: false,
          outModes: { default: "out" as const },
        },
        links: {
          enable: true,
          distance: 120,
          color: "#3B82F6",
          opacity: 0.08,
          width: 0.5,
        },
      },
      interactivity: {
        detectsOn: "window" as const,
        events: {
          onHover: {
            enable: true,
            mode: "grab",
          },
        },
        modes: {
          grab: {
            distance: 180,
            links: {
              opacity: 0.25,
              color: "#3B82F6",
            },
          },
        },
      },
      detectRetina: true,
      responsive: [
        {
          maxWidth: 768,
          options: {
            particles: {
              number: { value: 40 },
              links: { enable: false },
            },
            interactivity: {
              events: {
                onHover: { enable: false },
              },
            },
          },
        },
      ],
    }),
    []
  );

  if (!init) return null;

  return (
    <Particles
      id="starfield"
      className="fixed inset-0 z-0"
      options={options}
      particlesLoaded={particlesLoaded}
    />
  );
}

export default StarfieldBackground;
