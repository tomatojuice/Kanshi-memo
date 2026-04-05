import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export const THEME_COLORS = {
  blue: '#1A73E8',
  green: '#0F9D58',
  purple: '#9C27B0',
  red: '#DB4437',
  orange: '#FF9800',
  teal: '#009688',
  brown: '#795548',
};

type ThemeColorKey = keyof typeof THEME_COLORS;
type LangKey = 'JP' | 'CN';

interface ThemeContextType {
  themeColor: string;
  setThemeColor: (colorKey: ThemeColorKey) => void;
  lang: LangKey;
  toggleLang: () => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  themeColor: THEME_COLORS.blue,
  setThemeColor: () => {},
  lang: 'JP',
  toggleLang: () => {},
  isLoaded: false,
});

const STORAGE_KEY_COLOR = '@theme_color_key';
const STORAGE_KEY_LANG = '@app_language_key';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const deviceLanguage = Localization.getLocales()[0].languageCode;
  const initialLang: LangKey = deviceLanguage?.includes('zh') ? 'CN' : 'JP';

  const [themeColor, setThemeColorState] = useState<string>(THEME_COLORS.blue);
  const [lang, setLangState] = useState<LangKey>(initialLang);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedColorKey = await AsyncStorage.getItem(STORAGE_KEY_COLOR);
        if (savedColorKey && (savedColorKey in THEME_COLORS)) {
          setThemeColorState(THEME_COLORS[savedColorKey as ThemeColorKey]);
        }
        const savedLang = await AsyncStorage.getItem(STORAGE_KEY_LANG);
        if (savedLang === 'JP' || savedLang === 'CN') {
          setLangState(savedLang as LangKey);
        }
      } catch (e) {
        console.error("設定の読み込みに失敗:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const setThemeColor = async (colorKey: ThemeColorKey) => {
    setThemeColorState(THEME_COLORS[colorKey]);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_COLOR, colorKey);
    } catch (e) {
      console.error("テーマの保存に失敗:", e);
    }
  };

  const toggleLang = async () => {
    const newLang = lang === 'JP' ? 'CN' : 'JP';
    setLangState(newLang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LANG, newLang);
    } catch (e) {
      console.error("言語の保存に失敗:", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, lang, toggleLang, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);