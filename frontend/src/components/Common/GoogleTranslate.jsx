import { useEffect, useState, useRef } from 'react';
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
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી'},
];

const GoogleTranslate = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(LANGUAGES[0]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Must properly initialize so Google creates the hidden goog-te-combo select
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,ta,te,kn,ml,mr,bn,gu',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeLanguage = (lang) => {
    setSelected(lang);
    setOpen(false);

    // Retry until the hidden Google select element appears in DOM
    const applyLanguage = (retries = 20) => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = lang.code;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (retries > 0) {
        setTimeout(() => applyLanguage(retries - 1), 400);
      }
    };
    applyLanguage();
  };

  return (
    <>
      {/*
        Hidden Google Translate widget container.
        IMPORTANT: Cannot use display:none — Google won't render the select inside.
        We use the gt-hidden-widget class to visually hide it off-screen.
      */}
      <div className="gt-hidden-widget">
        <div id="google_translate_element"></div>
      </div>

      {/* Custom floating language picker */}
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
            <div className="gt-fab__dropdown-header">Select Language</div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`gt-fab__option ${selected.code === lang.code ? 'gt-fab__option--active' : ''}`}
                onClick={() => changeLanguage(lang)}
              >
                <span className="gt-fab__option-native">{lang.native}</span>
                <span className="gt-fab__option-label">{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default GoogleTranslate;
