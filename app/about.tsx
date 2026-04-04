// app/about.tsx
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // 💡 Linking を追加
import { useTheme } from '../constants/ThemeContext';
import { TRANSLATIONS } from '../constants/translations';

export default function AboutScreen() {
  const { themeColor } = useTheme();
  
  const deviceLanguage = Localization.getLocales()[0].languageCode;
  const initialLang = deviceLanguage?.includes('zh') ? 'CN' : 'JP';
  
  const [lang, setLang] = useState<'JP' | 'CN'>(initialLang); 
  const t = TRANSLATIONS[lang];

  const version = Constants.expoConfig?.version 
               ?? Constants.nativeAppVersion 
               ?? t.unknownVersion;

  // 💡 プライバシーポリシーを開く関数
  const openPrivacyPolicy = () => {
    // 💡 さっき公開したFirebase HostingのURL
    Linking.openURL('https://kanshi-syu.web.app/privacy.html');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Stack.Screen 
        options={{ 
          title: t.aboutApp,
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerLangToggle}
              onPress={() => setLang(lang === 'JP' ? 'CN' : 'JP')}
            >
              <Text style={styles.headerLangText}>
                {lang === 'JP' ? '🇯🇵 JP' : '🇨🇳 CN'}
              </Text>
            </TouchableOpacity>
          ),
        }} 
      />

      <View style={styles.content}>
        <View style={[styles.logoPlaceholder, { backgroundColor: themeColor }]}>
          <Text style={styles.logoText}>詩</Text>
        </View>

        <Text style={styles.appName}>{t.appTitle}</Text>
        <Text style={styles.version}>Version {version}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.features}</Text>
          <Text style={styles.description}>{t.description1}</Text>
          <Text style={styles.description}>{t.description2}</Text>
          <Text style={styles.description}>{t.description3}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.developer}</Text>
          <Text style={styles.description}>ratolab</Text>
        </View>

        {/* 💡 プライバシーポリシーへのリンク */}
        <TouchableOpacity style={styles.linkButton} onPress={openPrivacyPolicy}>
          <Text style={[styles.linkText, { color: themeColor }]}>
            {lang === 'JP' ? 'プライバシーポリシー' : '隐私政策'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.copyright}>{t.copyright}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerLangToggle: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    marginRight: 10 
  },
  headerLangText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  
  content: { padding: 20, alignItems: 'center' },
  logoPlaceholder: { 
    width: 80, height: 80, borderRadius: 20, 
    justifyContent: 'center', alignItems: 'center', 
    marginBottom: 12, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  logoText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  appName: { fontSize: 22, fontWeight: 'bold', color: '#202124', marginBottom: 4 },
  version: { fontSize: 13, color: '#9AA0A6', marginBottom: 30 },
  
  section: { width: '100%', marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#202124', marginBottom: 10 },
  description: { fontSize: 15, color: '#5F6368', lineHeight: 24, marginBottom: 8 },

  // 💡 リンクボタンのスタイル
  linkButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  linkText: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  copyright: { fontSize: 12, color: '#9AA0A6', marginTop: 20 }
});