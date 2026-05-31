import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, SectionList,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';

import { globalStyles } from '../constants/globalStyles'; // 💡 共通スタイルをインポート
import { useTheme } from '../constants/ThemeContext';
import { TRANSLATIONS } from '../constants/translations';

type Author = { id: number; name: string; phonetic: string; pinyin: string; era: string; introduction: string; introduction_cn: string; poem_count: number; };
type TabType = 'ALL' | 'ERA' | 'AUTHOR';

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
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const router = useRouter();
  
  const { themeColor, lang, toggleLang } = useTheme();
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    loadAuthors();
  }, [searchQuery]);

  const loadAuthors = async () => {
    try {
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

  const getSectionedData = () => {
    if (activeTab === 'ERA') {
      const eraOrder = ['古代', '先秦', '漢', '魏晋南北朝', '東晋', '北朝', '唐', '五代', '宋', '北宋', '南宋', '金', '元', '明', '清', '近代'];
      const grouped = authors.reduce((acc, author) => {
        const era = author.era || '不明';
        if (!acc[era]) acc[era] = [];
        acc[era].push(author);
        return acc;
      }, {} as Record<string, Author[]>);
      
      return Object.keys(grouped)
        .sort((a, b) => {
          const idxA = eraOrder.indexOf(a);
          const idxB = eraOrder.indexOf(b);
          return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
        })
        .map(era => ({ title: era, data: grouped[era] }));
    } else if (activeTab === 'AUTHOR') {
      if (lang === 'CN') {
        const grouped = authors.reduce((acc, author) => {
          const firstLetter = author.pinyin ? author.pinyin.charAt(0).toUpperCase() : '#';
          if (!acc[firstLetter]) acc[firstLetter] = [];
          acc[firstLetter].push(author);
          return acc;
        }, {} as Record<string, Author[]>);
        return Object.keys(grouped).sort().map(letter => ({ title: letter, data: grouped[letter] }));
      } else {
        const getGyo = (kana: string) => {
          if (!kana) return 'その他';
          const c = kana.charAt(0);
          if ('あいうえお'.includes(c)) return 'あ行';
          if ('かきくけこがぎぐげご'.includes(c)) return 'か行';
          if ('さしすせそざじずぜぞ'.includes(c)) return 'さ行';
          if ('たちつてとだぢづでど'.includes(c)) return 'た行';
          if ('なにぬねの'.includes(c)) return 'な行';
          if ('はひふへほばびぶべぼぱぴぷぺぽ'.includes(c)) return 'は行';
          if ('まみむめも'.includes(c)) return 'ま行';
          if ('やゆよ'.includes(c)) return 'や行';
          if ('らりるれろ'.includes(c)) return 'ら行';
          if ('わをん'.includes(c)) return 'わ行';
          return 'その他';
        };
        const grouped = authors.reduce((acc, author) => {
          const gyo = getGyo(author.phonetic);
          if (!acc[gyo]) acc[gyo] = [];
          acc[gyo].push(author);
          return acc;
        }, {} as Record<string, Author[]>);
        
        const gyoOrder = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行', 'その他'];
        return Object.keys(grouped)
          .sort((a, b) => gyoOrder.indexOf(a) - gyoOrder.indexOf(b))
          .map(gyo => ({ title: gyo, data: grouped[gyo] }));
      }
    }
    return [];
  };

  const renderItem = ({ item }: { item: Author }) => (
    // 💡 globalStyles.cardBase を適用
    <TouchableOpacity style={[globalStyles.cardBase, styles.cardSpacing]} onPress={() => router.push(`/author/${item.id}`)} activeOpacity={0.7}>
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
          <Text style={[styles.poemCountNumber, { color: themeColor }]}>{item.poem_count}</Text>{t.counterUnit || '首'}
        </Text>
        <Text style={globalStyles.chevron}>→</Text> 
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: themeColor }]}>{title}</Text>
    </View>
  );

  return (
    // 💡 globalStyles.safeArea を適用
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={globalStyles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack.Screen 
          options={{ 
            title: t.appTitle,
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={toggleLang} style={globalStyles.headerLangBtn}>
                  <Text style={globalStyles.headerLangText}>{t.langToggle}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                  <Text style={styles.settingsBtnText}>⋮</Text>
                </TouchableOpacity>
              </View>
            ),
          }} 
        />

        <View style={styles.tabContainer}>
          {(['ALL', 'ERA', 'AUTHOR'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabButton, isActive && { backgroundColor: themeColor }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isActive && { color: '#FFF' }]}>
                  {tab === 'ALL' ? (t.tabAll || 'すべて') : tab === 'ERA' ? (t.tabEra || '時代別') : (t.tabAuthor || '作者別')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={globalStyles.flex1}>
          {activeTab === 'ALL' ? (
            <FlatList
              data={authors}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <SectionList
              sections={getSectionedData()}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
          
          <View style={[styles.searchContainer, { backgroundColor: themeColor }]}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder={t.searchPlaceholder} placeholderTextColor="#9AA0A6" value={searchQuery} onChangeText={setSearchQuery} clearButtonMode="while-editing" />
            </View>
          </View>
        </View>
        
        {/* 💡 globalStyles.adContainer を適用 */}
        <View style={globalStyles.adContainer}>
          <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8, backgroundColor: '#FDFBF7' },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center', backgroundColor: '#F1F3F4' },
  tabText: { fontSize: 13, fontWeight: 'bold', color: '#5F6368' },
  sectionHeader: { backgroundColor: '#FDFBF7', paddingVertical: 8, marginBottom: 8, marginTop: 4 },
  sectionHeaderText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  settingsBtn: { paddingHorizontal: 10, paddingVertical: 2 },
  settingsBtnText: { fontSize: 26, fontWeight: 'bold', color: '#FFF', lineHeight: 28 },
  cardSpacing: { padding: 20, marginBottom: 16 }, // 💡 cardBase に追加するマージン・パディング
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
  searchContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#202124' },
});