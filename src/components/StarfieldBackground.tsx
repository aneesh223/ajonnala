import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

const StarfieldBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
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
    />
  );
};

export default StarfieldBackground;
