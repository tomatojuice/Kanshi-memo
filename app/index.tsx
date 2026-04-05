import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../constants/ThemeContext';
import { TRANSLATIONS } from '../constants/translations';

type Author = { id: number; name: string; phonetic: string; pinyin: string; era: string; introduction: string; introduction_cn: string; poem_count: number; };

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const adUnitId = __DEV__ ? TestIds.BANNER : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '');

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
  const { themeColor, lang, toggleLang } = useTheme();
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    loadAuthors();
  }, [searchQuery]);

  const loadAuthors = async () => {
    try {
      // 💡 memos テーブルを結合し、メモの本文 (m.text) からも検索可能にする！
      let query = `
        SELECT a.id, a.name, a.phonetic, a.pinyin, a.era, a.introduction, a.introduction_cn, COUNT(DISTINCT p.id) as poem_count 
        FROM authors a 
        LEFT JOIN poems p ON a.id = p.author_id 
        LEFT JOIN memos m ON p.id = m.poem_id
      `;
      let params: string[] = [];

      if (searchQuery) {
        query += ` 
          WHERE a.name LIKE ? 
          OR a.phonetic LIKE ? 
          OR a.pinyin LIKE ?
          OR a.era LIKE ?
          OR p.title LIKE ?
          OR m.text LIKE ?
        `;
        const likeStr = `%${searchQuery}%`;
        params = [likeStr, likeStr, likeStr, likeStr, likeStr, likeStr];
      }
      query += ` GROUP BY a.id ORDER BY a.id ASC`;

      const result = await db.getAllAsync<Author>(query, params);
      setAuthors(result);
    } catch (error) {
      console.error("データの読み込みエラー:", error);
    }
  };

  const renderItem = ({ item }: { item: Author }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/author/${item.id}`)} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.eraBadge, { backgroundColor: hexToRgba(themeColor, 0.1) }]}>
          <Text style={[styles.eraText, { color: themeColor }]}>{item.era}</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.authorName}>{item.name}</Text>
          <Text style={styles.pinyin}>{lang === 'CN' ? item.pinyin : item.phonetic}</Text>
        </View>
      </View>
      <Text style={styles.intro} numberOfLines={2}>
        {lang === 'CN' ? item.introduction_cn : item.introduction}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.poemCount}>
          <Text style={[styles.poemCountNumber, { color: themeColor }]}>{item.poem_count}</Text>{t.counterUnit}
        </Text>
        <Text style={styles.chevron}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack.Screen 
          options={{ 
            title: t.appTitle,
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={toggleLang} style={styles.langBtn}>
                  <Text style={styles.langBtnText}>{t.langToggle}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                  <Text style={styles.settingsBtnText}>⋮</Text>
                </TouchableOpacity>
              </View>
            ),
          }} 
        />
        
        <View style={{ flex: 1 }}>
          <FlatList
            data={authors}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          <View style={[styles.searchContainer, { backgroundColor: themeColor }]}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder={t.searchPlaceholder} placeholderTextColor="#9AA0A6" value={searchQuery} onChangeText={setSearchQuery} clearButtonMode="while-editing" />
            </View>
          </View>
        </View>
        
        <View style={styles.adContainer}>
          <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FDFBF7' },
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  langBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 10 },
  langBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  settingsBtn: { paddingHorizontal: 10, paddingVertical: 2 },
  settingsBtnText: { fontSize: 26, fontWeight: 'bold', color: '#FFF', lineHeight: 28 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  eraBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
  eraText: { fontSize: 13, fontWeight: 'bold' },
  nameContainer: { justifyContent: 'center' },
  authorName: { fontSize: 20, fontWeight: '800', color: '#202124', letterSpacing: 2 },
  pinyin: { fontSize: 12, color: '#5F6368', marginTop: 2 },
  intro: { fontSize: 14, color: '#4A4D51', lineHeight: 22, marginBottom: 16 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F3F4', paddingTop: 12 },
  poemCount: { fontSize: 13, color: '#5F6368', fontWeight: '500' },
  poemCountNumber: { fontWeight: 'bold', fontSize: 15 },
  chevron: { fontSize: 24, color: '#BDBDBD', lineHeight: 24 },
  searchContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#202124' },
  adContainer: { alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#FDFBF7' },
});