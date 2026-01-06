class I18n {
  constructor() {
    this.currentLang = 'zh'; // default language
    this.translations = {};
    this.fallbackLang = 'zh';
    
    this.init();
  }

  async init() {
    // Load translations
    await this.loadTranslations();
    
    // Set initial language from localStorage or browser
    const savedLang = localStorage.getItem('preferred-language');
    const browserLang = this.detectBrowserLanguage();
    const initialLang = savedLang || browserLang || this.fallbackLang;
    
    // Apply initial language
    await this.setLanguage(initialLang);
    
    // Setup event listeners
    this.setupLanguageSwitcher();
  }

  async loadTranslations() {
    const languages = ['zh', 'en']; // Add more as needed
    
    for (const lang of languages) {
      try {
        const response = await fetch(`translations/${lang}.json`);
        this.translations[lang] = await response.json();
      } catch (error) {
        console.warn(`Failed to load ${lang} translations:`, error);
      }
    }
  }

  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    
    // Map browser languages to your supported languages
    const langMap = {
      'zh': 'zh',
      'zh-CN': 'zh',
      'zh-TW': 'zh',
      'zh-HK': 'zh',
      'en': 'en',
      'en-US': 'en',
      'en-GB': 'en'
    };
    
    return langMap[browserLang] || langMap[browserLang.split('-')[0]];
  }

  async setLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`Language ${lang} not available, falling back to ${this.fallbackLang}`);
      lang = this.fallbackLang;
    }

    this.currentLang = lang;
    const translation = this.translations[lang];

    // Update HTML lang attribute
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-i18n-lang', lang);

    // Update page title
    document.title = this.getNestedValue(translation, 'meta.title') || document.title;

    // Update all elements with data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translatedText = this.getNestedValue(translation, key);
      
      if (translatedText !== undefined) {
        // Check if the element has data-i18n-html attribute for HTML content
        if (element.hasAttribute('data-i18n-html')) {
          element.innerHTML = translatedText;
        } else {
          element.textContent = translatedText;
        }
      }
    });

    // Update active language button
    this.updateLanguageSwitcher();

    // Save preference
    localStorage.setItem('preferred-language', lang);

    // Trigger custom event for any additional handling
    document.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang, translations: translation } 
    }));
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  setupLanguageSwitcher() {
    const languageButtons = document.querySelectorAll('.lang-btn');
    
    languageButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const lang = e.target.getAttribute('data-lang');
        this.setLanguage(lang);
      });
    });
  }

  updateLanguageSwitcher() {
    const languageButtons = document.querySelectorAll('.lang-btn');
    
    languageButtons.forEach(button => {
      const lang = button.getAttribute('data-lang');
      button.classList.toggle('active', lang === this.currentLang);
    });
  }

  // Public method to get current translation
  t(key) {
    return this.getNestedValue(this.translations[this.currentLang], key) || key;
  }

  // Public method to get current language
  getCurrentLanguage() {
    return this.currentLang;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.i18n = new I18n();
});

// Optional: Add keyboard shortcut for language switching
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'l') { // Alt+L to cycle languages
    const languages = ['zh', 'en'];
    const currentIndex = languages.indexOf(window.i18n.getCurrentLanguage());
    const nextIndex = (currentIndex + 1) % languages.length;
    window.i18n.setLanguage(languages[nextIndex]);
  }
});
