import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type Language = 'en' | 'ru'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    // Get language from localStorage or default to 'en'
    const saved = localStorage.getItem('language')
    return (saved === 'ru' || saved === 'en') ? saved : 'en'
  })

  useEffect(() => {
    // Save language to localStorage whenever it changes
    localStorage.setItem('language', lang)
  }, [lang])

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ru' : 'en')
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
