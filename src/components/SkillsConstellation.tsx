import { motion } from "framer-motion";

const leftColumn = [
  {
    label: "Languages",
    skills: ["Python", "Java", "R", "JavaScript", "C++ (Learning)"],
  },
  {
    label: "Tools & Frameworks",
    skills: ["PyTorch", "Git", "Flask", "Django", "Twilio", "OOP", "Software Architecture"],
  },
];

const rightColumn = [
  {
    label: "AI",
    skills: ["Reinforcement Learning", "Natural Language Processing", "Computer Vision (Learning)"],
  },
  {
    label: "Finance & Trading",
    skills: ["Quantitative Finance", "Algorithmic Trading"],
  },
];

const leadershipSkills = [
  {
    label: "Photography & Media",
    skills: ["Photography", "Event Management", "Adobe Photoshop", "Adobe Lightroom", "Entrepreneurship"],
  },
  {
    label: "Education & Leadership",
    skills: ["Teaching", "Educational Technology", "Educational Leadership", "Classroom Management", "Working with Children", "Communication"],
  },
];

const SkillChips = ({ skills, categoryIndex }: { skills: string[]; categoryIndex: number }) => (
  <div className="flex flex-wrap gap-2">
    {skills.map((skill, si) => (
      <motion.span
        key={skill}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: categoryIndex * 0.15 + si * 0.05 }}
        whileHover={{ scale: 1.08, y: -2 }}
        className="px-4 py-2 glass-card text-sm font-mono text-foreground/80 cursor-default
          hover:border-primary/30 hover:text-primary hover:shadow-[0_0_16px_hsl(217_91%_60%/0.15)] transition-all duration-300"
      >
        {skill}
      </motion.span>
    ))}
  </div>
);

const CategoryBlock = ({ cat, ci }: { cat: { label: string; skills: string[] }; ci: number }) => (
  <motion.div
    key={cat.label}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay: ci * 0.15 }}
  >
    <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">
      {cat.label}
    </h4>
    <SkillChips skills={cat.skills} categoryIndex={ci} />
  </motion.div>
);

const SkillsConstellation = () => {
  return (
    <section id="skills" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-sm font-mono text-primary tracking-widest uppercase mb-12">
          Skills
        </h2>

        <h3 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider mb-6 border-b border-border/30 pb-2">Technical</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-8">
            {leftColumn.map((cat, ci) => (
              <CategoryBlock key={cat.label} cat={cat} ci={ci} />
            ))}
          </div>
          <div className="space-y-8">
            {rightColumn.map((cat, ci) => (
              <CategoryBlock key={cat.label} cat={cat} ci={ci} />
            ))}
          </div>
        </div>

        <h3 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider mb-6 border-b border-border/30 pb-2">Leadership & Skills</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {leadershipSkills.map((cat, ci) => (
            <CategoryBlock key={cat.label} cat={cat} ci={ci} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsConstellation;
