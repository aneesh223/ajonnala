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
        <a
          href="mailto:hello@aneeshjonnala.com"
          className="btn-glass inline-block"
        >
          Get in Touch
        </a>
        <p className="mt-12 text-xs text-muted-foreground font-mono">
          © 2026 Aneesh Jonnala
        </p>
      </motion.div>
    </div>
  </footer>
);

export default Footer;
