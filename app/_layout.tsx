import { Stack } from 'expo-router';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
// 💡 1. スプラッシュスクリーンのライブラリをインポート
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from '../constants/ThemeContext';
import { KANSHI_DATA } from '../constants/kanshiData';

// 💡 2. アプリが起動した瞬間、勝手にスプラッシュ画面が消えるのを阻止する
SplashScreen.preventAutoHideAsync();

type PoemData = { title: string; content: string; translation: string; explanation_cn: string; };
type AuthorData = { name: string; phonetic: string; pinyin: string; era: string; introduction: string; introduction_cn: string; poems: PoemData[]; };

async function initializeDatabase(db: SQLiteDatabase) {
  console.log('🔄 データベースの状態を確認中...');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL, 
      phonetic TEXT NOT NULL, 
      pinyin TEXT NOT NULL, 
      era TEXT NOT NULL, 
      introduction TEXT NOT NULL, 
      introduction_cn TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS poems (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      author_id INTEGER, 
      title TEXT NOT NULL, 
      content TEXT NOT NULL, 
      translation TEXT NOT NULL, 
      explanation_cn TEXT NOT NULL, 
      FOREIGN KEY (author_id) REFERENCES authors (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poem_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (poem_id) REFERENCES poems (id) ON DELETE CASCADE
    );
  `);

  const existingAuthors = await db.getAllAsync('SELECT id FROM authors LIMIT 1');
  if (existingAuthors.length === 0) {
    console.log('📦 初回起動: JSONデータをSQLiteに投入します...');
    
    for (const author of KANSHI_DATA) {
      const result = await db.runAsync(
        'INSERT INTO authors (name, phonetic, pinyin, era, introduction, introduction_cn) VALUES (?, ?, ?, ?, ?, ?)',
        [author.name, author.phonetic, author.pinyin, author.era, author.introduction, author.introduction_cn || '']
      );
      const authorId = result.lastInsertRowId;

      for (const poem of author.poems) {
        await db.runAsync(
          'INSERT INTO poems (author_id, title, content, translation, explanation_cn) VALUES (?, ?, ?, ?, ?)',
          [authorId, poem.title || '', poem.content || '', poem.translation || '', poem.explanation_cn || '']
        );
      }
    }
    console.log('✅ データの投入が完了しました！');
  } else {
    console.log('✅ すでにデータが存在するため、投入をスキップします。');
  }
}

function StackLayout() {
  // 💡 3. コンテキストから isLoaded (設定の読み込み完了フラグ) も受け取る
  const { themeColor, isLoaded } = useTheme();

  // 💡 4. テーマや言語の準備が完全に終わったら、スプラッシュ画面をフワッと消す
  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded]);

  // isLoaded が false の間は、何も描画しない（スプラッシュ画面を見せ続ける）
  if (!isLoaded) {
    return null; 
  }

  return (
    <Stack 
      screenOptions={{ 
        headerStyle: { backgroundColor: themeColor },
        headerTintColor: '#fff', 
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="author/[id]" />
      <Stack.Screen name="poem/[id]" />
      <Stack.Screen name="about" />
      <Stack.Screen 
        name="settings" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob Initialized', adapterStatuses);
      });
  }, []);

  return (
    <Suspense fallback={
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    }>
      <SQLiteProvider databaseName="kanshi.db" onInit={initializeDatabase}>
        <ThemeProvider>
          <StackLayout />
        </ThemeProvider>
      </SQLiteProvider>
    </Suspense>
  );
}