import * as Localization from 'expo-localization';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../constants/ThemeContext';
import { TRANSLATIONS } from '../../constants/translations';

type Author = { id: number; name: string; phonetic: string; pinyin: string; era: string; introduction: string; introduction_cn: string; };
type Poem = { id: number; title: string; };
type LangKey = 'JP' | 'CN';

// 💡 .envから広告IDを読み込み（開発中はテスト広告になります）
const adUnitId = __DEV__ 
  ? TestIds.BANNER 
  : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '');

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function AuthorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const db = useSQLiteContext();
  const { themeColor } = useTheme();
  
  const [author, setAuthor] = useState<Author | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  // 💡 OSの言語設定を取得
  const deviceLanguage = Localization.getLocales()[0].languageCode;
  const initialLang = deviceLanguage?.includes('zh') ? 'CN' : 'JP';
  const [lang, setLang] = useState<LangKey>(initialLang);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      // 1. 著者情報の取得
      const authorData = await db.getFirstAsync<Author>(
        'SELECT * FROM authors WHERE id = ?',
        [Number(id)]
      );
      setAuthor(authorData);

      // 2. この著者の詩一覧を取得
      const poemsData = await db.getAllAsync<Poem>(
        'SELECT id, title FROM poems WHERE author_id = ? ORDER BY id ASC',
        [Number(id)]
      );
      setPoems(poemsData);
    } catch (error) {
      console.error("データ読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={themeColor} />;
  }

  if (!author) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>作者が見つかりません。</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <Stack.Screen 
        options={{ 
          title: author.name,
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerLangBtn}
              onPress={() => setLang(lang === 'JP' ? 'CN' : 'JP')}
            >
              <Text style={styles.headerLangText}>
                {lang === 'JP' ? '🇨🇳 中文' : '🇯🇵 日本語'}
              </Text>
            </TouchableOpacity>
          )
        }} 
      />
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* 著者紹介カード */}
          <View style={styles.bioCard}>
            <View style={styles.nameHeader}>
              <View style={[styles.eraBadge, { backgroundColor: hexToRgba(themeColor, 0.1) }]}>
                <Text style={{ color: themeColor, fontWeight: 'bold' }}>{author.era}</Text>
              </View>
              <View>
                <Text style={styles.authorName}>{author.name}</Text>
                <Text style={styles.pinyin}>{lang === 'CN' ? author.pinyin : author.phonetic}</Text>
              </View>
            </View>
            <Text style={styles.bioText}>
              {lang === 'CN' ? author.introduction_cn : author.introduction}
            </Text>
          </View>

          {/* 作品リスト */}
          <Text style={styles.listTitle}>{t.poemsList || '作品一覧'}</Text>
          <View style={styles.poemList}>
            {poems.map((poem, index) => (
              <TouchableOpacity 
                key={poem.id} 
                style={[
                  styles.poemItem, 
                  index !== poems.length - 1 && styles.poemItemBorder // 最後以外は下線を引く
                ]}
                onPress={() => router.push(`/poem/${poem.id}`)}
              >
                <Text style={styles.poemTitle}>{poem.title}</Text>
                <Text style={styles.chevron}>→</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
      
      {/* 💡 広告バナーを最下部に配置 */}
      <View style={styles.adContainer}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FDFBF7' },
  headerLangBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  headerLangText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 16 },
  bioCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginTop: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  nameHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eraBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12, overflow: 'hidden' },
  authorName: { fontSize: 24, fontWeight: '800', color: '#202124', letterSpacing: 2 },
  pinyin: { fontSize: 12, color: '#5F6368', marginTop: 2 },
  bioText: { fontSize: 15, color: '#4A4D51', lineHeight: 24 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#202124', marginBottom: 12, marginLeft: 4 },
  poemList: { backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3, overflow: 'hidden' },
  poemItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  poemItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F3F4' },
  poemTitle: { fontSize: 16, color: '#202124', fontWeight: '500' },
  chevron: { fontSize: 18, color: '#BDBDBD' },
  adContainer: { alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#FDFBF7' },
});