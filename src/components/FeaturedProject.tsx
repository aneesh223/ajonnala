import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const projects = [
  {
    title: "Orthrus",
    subtitle: "Autonomous Quant Trading Engine",
    description:
      "A hybrid NLP pipeline (DistilRoBERTa + VADER) for sentiment analysis and adaptive market regime detection.",
    badge: "🔥 Now featured in PyTorch/RL!",
    techStack: ["Python", "PyTorch", "NumPy", "Pandas", "Git"],
    url: "https://github.com/aneesh223/orthrusquant",
  },
  {
    title: "Subfab Drain Sentry",
    subtitle: "MakeOHI/O 2026 - Intel Challenge",
    description:
      "Real-time C++ firmware and a 3-tier algorithmic routing matrix on an ARM Cortex-M33 to dynamically classify wastewater for direct reuse, filtration, or disposal.",
    techStack: ["C++", "GPIO", "ARM Cortex-M", "Sensors"],
    url: "https://github.com/aneesh223/makeohio26-intel",
  },
];

const FeaturedProject = () => {
  return (
    <section id="projects" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-sm font-mono text-primary tracking-widest uppercase mb-4">
            Featured Projects
          </h2>
          <div className="space-y-8">
            {projects.map((project) => (
              <div key={project.title} className="glass-card-hover p-8 md:p-12">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground text-sm font-mono">
                      {project.subtitle}
                    </p>
                  </div>
                  {project.badge && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold bg-accent/15 text-accent border border-accent/20 whitespace-nowrap">
                      {project.badge}
                    </span>
                  )}
                </div>

                <p className="text-foreground/80 leading-relaxed mb-8 max-w-3xl">
                  {project.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 rounded-md text-xs font-mono text-primary bg-primary/10 border border-primary/15"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono text-muted-foreground border border-border bg-secondary/50 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                  >
                    View Repository
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProject;
