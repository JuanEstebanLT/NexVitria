import { useEffect, useState } from 'react'

function useActiveSection(sectionIds, initialSection = sectionIds[0], enabled = true) {
  const [activeSection, setActiveSection] = useState(initialSection)

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    if (!sections.length || !('IntersectionObserver' in window)) {
      return undefined
    }

    const visibleSections = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry)
          } else {
            visibleSections.delete(entry.target.id)
          }
        })

        const [closestSection] = [...visibleSections.values()].sort(
          (first, second) =>
            Math.abs(first.boundingClientRect.top) - Math.abs(second.boundingClientRect.top),
        )

        if (closestSection) {
          setActiveSection(closestSection.target.id)
        }
      },
      {
        rootMargin: '-18% 0px -62% 0px',
        threshold: [0, 0.15, 0.35, 0.6],
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [sectionIds, enabled])

  return { activeSection, setActiveSection }
}

export default useActiveSection
