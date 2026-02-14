import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions, Container } from "@tsparticles/engine";
import { useAudio } from "@/contexts/AudioContext";

const StarfieldBackground = () => {
  const [init, setInit] = useState(false);
  const [container, setContainer] = useState<Container | undefined>();
  const { beatIntensity } = useAudio();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  // React to beats by pulsating random stars
  useEffect(() => {
    if (!container || beatIntensity === 0) return;

    const particles = container.particles.array;
    const numToPulsate = Math.floor(particles.length * 0.15); // Pulsate 15% of stars

    // Sort by size (bigger stars have higher chance)
    const sortedBySize = [...particles].sort((a, b) => {
      const sizeA = typeof a.size.value === 'number' ? a.size.value : 1;
      const sizeB = typeof b.size.value === 'number' ? b.size.value : 1;
      return sizeB - sizeA;
    });

    // Weighted random selection (bigger stars more likely)
    const selected: typeof particles = [];
    for (let i = 0; i < numToPulsate; i++) {
      const weight = Math.random() * Math.random(); // Bias toward 0
      const index = Math.floor(weight * sortedBySize.length);
      selected.push(sortedBySize[index]);
    }

    // Pulsate selected stars
    selected.forEach((particle) => {
      // Store original values if not already stored
      if (!(particle as any)._originalSize) {
        (particle as any)._originalSize = typeof particle.size.value === 'number' ? particle.size.value : 1;
        (particle as any)._originalOpacity = particle.opacity.value || 0.5;
      }

      const originalSize = (particle as any)._originalSize;
      const originalOpacity = (particle as any)._originalOpacity;
      const pulseSize = originalSize * (1 + beatIntensity * 1.5);

      particle.size.value = pulseSize;
      particle.opacity.value = Math.min(originalOpacity + beatIntensity * 0.4, 1);

      // Reset after animation
      setTimeout(() => {
        particle.size.value = originalSize;
        particle.opacity.value = originalOpacity;
      }, 150);
    });
  }, [beatIntensity, container]);

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
      particlesLoaded={async (container) => {
        setContainer(container);
      }}
    />
  );
};

export default StarfieldBackground;
