import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, SectionList,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';

import { globalStyles } from '../constants/globalStyles';
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
  // 💡 開閉状態を管理するステート（アコーディオン用）
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const router = useRouter();
  
  const { themeColor, lang, toggleLang } = useTheme();
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    loadAuthors();
  }, [searchQuery]);

  // 💡 タブが切り替わったらアコーディオンを一旦リセットする
  useEffect(() => {
    setExpandedSections({});
  }, [activeTab]);

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
    // 検索窓に文字が入っている時は、見やすくするために全て強制展開する
    const isSearchActive = !!searchQuery;

    if (activeTab === 'ALL') {
      return [{ title: 'ALL', data: authors }]; // ALLタブ用
    } else if (activeTab === 'ERA') {
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
        // 💡 展開されていない時はデータを空配列にする（アコーディオンの魔法）
        .map(era => ({ title: era, data: (isSearchActive || expandedSections[era]) ? grouped[era] : [] }));
    } else if (activeTab === 'AUTHOR') {
      let grouped: Record<string, Author[]> = {};
      if (lang === 'CN') {
        grouped = authors.reduce((acc, author) => {
          const firstLetter = author.pinyin ? author.pinyin.charAt(0).toUpperCase() : '#';
          if (!acc[firstLetter]) acc[firstLetter] = [];
          acc[firstLetter].push(author);
          return acc;
        }, {} as Record<string, Author[]>);
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
        grouped = authors.reduce((acc, author) => {
          const gyo = getGyo(author.phonetic);
          if (!acc[gyo]) acc[gyo] = [];
          acc[gyo].push(author);
          return acc;
        }, {} as Record<string, Author[]>);
      }
      
      const gyoOrder = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行', 'その他'];
      return Object.keys(grouped)
        .sort((a, b) => lang === 'CN' ? a.localeCompare(b) : (gyoOrder.indexOf(a) - gyoOrder.indexOf(b)))
        // 💡 展開されていない時はデータを空配列にする
        .map(title => ({ title, data: (isSearchActive || expandedSections[title]) ? grouped[title] : [] }));
    }
    return [];
  };

  const renderItem = ({ item }: { item: Author }) => (
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

  // 💡 アコーディオン式に生まれ変わった見出し部分
  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => {
    if (title === 'ALL') return null; // ALLタブの時は見出しを隠す

    const isExpanded = !!searchQuery || expandedSections[title];

    return (
      <TouchableOpacity 
        style={styles.sectionHeader} 
        onPress={() => setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }))}
        activeOpacity={0.6}
      >
        <Text style={[styles.sectionHeaderText, { color: themeColor }]}>{title}</Text>
        {/* 開閉状態を示すアイコン */}
        <Text style={[styles.accordionIcon, { color: themeColor }]}>{isExpanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
    );
  };

  return (
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
          {/* 💡 FlatListを廃止し、すべてSectionListに統一してブレを撲滅！ */}
          <SectionList
            sections={getSectionedData()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
          
          <View style={[styles.searchContainer, { backgroundColor: themeColor }]}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder={t.searchPlaceholder} placeholderTextColor="#9AA0A6" value={searchQuery} onChangeText={setSearchQuery} clearButtonMode="while-editing" />
            </View>
          </View>
        </View>
        
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
  
  // 💡 アコーディオン見出しのスタイル
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 8, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  sectionHeaderText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  accordionIcon: { fontSize: 14, fontWeight: 'bold' },
  
  listContent: { padding: 16, paddingBottom: 100 },
  settingsBtn: { paddingHorizontal: 10, paddingVertical: 2 },
  settingsBtnText: { fontSize: 26, fontWeight: 'bold', color: '#FFF', lineHeight: 28 },
  cardSpacing: { padding: 20, marginBottom: 16 },
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