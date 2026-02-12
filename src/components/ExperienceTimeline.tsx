import { motion } from "framer-motion";

const experiences = [
  {
    role: "Open Source Contributor",
    org: "PyTorch",
    location: "Remote",
    description:
      "Architectured 'FinancialRegimeEnv', a custom trading environment for training RL agents.",
  },
  {
    role: "Co-Founder",
    org: "ISO and Company Media",
    location: "",
    description:
      "A photography startup specializing in portraits, events, and sports media.",
  },
  {
    role: "Code Sensei",
    org: "Code Ninjas",
    location: "",
    description:
      "Teaching STEM and coding fundamentals to students ages 5-14.",
  },
  {
    role: "Chapter President",
    org: "Athletes to Aid",
    location: "",
    description:
      "Helped raise over $12,000+ serving underserved Columbus athletes.",
  },
];

const ExperienceTimeline = () => {
  return (
    <section id="experience" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-sm font-mono text-primary tracking-widest uppercase mb-12">
          Experience
        </h2>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-10">
            {experiences.map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative pl-12 md:pl-16"
              >
                {/* Dot */}
                <div className="absolute left-2.5 md:left-4.5 top-1.5 w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_hsl(217_91%_60%/0.5)]" />

                <div className="glass-card p-6">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 mb-2">
                    <h3 className="text-foreground font-semibold">
                      {exp.role}
                    </h3>
                    <span className="text-primary font-mono text-sm">
                      @ {exp.org}
                    </span>
                    {exp.location && (
                      <span className="text-muted-foreground text-xs font-mono">
                        ({exp.location})
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    {exp.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceTimeline;
