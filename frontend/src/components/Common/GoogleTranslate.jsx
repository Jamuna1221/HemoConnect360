import { useState, useEffect, useRef } from 'react';
import './GoogleTranslate.css';

const LANGUAGES = [
  { code: 'en', label: 'English',   native: 'English'  },
  { code: 'hi', label: 'Hindi',     native: 'हिन्दी'   },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்'   },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు'  },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ'   },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'mr', label: 'Marathi',   native: 'मराठी'   },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা'   },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી' },
];

// Read current language from cookie so the button shows the correct language on reload
const getLangFromCookie = () => {
  const match = document.cookie.match(/googtrans=\/en\/([a-z]+)/);
  if (match) return LANGUAGES.find((l) => l.code === match[1]) || LANGUAGES[0];
  return LANGUAGES[0];
};

const setGoogTransCookie = (langCode) => {
  const value = langCode === 'en' ? '/en/en' : `/en/${langCode}`;
  // Set for current domain
  document.cookie = `googtrans=${value}; path=/`;
  // Set for apex domain (needed for Google Translate to pick it up)
  const hostname = window.location.hostname;
  document.cookie = `googtrans=${value}; path=/; domain=${hostname}`;
};

const GoogleTranslate = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => getLangFromCookie());
  const wrapperRef = useRef(null);

  // Inject Google Translate script on mount
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', includedLanguages: 'en,hi,ta,te,kn,ml,mr,bn,gu' },
          'google_translate_element'
        );
      }
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeLanguage = (lang) => {
    setSelected(lang);
    setOpen(false);

    // Set googtrans cookie — Google reads this on page load
    setGoogTransCookie(lang.code);

    // First try the live select element (no reload needed)
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = lang.code;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Fallback: reload so Google picks up the cookie
      window.location.reload();
    }
  };

  return (
    <>
      {/* Google Translate hidden mount point — kept in DOM flow so the select renders */}
      <div id="google_translate_element" className="gt-hidden-widget" />

      {/* Custom floating pill button */}
      <div className="gt-fab" ref={wrapperRef}>
        <button
          className="gt-fab__btn"
          onClick={() => setOpen((o) => !o)}
          aria-label="Change language"
        >
          <span className="gt-fab__globe">🌐</span>
          <span className="gt-fab__lang">{selected.native}</span>
          <span className={`gt-fab__arrow ${open ? 'gt-fab__arrow--up' : ''}`}>▾</span>
        </button>

        {open && (
          <div className="gt-fab__dropdown">
            <p className="gt-fab__dropdown-header">Select Language</p>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`gt-fab__option ${selected.code === lang.code ? 'gt-fab__option--active' : ''}`}
                onClick={() => changeLanguage(lang)}
              >
                <span className="gt-fab__option-native">{lang.native}</span>
                <span className="gt-fab__option-label">{lang.label}</span>
                {selected.code === lang.code && <span className="gt-fab__option-check">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default GoogleTranslate;
