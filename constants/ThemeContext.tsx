import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export const THEME_COLORS = {
  blue: '#1A73E8',   // デフォルト
  green: '#0F9D58',
  purple: '#9C27B0',
  red: '#DB4437',
  orange: '#FF9800',
  teal: '#009688',
  brown: '#795548',
};

type ThemeColorKey = keyof typeof THEME_COLORS;

interface ThemeContextType {
  themeColor: string;
  setThemeColor: (colorKey: ThemeColorKey) => void;
  isLoaded: boolean; // 読み込み完了フラグ
}

const ThemeContext = createContext<ThemeContextType>({
  themeColor: THEME_COLORS.blue,
  setThemeColor: () => {},
  isLoaded: false,
});

const STORAGE_KEY = '@theme_color_key';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeColor, setThemeColorState] = useState<string>(THEME_COLORS.blue);
  const [isLoaded, setIsLoaded] = useState(false);

  // 💡 1. アプリ起動時に保存された色を読み込む
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedColorKey = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedColorKey && (savedColorKey in THEME_COLORS)) {
          setThemeColorState(THEME_COLORS[savedColorKey as ThemeColorKey]);
        }
      } catch (e) {
        console.error("テーマの読み込みに失敗:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // 💡 2. 色を変えた瞬間にAsyncStorageに保存する
  const setThemeColor = async (colorKey: ThemeColorKey) => {
    const newColor = THEME_COLORS[colorKey];
    setThemeColorState(newColor);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, colorKey);
    } catch (e) {
      console.error("テーマの保存に失敗:", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);