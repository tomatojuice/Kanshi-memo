import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../constants/ThemeContext';
import { TRANSLATIONS } from '../../constants/translations';

type Poem = { id: number; author_name: string; title: string; content: string; translation: string; explanation_cn: string; };

const adUnitId = __DEV__ ? TestIds.BANNER : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '');

export default function PoemDetailScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const { themeColor, lang, toggleLang } = useTheme(); // 💡 Contextから取得
  const t = TRANSLATIONS[lang];
  
  const [poem, setPoem] = useState<Poem | null>(null);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPoemAndMemo();
  }, [id]);

  const loadPoemAndMemo = async () => {
    try {
      const poemResult = await db.getFirstAsync<Poem>(
        `SELECT p.*, a.name as author_name FROM poems p JOIN authors a ON p.author_id = a.id WHERE p.id = ?`,
        [Number(id)]
      );
      setPoem(poemResult);

      const memoResult = await db.getFirstAsync<{ text: string }>('SELECT text FROM memos WHERE poem_id = ?', [Number(id)]);
      if (memoResult) {
        setMemo(memoResult.text);
      } else {
        setMemo(''); 
      }
    } catch (error) {
      console.error("データ読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveMemo = async () => {
    setSaving(true);
    try {
      const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM memos WHERE poem_id = ?', [Number(id)]);
      if (existing) {
        await db.runAsync('UPDATE memos SET text = ?, updated_at = CURRENT_TIMESTAMP WHERE poem_id = ?', [memo, Number(id)]);
      } else {
        await db.runAsync('INSERT INTO memos (poem_id, text) VALUES (?, ?)', [Number(id), memo]);
      }
      Alert.alert(t.completeTitle, t.saveSuccess); // 💡 翻訳ファイルを使用
    } catch (error) {
      console.error("メモ保存エラー:", error);
      Alert.alert(t.errorTitle, t.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={themeColor} />;

  if (!poem) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>詩が見つかりません。</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack.Screen 
          options={{ 
            title: poem.author_name,
            headerRight: () => (
              <TouchableOpacity style={styles.headerLangBtn} onPress={toggleLang}>
                <Text style={styles.headerLangText}>{t.langToggle}</Text>
              </TouchableOpacity>
            )
          }} 
        />
        
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.poemCard}>
              <Text style={styles.title}>{poem.title}</Text>
              <Text style={styles.content}>{poem.content}</Text>
            </View>

            <View style={styles.explanationCard}>
              <Text style={[styles.sectionTitle, { color: themeColor }]}>{t.translationTitle}</Text>
              <Text style={styles.explanationText}>{lang === 'JP' ? poem.translation : poem.explanation_cn}</Text>
            </View>

            <View style={styles.memoCard}>
              <Text style={[styles.sectionTitle, { color: themeColor }]}>{t.memoTitle}</Text>
              <TextInput style={styles.memoInput} multiline placeholder={t.memoPlaceholder} placeholderTextColor="#BDBDBD" value={memo} onChangeText={setMemo} />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: themeColor }]} onPress={saveMemo} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? t.savingText : t.saveBtn}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
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
  headerLangBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 10 },
  headerLangText: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' },
  scrollView: { padding: 16 },
  poemCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#202124', marginBottom: 20, textAlign: 'center' },
  content: { fontSize: 22, color: '#202124', textAlign: 'center', lineHeight: 40, letterSpacing: 2 },
  explanationCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  explanationText: { fontSize: 15, color: '#4A4D51', lineHeight: 26 },
  memoCard: { backgroundColor: '#FFFDE7', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderLeftWidth: 5, borderLeftColor: '#F4D03F' },
  memoInput: { minHeight: 100, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, fontSize: 16, color: '#202124', textAlignVertical: 'top', marginBottom: 16 },
  saveBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  adContainer: { alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: '#FDFBF7' },
});