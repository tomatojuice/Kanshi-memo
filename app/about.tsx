import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';

import { globalStyles } from '../constants/globalStyles';
import { useTheme } from '../constants/ThemeContext';
import { TRANSLATIONS } from '../constants/translations';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || '';
const OFFICIAL_WEBSITE_URL = process.env.EXPO_PUBLIC_OFFICIAL_WEBSITE_URL || '';

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
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <Stack.Screen 
        options={{ 
          title: t.aboutApp,
          headerRight: () => (
            <TouchableOpacity style={globalStyles.headerLangBtn} onPress={toggleLang}>
              <Text style={globalStyles.headerLangText}>{t.langToggle}</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      <View style={globalStyles.flex1}>
        <ScrollView style={globalStyles.flex1} showsVerticalScrollIndicator={false}>
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
              
              {/* 💡 共通の cardBase を適用して余白などを個別に設定 */}
              <TouchableOpacity onPress={() => openLink(OFFICIAL_WEBSITE_URL)} style={[globalStyles.cardBase, styles.linkCardSpacing]} activeOpacity={0.7}>
                <View style={styles.linkCardContent}>
                  <Text style={styles.linkIcon}>🌐</Text>
                  <Text style={styles.linkText}>{t.websiteLink}</Text>
                </View>
                <Text style={globalStyles.chevron}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openLink(PRIVACY_POLICY_URL)} style={[globalStyles.cardBase, styles.linkCardSpacing]} activeOpacity={0.7}>
                <View style={styles.linkCardContent}>
                  <Text style={styles.linkIcon}>🔒</Text>
                  <Text style={styles.linkText}>{t.privacyPolicyLink}</Text>
                </View>
                <Text style={globalStyles.chevron}>→</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </View>

      {/* 共通の広告コンテナスタイルを適用 */}
      <View style={globalStyles.adContainer}>
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
  content: { padding: 20, alignItems: 'center' },
  logoPlaceholder: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  logoText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  appName: { fontSize: 22, fontWeight: 'bold', color: '#202124', marginBottom: 4 },
  version: { fontSize: 13, color: '#9AA0A6', marginBottom: 30 },
  section: { width: '100%', marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#202124', marginBottom: 10 },
  description: { fontSize: 15, color: '#5F6368', lineHeight: 24 },
  linkCardSpacing: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, marginBottom: 12 },
  linkCardContent: { flexDirection: 'row', alignItems: 'center' },
  linkIcon: { fontSize: 20, marginRight: 12 },
  linkText: { fontSize: 15, fontWeight: '600', color: '#4A4D51' },
});