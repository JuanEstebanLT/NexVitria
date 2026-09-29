import Hero from '../components/home/Hero.jsx'
import Benefits from '../components/home/Benefits.jsx'
import CategoriesPreview from '../components/home/CategoriesPreview.jsx'
import FeaturedProducts from '../components/home/FeaturedProducts.jsx'
import TrustSection from '../components/home/TrustSection.jsx'
import FinalCta from '../components/home/FinalCta.jsx'

function HomePage() {
  return (
    <main>
      <Hero />
      <Benefits />
      <CategoriesPreview />
      <FeaturedProducts />
      <TrustSection />
      <FinalCta />
    </main>
  )
}

export default HomePage
