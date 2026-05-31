import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../constants/globalStyles';
import { useTheme } from '../../constants/ThemeContext';
import { TRANSLATIONS } from '../../constants/translations';

type Author = { id: number; name: string; phonetic: string; pinyin: string; era: string; introduction: string; introduction_cn: string; };
type Poem = { id: number; title: string; };

const adUnitId = __DEV__ ? TestIds.BANNER : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '');

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function AuthorDetailScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const router = useRouter();
  const { themeColor, lang, toggleLang } = useTheme();
  const t = TRANSLATIONS[lang];
  
  const [author, setAuthor] = useState<Author | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthorData();
  }, [id]); 

  const loadAuthorData = async () => {
    try {
      const authorResult = await db.getFirstAsync<Author>('SELECT * FROM authors WHERE id = ?', [Number(id)]);
      setAuthor(authorResult);
      const poemsResult = await db.getAllAsync<Poem>('SELECT id, title FROM poems WHERE author_id = ? ORDER BY id ASC', [Number(id)]);
      setPoems(poemsResult);
    } catch (error) {
      console.error("データの読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  if (!author) return null;

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <Stack.Screen 
        options={{ 
          title: t.biography,
          headerRight: () => (
            <TouchableOpacity style={globalStyles.headerLangBtn} onPress={toggleLang}>
              <Text style={globalStyles.headerLangText}>{t.langToggle}</Text>
            </TouchableOpacity>
          )
        }} 
      />
      
      <View style={globalStyles.flex1}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          
          <View style={[globalStyles.cardBase, styles.bioCardSpacing]}>
            <View style={styles.nameHeader}>
              <View style={[styles.eraBadge, { backgroundColor: hexToRgba(themeColor, 0.1) }]}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: themeColor }}>{author.era}</Text>
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

          <Text style={styles.listTitle}>{t.poemsList}</Text>
          
          <View style={[globalStyles.cardBase, styles.poemListSpacing]}>
            {poems.map((poem, index) => (
              <TouchableOpacity 
                key={poem.id} 
                style={[styles.poemItem, index === poems.length - 1 && styles.poemItemLast]} 
                onPress={() => router.push(`/poem/${poem.id}`)}
              >
                <Text style={styles.poemTitle}>{poem.title}</Text>
                <Text style={globalStyles.chevron}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
      
      <View style={globalStyles.adContainer}>
        <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingHorizontal: 16 },
  bioCardSpacing: { padding: 20, marginTop: 16, marginBottom: 24 },
  nameHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eraBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12, overflow: 'hidden' },
  authorName: { fontSize: 24, fontWeight: '800', color: '#202124', letterSpacing: 2 },
  pinyin: { fontSize: 12, color: '#5F6368', marginTop: 2 },
  bioText: { fontSize: 15, color: '#4A4D51', lineHeight: 24 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#202124', marginBottom: 12, marginLeft: 4 },
  poemListSpacing: { overflow: 'hidden', marginBottom: 20 },
  poemItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F1F3F4' },
  poemItemLast: { borderBottomWidth: 0 },
  poemTitle: { fontSize: 16, color: '#202124', fontWeight: '500' },
});