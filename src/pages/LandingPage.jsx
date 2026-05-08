import React from 'react'
import AboutSection from '../components/landing/AboutSection'
import BestThingsSection from '../components/landing/BestThingsSection'
import BlogPreviewSection from '../components/landing/BlogPreviewSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import HeroSection from '../components/landing/HeroSection'
import CustomerFeedbackSection from '../components/landing/CustomerFeedbackSection'
import LandingBackground from '../components/landing/LandingBackground'
import LandingFooter from '../components/landing/LandingFooter'
import LandingNavbar from '../components/landing/LandingNavbar'
import OfferBanner from '../components/landing/OfferBanner'
import QrOrderingFlowSection from '../components/landing/QrOrderingFlowSection'
import RestaurantProofSection from '../components/landing/RestaurantProofSection'
import ContactSection from '../components/landing/ContactSection'
import WhatsAppFloatButton from '../components/landing/WhatsAppFloatButton'
import { useLandingContent } from '../hooks/landing/useLandingContent'

const LandingPage = () => {
  const { hero, offerBanner, bestThings, features, about, blogs } = useLandingContent()

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-950">
      <LandingBackground />
      <LandingNavbar />
      <main>
        <HeroSection hero={hero} />
        <QrOrderingFlowSection />
        {offerBanner && <OfferBanner offer={offerBanner} />}
        <RestaurantProofSection />
        <BestThingsSection items={bestThings} />
        <FeaturesSection features={features} />
        <AboutSection about={about} />
        <CustomerFeedbackSection />
        <BlogPreviewSection blogs={blogs} />
        <ContactSection />
      </main>
      <LandingFooter />
      <WhatsAppFloatButton />
    </div>
  )
}

export default LandingPage
