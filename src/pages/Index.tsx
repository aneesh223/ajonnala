import StarfieldBackground from "@/components/StarfieldBackground";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FeaturedProject from "@/components/FeaturedProject";
import ExperienceTimeline from "@/components/ExperienceTimeline";
import SkillsConstellation from "@/components/SkillsConstellation";
import Footer from "@/components/Footer";
import MusicDisc from "@/components/MusicDisc";
import { AudioProvider } from "@/contexts/AudioContext";

const Index = () => {
  return (
    <AudioProvider>
      <div className="relative min-h-screen overflow-x-hidden">
        <StarfieldBackground />
        <MusicDisc />
        <div className="relative z-10">
          <HeroSection />
          <AboutSection />
          <FeaturedProject />
          <ExperienceTimeline />
          <SkillsConstellation />
          <Footer />
        </div>
      </div>
    </AudioProvider>
  );
};

export default Index;
