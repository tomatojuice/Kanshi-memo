// app/poem/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import * as Localization from 'expo-localization';
import { useTheme } from '../../constants/ThemeContext';
import { TRANSLATIONS } from '../../constants/translations';

type Poem = { 
  id: number; 
  author_name: string; 
  title: string; 
  content: string; 
  translation: string; 
  explanation_cn: string; 
};

type LangKey = 'JP' | 'CN';

export default function PoemDetailScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  
  const [poem, setPoem] = useState<Poem | null>(null);
  const [memo, setMemo] = useState('');
//  const [lang, setLang] = useState<LangKey>('JP');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // 💡 1. OSの言語設定を取得
  const deviceLanguage = Localization.getLocales()[0].languageCode;
  const initialLang = deviceLanguage?.includes('zh') ? 'CN' : 'JP';
  
  // 💡 2. 取得した値を初期値にセット
  const [lang, setLang] = useState<LangKey>(initialLang);

  const t = TRANSLATIONS[lang];
  const { themeColor } = useTheme();

  useEffect(() => {
    async function fetchData() {
      const result = await db.getFirstAsync<Poem>(
        `SELECT poems.*, authors.name as author_name FROM poems JOIN authors ON poems.author_id = authors.id WHERE poems.id = ?`,
        [Number(id)]
      );
      setPoem(result);

      try {
        const memoRow = await db.getFirstAsync<{memo: string}>(
          'SELECT memo FROM user_memos WHERE poem_id = ?', 
          [Number(id)]
        );
        if (memoRow) {
          setMemo(memoRow.memo);
        } else {
          setMemo('');
        }
      } catch (e) {
        console.log("Memo fetch error:", e);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleSaveMemo = async () => {
    if (!poem) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      
      await db.runAsync(
        'INSERT OR REPLACE INTO user_memos (poem_id, memo, updated_at) VALUES (?, ?, ?)',
        [Number(id), memo, now]
      );

      // ✅ 翻訳ファイルを使用
      Alert.alert('', t.saveSuccess);
    } catch (e) {
      console.error("Save error details:", e);
      // ✅ エラーメッセージも翻訳ファイルと連動！
      const errorMessage = e instanceof Error ? e.message : t.unknownError;
      Alert.alert('Error', `${t.saveError}: ${errorMessage}`);
    }
    setSaving(false);
  };

  if (loading || !poem) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={themeColor} /></View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: poem.title, headerBackTitle: '戻る', headerRight: () => null }} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          
          <View style={styles.poemCard}>
            <Text style={styles.poemTitle}>{poem.title}</Text>
            <Text style={styles.authorName}>{poem.author_name}</Text>
            <View style={[styles.divider, { backgroundColor: hexToRgba(themeColor, 0.2) }]} />
            <Text style={styles.poemContent}>{poem.content}</Text>
          </View>

          <View style={styles.toggleContainer}>
            <TouchableOpacity style={[styles.toggleBtn, lang === 'JP' ? { backgroundColor: themeColor } : styles.toggleBtnInactive]} onPress={() => setLang('JP')}>
              <Text style={[styles.toggleText, lang === 'JP' ? styles.textActive : styles.textInactive]}>🇯🇵 現代語訳</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, lang === 'CN' ? { backgroundColor: themeColor } : styles.toggleBtnInactive]} onPress={() => setLang('CN')}>
              <Text style={[styles.toggleText, lang === 'CN' ? styles.textActive : styles.textInactive]}>🇨🇳 中文解説</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.explanationCard}>
            <Text style={[styles.sectionTitle, { color: themeColor }]}>{t.translationTitle}</Text>
            <Text style={styles.explanationText}>
              {lang === 'JP' ? poem.translation : poem.explanation_cn}
            </Text>
          </View>

          <View style={styles.memoCard}>
            <Text style={[styles.memoSectionTitle, { color: '#856404' }]}>📌 {t.memoTitle}</Text>
            <TextInput 
              style={styles.memoInput} 
              multiline 
              placeholder={t.memoPlaceholder} 
              placeholderTextColor="#9AA0A6" 
              value={memo} 
              onChangeText={setMemo} 
              textAlignVertical="top" 
            />
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: themeColor }]} 
              onPress={handleSaveMemo} 
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? '...' : t.saveBtn}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: 16 },
  poemCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginTop: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  poemTitle: { fontSize: 24, fontWeight: 'bold', color: '#202124', textAlign: 'center', marginBottom: 8 },
  authorName: { fontSize: 16, color: '#5F6368', textAlign: 'center', marginBottom: 20 },
  divider: { height: 1, marginBottom: 24, marginHorizontal: 20 },
  poemContent: { fontSize: 22, color: '#202124', textAlign: 'center', lineHeight: 40, letterSpacing: 2 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E8EAED', borderRadius: 12, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnInactive: { backgroundColor: 'transparent' },
  toggleText: { fontSize: 14, fontWeight: 'bold' },
  textActive: { color: '#FFFFFF' },
  textInactive: { color: '#5F6368' },
  explanationCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  explanationText: { fontSize: 15, color: '#4A4D51', lineHeight: 26 },
  memoCard: { backgroundColor: '#FFFDE7', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderLeftWidth: 5, borderLeftColor: '#F4D03F' },
  memoSectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  memoInput: { backgroundColor: '#FFF9C4', borderRadius: 12, padding: 16, fontSize: 16, color: '#202124', minHeight: 140, marginBottom: 16, lineHeight: 24 },
  saveButton: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});