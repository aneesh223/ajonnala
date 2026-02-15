import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { useAudioAnalysis } from "../contexts/AudioAnalysisContext";
import { selectStars } from "../lib/weightedSelection";
import { PulsationManager } from "../lib/pulsationManager";

const StarfieldBackground = () => {
  const [init, setInit] = useState(false);
  const containerRef = useRef<any>(null);
  const pulsationManagerRef = useRef<PulsationManager | null>(null);
  // Track particles that need smooth decay back to original size
  const decayingParticlesRef = useRef<Map<string, { originalSize: number }>>(new Map());

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
    // Handler for processing beats (used by both real and fake detection)
    const processBeat = (strength: number) => {

      // Get particles from container
      if (!containerRef.current) {
        console.log('processBeat: No container ref');
        return;
      }

      const container = containerRef.current;

      // Try multiple ways to access particles (tsparticles API varies)
      const particles = container.particles?.array ||
        container.particles?._array ||
        container._particles?.array ||
        [];

      if (particles.length === 0) {
        console.log('processBeat: No particles found, container:', container);
        return;
      }

      console.log(`processBeat: Processing ${particles.length} particles with strength ${strength.toFixed(2)}`);

      // Convert particles to format expected by selectStars
      const particleData = particles.map((p: any) => ({
        id: p.id,
        size: p.size?.value || 1,
      }));

      // Calculate selection percentages based on configuration
      const minPercent = config.selectionPercentage * 0.5;
      const maxPercent = config.selectionPercentage * 1.5;

      // Use selectStars with custom configuration
      const selectedParticles = selectStars(particleData, strength, {
        minSelectionPercent: minPercent,
        maxSelectionPercent: maxPercent,
        sizeWeightExponent: 2,
      });

      console.log(`processBeat: Selected ${selectedParticles.length} particles to pulsate`);

      // Start pulsations via PulsationManager with configured intensity
      const currentTime = performance.now();
      selectedParticles.forEach((particle) => {
        const adjustedStrength = strength * config.pulsationIntensity;

        pulsationManagerRef.current?.startPulsation(
          particle.id,
          adjustedStrength,
          particle.size,
          currentTime
        );
      });
    };

    // Always listen for fake beats (from MusicDisc)
    const handleFakeBeat = ((event: CustomEvent) => {
      processBeat(event.detail.strength);
    }) as EventListener;

    window.addEventListener('musicbeat', handleFakeBeat);

    // Also subscribe to real audio analysis if supported
    let unsubscribeRealAudio: (() => void) | undefined;
    if (isWebAudioSupported) {
      unsubscribeRealAudio = onBeat((strength) => {
        processBeat(strength);
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('musicbeat', handleFakeBeat);
      if (unsubscribeRealAudio) {
        unsubscribeRealAudio();
      }
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

      const container = containerRef.current;
      const particles = container.particles?.array ||
        container.particles?._array ||
        container._particles?.array ||
        [];

      // Build a lookup for fast access by particle id
      const particleMap = new Map<string, any>();
      for (let i = 0; i < particles.length; i++) {
        particleMap.set(particles[i].id, particles[i]);
      }

      // 1. Apply active pulsation scales (only touch pulsating particles)
      for (const [particleId, scale] of scaleMultipliers.entries()) {
        const particle = particleMap.get(particleId);
        if (!particle?.size) continue;

        // Capture original size on first pulsation
        if (!particle._originalSize) {
          particle._originalSize = particle.size.value;
        }
        particle.size.value = particle._originalSize * scale;

        // If scale is 1.0 (completed), move to decay tracking
        if (scale === 1.0) {
          decayingParticlesRef.current.set(particleId, { originalSize: particle._originalSize });
        }
      }

      // 2. Smooth decay for particles that finished pulsating
      const decaying = decayingParticlesRef.current;
      for (const [particleId, data] of decaying.entries()) {
        // Skip if still actively pulsating
        if (scaleMultipliers.has(particleId)) continue;

        const particle = particleMap.get(particleId);
        if (!particle?.size) {
          decaying.delete(particleId);
          continue;
        }

        const current = particle.size.value;
        const target = data.originalSize;
        const diff = Math.abs(current - target);

        if (diff < 0.01) {
          particle.size.value = target;
          delete particle._originalSize;
          decaying.delete(particleId);
        } else {
          particle.size.value = current + (target - current) * 0.15;
        }
      }

      // Cleanup completed pulsations
      pulsationManagerRef.current.cleanup(currentTime);

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
          value: { min: 1.5, max: 4.5 },
        },
        move: {
          enable: true,
          speed: 0.1,
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
