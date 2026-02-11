import StarfieldBackground from "@/components/StarfieldBackground";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FeaturedProject from "@/components/FeaturedProject";
import ExperienceTimeline from "@/components/ExperienceTimeline";
import SkillsConstellation from "@/components/SkillsConstellation";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <StarfieldBackground />
      <HeroSection />
      <AboutSection />
      <FeaturedProject />
      <ExperienceTimeline />
      <SkillsConstellation />
      <Footer />
    </div>
  );
};

export default Index;
