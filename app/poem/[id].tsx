import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaView } from 'react-native-safe-area-context';

import { globalStyles } from '../../constants/globalStyles';
import { useTheme } from '../../constants/ThemeContext';
import { TRANSLATIONS } from '../../constants/translations';

type Poem = { id: number; author_name: string; title: string; content: string; translation: string; explanation_cn: string; };

const adUnitId = __DEV__ ? TestIds.BANNER : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '');

export default function PoemDetailScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const { themeColor, lang, toggleLang } = useTheme();
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
        'SELECT p.*, a.name as author_name FROM poems p JOIN authors a ON p.author_id = a.id WHERE p.id = ?',
        [Number(id)]
      );
      setPoem(poemResult);

      const memoResult = await db.getFirstAsync<{ text: string }>(
        'SELECT text FROM memos WHERE poem_id = ?',
        [Number(id)]
      );
      if (memoResult) {
        setMemo(memoResult.text);
      }
    } catch (error) {
      console.error("データの読み込みエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMemo = async () => {
    setSaving(true);
    try {
      const existingMemo = await db.getFirstAsync('SELECT id FROM memos WHERE poem_id = ?', [Number(id)]);
      if (existingMemo) {
        await db.runAsync('UPDATE memos SET text = ?, updated_at = CURRENT_TIMESTAMP WHERE poem_id = ?', [memo, Number(id)]);
      } else {
        await db.runAsync('INSERT INTO memos (poem_id, text) VALUES (?, ?)', [Number(id), memo]);
      }
      Alert.alert(t.saveSuccess);
    } catch (error) {
      console.error("メモの保存エラー:", error);
      Alert.alert(t.errorTitle || "エラー", t.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  if (!poem) {
    return (
      <View style={[globalStyles.safeArea, styles.center]}>
        <Text>データが見つかりません</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={globalStyles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack.Screen 
          options={{ 
            title: poem.title,
            headerRight: () => (
              <TouchableOpacity style={globalStyles.headerLangBtn} onPress={toggleLang}>
                <Text style={globalStyles.headerLangText}>{t.langToggle}</Text>
              </TouchableOpacity>
            )
          }} 
        />
        
        <View style={globalStyles.flex1}>
          <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            <View style={[globalStyles.cardBase, styles.poemCardSpacing]}>
              <Text style={styles.title}>{poem.title}</Text>
              <Text style={styles.content}>{poem.content}</Text>
            </View>

            <View style={[globalStyles.cardBase, styles.explanationCardSpacing]}>
              <Text style={[styles.sectionTitle, { color: themeColor }]}>{t.translationTitle}</Text>
              <Text style={styles.explanationText}>
                {lang === 'CN' ? poem.explanation_cn : poem.translation}
              </Text>
            </View>

            <View style={styles.memoCard}>
              <Text style={[styles.sectionTitle, { color: '#D4AC0D' }]}>📝 {t.memoTitle}</Text>
              <TextInput
                style={styles.memoInput}
                multiline
                placeholder={t.memoPlaceholder}
                placeholderTextColor="#BDBDBD"
                value={memo}
                onChangeText={setMemo}
                textAlignVertical="top"
              />
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: themeColor, opacity: saving ? 0.7 : 1 }]} 
                onPress={handleSaveMemo}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? t.savingText : t.saveBtn}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>

        <View style={globalStyles.adContainer}>
          <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollView: { padding: 16 },
  poemCardSpacing: { padding: 24, marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#202124', marginBottom: 20, textAlign: 'center' },
  content: { fontSize: 22, color: '#202124', textAlign: 'center', lineHeight: 40, letterSpacing: 2 },
  explanationCardSpacing: { padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  explanationText: { fontSize: 15, color: '#4A4D51', lineHeight: 26 },
  // 💡 マイメモ
  memoCard: { backgroundColor: '#FFFDE7', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, borderLeftWidth: 5, borderLeftColor: '#F4D03F' },
  memoInput: { minHeight: 120, fontSize: 16, color: '#202124', lineHeight: 24, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: 12, marginBottom: 16 },
  saveBtn: { paddingVertical: 12, borderRadius: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});