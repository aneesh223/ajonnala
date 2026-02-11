import { motion } from "framer-motion";

const Footer = () => (
  <footer id="contact" className="py-16 px-4 border-t border-border">
    <div className="max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-4">
          Let's Connect
        </h2>
        <p className="text-muted-foreground mb-8">
          Open to research collaborations and exciting opportunities.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="https://www.linkedin.com/in/aneeshjonnala"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glass inline-block"
          >
            LinkedIn
          </a>
          <a
            href="mailto:hello@aneeshjonnala.com"
            className="btn-glass inline-block"
          >
            Email
          </a>
        </div>
        <p className="mt-12 text-xs text-muted-foreground font-mono">
          © 2026 Aneesh Jonnala
        </p>
      </motion.div>
    </div>
  </footer>
);

export default Footer;
