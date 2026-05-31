import { useRouter } from 'expo-router';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSQLiteContext } from 'expo-sqlite';
import { globalStyles } from '../constants/globalStyles';
import { THEME_COLORS, useTheme } from '../constants/ThemeContext';
import { TRANSLATIONS } from '../constants/translations';

type ThemeColorKey = keyof typeof THEME_COLORS;

const adUnitId = __DEV__ ? TestIds.BANNER : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '');

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { themeColor, setThemeColor, lang, toggleLang } = useTheme();
  const t = TRANSLATIONS[lang]; 

  const themeKeys = Object.keys(THEME_COLORS) as ThemeColorKey[];

  const handleExportMemos = async () => {
    try {
      const memos = await db.getAllAsync<{ title: string, text: string }>(
        'SELECT p.title, m.text FROM memos m JOIN poems p ON m.poem_id = p.id WHERE m.text != ""'
      );
      
      if (memos.length === 0) {
        Alert.alert(t.infoTitle, t.noMemoToExport);
        return;
      }

      const exportText = memos.map(m => `【${m.title}】\n${m.text}\n`).join('\n---\n\n');
      await Share.share({ message: exportText });
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(t.errorTitle, t.exportError);
    }
  };

  const handleDeleteAllMemos = () => {
    Alert.alert(
      t.confirmTitle,
      t.deleteConfirmText,
      [
        { text: t.cancelBtn, style: 'cancel' },
        { 
          text: t.deleteBtn, 
          style: 'destructive', 
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM memos');
              Alert.alert(t.completeTitle, t.deleteCompleteText);
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert(t.errorTitle, t.deleteError);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={globalStyles.flex1}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.settings}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={toggleLang} style={[styles.langBtn, { backgroundColor: themeColor }]}>
                <Text style={styles.langBtnText}>{t.langToggle}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <Text style={[styles.closeBtnText, { color: themeColor }]}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.aboutTop}</Text>
            <TouchableOpacity 
              style={[globalStyles.cardBase, styles.menuItem]} 
              onPress={() => {
                router.back(); 
                setTimeout(() => router.push('/about'), 100); 
              }}
            >
              <Text style={styles.menuText}>{t.aboutApp}</Text>
              <Text style={globalStyles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.themeColor}</Text>
            <View style={[globalStyles.cardBase, styles.colorPalette]}>
              {themeKeys.map((colorKey) => {
                const hexCode = THEME_COLORS[colorKey];
                return (
                  <TouchableOpacity key={colorKey} style={[styles.colorCircle, { backgroundColor: hexCode }]} onPress={() => setThemeColor(colorKey)}>
                    {themeColor === hexCode && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.dataManagement}</Text>
            <TouchableOpacity style={[globalStyles.cardBase, styles.menuItem]} onPress={handleExportMemos}>
              <Text style={styles.menuText}>{t.exportMemo}</Text>
              <Text style={globalStyles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[globalStyles.cardBase, styles.menuItem, { marginTop: 12 }]} onPress={handleDeleteAllMemos}>
              <Text style={[styles.menuText, { color: '#E74C3C' }]}>{t.deleteAllMemos}</Text>
              <Text style={styles.menuIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

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
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#202124' },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 12 },
  langBtnText: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' },
  closeBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  closeBtnText: { fontSize: 16, fontWeight: 'bold' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#5F6368', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  colorPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 20, borderRadius: 20 },
  colorCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  checkMark: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderRadius: 20, alignItems: 'center' },
  menuText: { fontSize: 16, fontWeight: '600', color: '#202124' },
  menuIcon: { fontSize: 18, color: '#9AA0A6' },
});