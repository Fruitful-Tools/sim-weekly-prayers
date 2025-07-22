
import React, { createContext, useContext, useEffect, useState } from 'react';

type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface FontContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export const useFontSize = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontProvider');
  }
  return context;
};

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');

  useEffect(() => {
    // Load saved font size from localStorage
    const savedFontSize = localStorage.getItem('font-size-preference') as FontSize;
    if (savedFontSize && ['small', 'medium', 'large', 'extra-large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
    }
  }, []);

  useEffect(() => {
    // Apply font size to document root
    const root = document.documentElement;
    root.setAttribute('data-font-size', fontSize);
    
    // Save to localStorage
    localStorage.setItem('font-size-preference', fontSize);
  }, [fontSize]);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  };

  return (
    <FontContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontContext.Provider>
  );
};
