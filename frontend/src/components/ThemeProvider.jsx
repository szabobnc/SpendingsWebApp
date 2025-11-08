import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => null,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, defaultTheme = 'light', storageKey = 'ui-theme' }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(storageKey) || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Set data-theme attribute for CSS variables (CRITICAL FIX)
    root.setAttribute('data-theme', theme);
    
    // Also add class for compatibility
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem(storageKey, theme);
    
    console.log('Theme changed to:', theme); // Debug log
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};