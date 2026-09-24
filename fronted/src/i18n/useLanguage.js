// src/i18n/useLanguage.js
import { useState, useEffect } from 'react';
import { translations } from './translations';

export function useLanguage() {
  const [language, setLanguage] = useState(() => {
    // 从 localStorage 读取，否则使用系统语言
    const saved = localStorage.getItem('language');
    if (saved) return saved;
    return navigator.language.includes('zh') ? 'zh' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const t = (key) => translations[language][key];

  return { language, t, toggleLanguage };
}