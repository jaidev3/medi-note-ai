import React, { useEffect } from "react";
import { useAuthModals } from "@/contexts/AuthModalsContext";
import {
  HeroSection,
  StatsSection,
  FeaturesSection,
  WorkflowSection,
  TestimonialsSection,
  CTASection,
  Footer,
} from "@/components/home";

export const HomePage: React.FC = () => {
  const { openLoginModal, openSignupModal } = useAuthModals();

  useEffect(() => {
    const timer = setInterval(() => {
      const viewers = document.querySelectorAll("spline-viewer");
      viewers.forEach((viewer) => {
        if (viewer.shadowRoot) {
          const logo = viewer.shadowRoot.querySelector("#logo");
          if (logo) {
            logo.remove();
            clearInterval(timer);
          }
        }
      });
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <HeroSection
        onSignupClick={openSignupModal}
        onLoginClick={openLoginModal}
      />
      <StatsSection />
      <FeaturesSection />
      <WorkflowSection />
      <TestimonialsSection />
      <CTASection
        onSignupClick={openSignupModal}
        onLoginClick={openLoginModal}
      />
      <Footer />
    </div>
  );
};
