import * as Localization from 'expo-localization';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { TRANSLATIONS } from '../../constants/translations';

type Author = { id: number; name: string; phonetic: string; pinyin: string; era: string; introduction: string; introduction_cn: string; };
type Poem = { id: number; title: string; };
type LangKey = 'JP' | 'CN';

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
  
  const [author, setAuthor] = useState<Author | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
 // const [lang, setLang] = useState<LangKey>('JP');
  const [loading, setLoading] = useState(true);

  const deviceLanguage = Localization.getLocales()[0].languageCode;
  const initialLang = deviceLanguage?.includes('zh') ? 'CN' : 'JP';
  const [lang, setLang] = useState<LangKey>(initialLang);

  const t = TRANSLATIONS[lang];
  const { themeColor } = useTheme();

  useEffect(() => {
    async function fetchData() {
      const authorData = await db.getFirstAsync<Author>('SELECT * FROM authors WHERE id = ?', [Number(id)]);
      setAuthor(authorData);
      const poemsData = await db.getAllAsync<Poem>('SELECT id, title FROM poems WHERE author_id = ?', [Number(id)]);
      setPoems(poemsData);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading || !author) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={themeColor} /></View>;

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: author.name,
          headerBackTitle: '戻る',
          headerRight: () => (
            <TouchableOpacity style={styles.headerLangToggle} onPress={() => setLang(lang === 'JP' ? 'CN' : 'JP')}>
              <Text style={styles.headerLangText}>{lang === 'JP' ? '🇯🇵 JP' : '🇨🇳 CN'}</Text>
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.bioCard}>
          <Text style={[styles.sectionTitle, { color: themeColor }]}>{t.biography}</Text>
          <View style={styles.nameHeader}>
            {/* 👇 バッジ色を適用 */}
            <Text style={[styles.eraBadge, { backgroundColor: hexToRgba(themeColor, 0.1), color: themeColor }]}>
              {author.era}
            </Text>
            <View>
              <Text style={styles.authorName}>{author.name}</Text>
              {author.pinyin ? <Text style={styles.pinyin}>{author.pinyin}</Text> : null}
            </View>
          </View>
          <Text style={styles.bioText}>
            {lang === 'JP' ? author.introduction : author.introduction_cn}
          </Text>
        </View>

        <Text style={styles.listTitle}>{t.poemsList} ({poems.length}{t.counterUnit})</Text>
        
        {poems.map((poem) => (
          <TouchableOpacity 
            key={poem.id} 
            style={styles.poemListItem}
            onPress={() => router.push({ pathname: '/poem/[id]', params: { id: poem.id } })}
          >
            <Text style={styles.poemListTitle}>{poem.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  headerLangToggle: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  headerLangText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: 16 },
  bioCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginTop: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  nameHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eraBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 12, fontWeight: 'bold', overflow: 'hidden' },
  authorName: { fontSize: 24, fontWeight: '800', color: '#202124', letterSpacing: 2 },
  pinyin: { fontSize: 12, color: '#5F6368', marginTop: 2 },
  bioText: { fontSize: 15, color: '#4A4D51', lineHeight: 24 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#202124', marginBottom: 12, paddingHorizontal: 4 },
  poemListItem: { backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  poemListTitle: { fontSize: 18, fontWeight: '600', color: '#202124' },
  chevron: { fontSize: 24, color: '#BDBDBD', lineHeight: 24 },
});