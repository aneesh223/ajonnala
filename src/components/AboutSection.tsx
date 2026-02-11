import { motion } from "framer-motion";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-sm font-mono text-primary tracking-widest uppercase mb-4">
            About Me
          </h2>
          <div className="glass-card p-8 md:p-12">
            <p className="text-lg md:text-xl leading-relaxed text-foreground/85">
              I am a senior at{" "}
              <span className="text-foreground font-medium">
                Olentangy Liberty High School
              </span>{" "}
              and a self-taught programmer passionate about the intersection of{" "}
              <span className="gradient-text font-semibold">
                AI and Financial Markets
              </span>
              . I aspire to major in CS with a specialization in Machine
              Learning.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
