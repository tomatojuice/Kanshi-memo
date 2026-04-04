// app/index.tsx
import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView, Platform,
  SafeAreaView,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity, View
} from 'react-native';

import * as Localization from 'expo-localization';
import { useTheme } from '../constants/ThemeContext';
import { TRANSLATIONS } from '../constants/translations';

type Author = { 
  id: number; 
  name: string; 
  phonetic: string; 
  pinyin: string; 
  era: string; 
  introduction: string; 
  introduction_cn: string; 
  poem_count: number; 
};

type LangKey = 'JP' | 'CN';

// 💡 透明度付きの色を作るヘルパー関数
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // const [lang, setLang] = useState<LangKey>('JP');
  const router = useRouter();
  const deviceLanguage = Localization.getLocales()[0].languageCode;
  const initialLang = deviceLanguage?.includes('zh') ? 'CN' : 'JP';
  const [lang, setLang] = useState<LangKey>(initialLang);

  const t = TRANSLATIONS[lang];
  const { themeColor } = useTheme(); 

  useEffect(() => {
    async function fetchAuthors() {
      if (searchQuery.trim() === '') {
        // 全件表示
        const result = await db.getAllAsync<Author>(`
          SELECT 
            authors.*, 
            (SELECT COUNT(*) FROM poems WHERE poems.author_id = authors.id) as poem_count 
          FROM authors
        `);
        setAuthors(result);
      } else {
        // 💡 検索強化：作者名、時代、タイトル、本文、そして「マイメモ」からも探します
        const q = `%${searchQuery}%`;
        const result = await db.getAllAsync<Author>(`
          SELECT DISTINCT 
            authors.*, 
            (SELECT COUNT(*) FROM poems WHERE poems.author_id = authors.id) as poem_count 
          FROM authors
          LEFT JOIN poems ON authors.id = poems.author_id
          LEFT JOIN user_memos ON poems.id = user_memos.poem_id
          WHERE authors.name LIKE ? 
             OR authors.phonetic LIKE ?
             OR authors.era LIKE ?
             OR poems.title LIKE ?
             OR poems.content LIKE ?
             OR user_memos.memo LIKE ?
        `, [q, q, q, q, q, q]);
        setAuthors(result);
      }
    }
    fetchAuthors();
  }, [searchQuery]);

  const renderItem = ({ item }: { item: Author }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7} 
      onPress={() => router.push({ pathname: '/author/[id]', params: { id: item.id } })}
    >
      <View style={styles.header}>
        <View style={[styles.eraBadge, { backgroundColor: hexToRgba(themeColor, 0.1) }]}>
          <Text style={[styles.eraText, { color: themeColor }]}>{item.era}</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.authorName}>{item.name}</Text>
          {item.pinyin ? <Text style={styles.pinyin}>{item.pinyin}</Text> : null}
        </View>
      </View>
      
      <Text style={styles.intro} numberOfLines={2}>
        {lang === 'JP' ? item.introduction : item.introduction_cn}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.poemCount}>
          {t.recordedPoems}
          <Text style={[styles.poemCountNumber, { color: themeColor }]}>{item.poem_count}</Text>
          {t.counterUnit}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
<SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: t.headerTitle || '漢詩メモ',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={styles.headerLangToggle} 
                onPress={() => setLang(lang === 'JP' ? 'CN' : 'JP')}
              >
                <Text style={styles.headerLangText}>{t.langToggle}</Text>
              </TouchableOpacity>
              
              {/* 💡 歯車 ⚙️ から 三本点 ⋮ へ変更 */}
              <TouchableOpacity 
                onPress={() => router.push('/settings')} 
                style={styles.menuBtn}
              >
                <Text style={styles.menuBtnText}>⋮</Text>
              </TouchableOpacity>
            </View>
          )
        }} 
      />

      <FlatList 
        data={authors} 
        keyExtractor={(item) => item.id.toString()} 
        renderItem={renderItem} 
        contentContainerStyle={styles.listContent} 
        showsVerticalScrollIndicator={false} 
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.searchContainer} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput} 
            placeholder={t.searchPlaceholder} 
            placeholderTextColor="#9AA0A6" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            clearButtonMode="while-editing" 
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  headerLangToggle: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 10 },
  headerLangText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  menuBtn: {
    paddingHorizontal: 12, // 指が当たりやすいように幅を広めに
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBtnText: {
    fontSize: 28, // 記号なので少し大きめに
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 28,
  },
  listContent: { paddingTop: 10, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
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
  searchContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 20, paddingTop: 10, backgroundColor: 'rgba(245, 247, 250, 0.9)' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#202124' },
});