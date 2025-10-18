import { ChatDemoSection } from "@/components/home/ChatDemoSection";
import { CollaborationFeaturesSection } from "@/components/home/CollaborationFeaturesSection";
import { EarlyAdopterSection } from "@/components/home/EarlyAdopterSection";
import { EncryptionSection } from "@/components/home/EncryptionSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HeroSection } from "@/components/home/HeroSection";
import { LocalFirstFeaturesSection } from "@/components/home/LocalFirstFeaturesSection";
import ProblemStatementSection from "@/components/home/ProblemStatementSection";
import { SupportedEnvironmentsSection } from "@/components/home/SupportedEnvironmentsSection";
import { Testimonial } from "@garden-co/design-system/src/components/molecules/Testimonial";

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="container flex flex-col gap-12 lg:gap-20">
        <SupportedEnvironmentsSection />

        <ChatDemoSection />

        <ProblemStatementSection />

        <LocalFirstFeaturesSection />

        <CollaborationFeaturesSection />

        <EncryptionSection />

        <FeaturesSection />

        <EarlyAdopterSection />
      </div>
    </>
  );
}
