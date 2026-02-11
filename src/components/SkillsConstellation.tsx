import { motion } from "framer-motion";

const skillCategories = [
  {
    label: "AI & Finance",
    skills: ["PyTorch", "Reinforcement Learning", "Quantitative Finance", "Artificial Intelligence", "Natural Language Processing", "Algorithmic Trading", "Computer Vision (Learning)"],
  },
  {
    label: "Languages",
    skills: ["Python", "Java", "R", "JavaScript", "C++ (Learning)"],
  },
  {
    label: "Tools & Frameworks",
    skills: ["Git", "Flask", "Django", "Twilio", "Adobe Camera Raw", "OOP", "Software Architecture"],
  },
  {
    label: "Photography & Media",
    skills: ["Photography", "Event Photography", "Event Management", "Event Planning"],
  },
  {
    label: "Education & Leadership",
    skills: ["Teaching", "Tutoring", "Educational Technology", "Educational Leadership", "Classroom Management", "Working with Children", "Working with Adolescents", "Communication"],
  },
];

const SkillsConstellation = () => {
  return (
    <section id="skills" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-sm font-mono text-primary tracking-widest uppercase mb-12">
          Skills
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {skillCategories.map((cat, ci) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: ci * 0.15 }}
            >
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
                {cat.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {cat.skills.map((skill, si) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: ci * 0.15 + si * 0.05 }}
                    whileHover={{ scale: 1.08, y: -2 }}
                    className="px-4 py-2 glass-card text-sm font-mono text-foreground/80 cursor-default
                      hover:border-primary/30 hover:text-primary hover:shadow-[0_0_16px_hsl(217_91%_60%/0.15)] transition-all duration-300"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsConstellation;
