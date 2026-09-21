import AboutUs from "@/components/AboutUs";
import ConsultationWidget from "@/components/ConsultationWidget";
import ExpertTeam from "@/components/ExpertTeam";
import SpecificationsFAQ from "@/components/FAQ";
import GallerySection from "@/components/GallerySection";
import HeroSection from "@/components/HeroSection";
import KeyPrinciples from "@/components/KeyPrinciples";
import LegacySection from "@/components/LegacySection";
import LocationSection from "@/components/LocationSection";
import LuxuryShowcase from "@/components/LuxuryShowcase";
import TestimonialsSection from "@/components/Testimonials";
import VideoSection from "@/components/VideoSection";
import WhyChooseUs from "@/components/WhyChooseUs";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ConsultationWidget />
      <ExpertTeam />
      <AboutUs />
      <VideoSection />
      <GallerySection />
      <LocationSection />
      <LuxuryShowcase />
      <KeyPrinciples />
      <LegacySection />
      <WhyChooseUs />
      <SpecificationsFAQ />
      <TestimonialsSection />
    </>
  );
}