import React, { useEffect } from 'react'
import AboutSection from '../components/landing/AboutSection'
import BestThingsSection from '../components/landing/BestThingsSection'
import BlogPreviewSection from '../components/landing/BlogPreviewSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import HeroSection from '../components/landing/HeroSection'
import CustomerFeedbackSection from '../components/landing/CustomerFeedbackSection'
import LandingBackground from '../components/landing/LandingBackground'
import LandingFooter from '../components/landing/LandingFooter'
import LandingNavbar from '../components/landing/LandingNavbar'
import LandingChatPopup from '../components/landing/LandingChatPopup'
import OfferBanner from '../components/landing/OfferBanner'
import QrOrderingFlowSection from '../components/landing/QrOrderingFlowSection'
import RestaurantProofSection from '../components/landing/RestaurantProofSection'
import ContactSection from '../components/landing/ContactSection'
import { LandingBrandingProvider } from '../context/LandingBrandingContext'
import { useLandingContent } from '../hooks/landing/useLandingContent'

const LandingPage = () => {
  const { hero, offerBanner, bestThings, features, about, blogs, branding, chat, footer } = useLandingContent()

  useEffect(() => {
    const name = branding?.softwareName?.trim()
    if (name) document.title = `${name} · QR ordering & restaurant platform`
  }, [branding?.softwareName])

  return (
    <LandingBrandingProvider value={{ ...branding, chat, footer }}>
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
        <LandingChatPopup />
      </div>
    </LandingBrandingProvider>
  )
}

export default LandingPage
