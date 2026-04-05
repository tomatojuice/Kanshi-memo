import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads'; // 💡 広告ライブラリを追加
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../constants/ThemeContext';
import { TRANSLATIONS } from '../constants/translations';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || '';
const OFFICIAL_WEBSITE_URL = process.env.EXPO_PUBLIC_OFFICIAL_WEBSITE_URL || '';

// 💡 .envから広告IDを読み込み
const adUnitId = __DEV__ ? TestIds.BANNER : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '');

export default function AboutScreen() {
  const { themeColor, lang, toggleLang } = useTheme();
  const t = TRANSLATIONS[lang];

  const version = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? t.unknownVersion;

  const openLink = (url: string) => {
    if (url) {
      Linking.openURL(url).catch((err) => console.error("URLを開けませんでした:", err));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Stack.Screen 
        options={{ 
          title: t.aboutApp,
          headerRight: () => (
            <TouchableOpacity style={styles.headerLangBtn} onPress={toggleLang}>
              <Text style={styles.headerLangText}>{t.langToggle}</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      {/* 💡 ScrollViewをViewで囲み、広告と分離する */}
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={[styles.logoPlaceholder, { backgroundColor: themeColor }]}>
              <Text style={styles.logoText}>詩</Text>
            </View>
            <Text style={styles.appName}>{t.appTitle}</Text>
            <Text style={styles.version}>{t.versionLabel} {version}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.aboutTop}</Text>
              <Text style={styles.description}>{t.aboutText}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.developer}</Text>
              <Text style={styles.description}>{t.copyright}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.linkTitle}</Text>
              
              <TouchableOpacity onPress={() => openLink(OFFICIAL_WEBSITE_URL)} style={styles.linkCard} activeOpacity={0.7}>
                <View style={styles.linkCardContent}>
                  <Text style={styles.linkIcon}>🌐</Text>
                  <Text style={styles.linkText}>{t.websiteLink}</Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openLink(PRIVACY_POLICY_URL)} style={styles.linkCard} activeOpacity={0.7}>
                <View style={styles.linkCardContent}>
                  <Text style={styles.linkIcon}>🔒</Text>
                  <Text style={styles.linkText}>{t.privacyPolicyLink}</Text>
                </View>
                <Text style={styles.chevron}>→</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </View>

      {/* 💡 広告バナーを最下部に配置 */}
      <View style={styles.adContainer}>
        <BannerAd 
          unitId={adUnitId} 
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} 
          requestOptions={{ requestNonPersonalizedAdsOnly: true }} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FDFBF7' },
  container: { flex: 1 },
  headerLangBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 10 },
  headerLangText: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' },
  content: { padding: 20, alignItems: 'center' },
  logoPlaceholder: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  logoText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  appName: { fontSize: 22, fontWeight: 'bold', color: '#202124', marginBottom: 4 },
  version: { fontSize: 13, color: '#9AA0A6', marginBottom: 30 },
  section: { width: '100%', marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#202124', marginBottom: 10 },
  description: { fontSize: 15, color: '#5F6368', lineHeight: 24 },
  linkCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  linkCardContent: { flexDirection: 'row', alignItems: 'center' },
  linkIcon: { fontSize: 20, marginRight: 12 },
  linkText: { fontSize: 15, fontWeight: '600', color: '#4A4D51' },
  chevron: { fontSize: 18, color: '#BDBDBD', fontWeight: 'bold' },
  adContainer: { alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#FDFBF7' }, // 💡 追加
});