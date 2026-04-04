// app/_layout.tsx
import { Stack } from 'expo-router';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

// 💡 テーマコンテキストとデータの読み込み
import { ThemeProvider, useTheme } from '../constants/ThemeContext';
import { KANSHI_DATA } from '../constants/kanshiData';

type PoemData = { title: string; content: string; translation: string; explanation_cn: string; };
type AuthorData = { name: string; phonetic: string; pinyin: string; era: string; introduction: string; introduction_cn: string; poems: PoemData[]; };

/**
 * 💡 データベースの初期化
 * アプリ起動時に1度だけ実行されます。
 */
async function initializeDatabase(db: SQLiteDatabase) {
  console.log('🔄 データベースの状態を確認中...');

  // 1. 各テーブルを「なければ作る」 (DROPはしません)
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
      FOREIGN KEY (author_id) REFERENCES authors (id)
    );
    CREATE TABLE IF NOT EXISTS user_memos (
      poem_id INTEGER PRIMARY KEY, 
      memo TEXT NOT NULL, 
      updated_at TEXT NOT NULL, 
      FOREIGN KEY (poem_id) REFERENCES poems (id)
    );
  `);

  // 2. 作者が1人もいない（＝アプリ初回起動）場合のみ、初期データを流し込む
  const authorCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM authors');
  
  if (authorCount && authorCount.count === 0) {
    console.log('📥 初期データを投入中...');
    
    for (const author of (KANSHI_DATA as AuthorData[])) {
      const authorResult = await db.runAsync(
        'INSERT INTO authors (name, phonetic, pinyin, era, introduction, introduction_cn) VALUES (?, ?, ?, ?, ?, ?)',
        [author.name || '', author.phonetic || '', author.pinyin || '', author.era || '', author.introduction || '', author.introduction_cn || '']
      );
      
      const authorId = authorResult.lastInsertRowId;
      
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

/**
 * 💡 ナビゲーションの構成
 * テーマカラーをヘッダーに連動させます。
 */
function StackLayout() {
  const { themeColor } = useTheme();

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
          animation: 'slide_from_bottom', // 下からぬるっと出てくる
          headerShown: false 
        }} 
      />
    </Stack>
  );
}

/**
 * 💡 アプリのルート
 */
export default function RootLayout() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    }>
      <SQLiteProvider 
        databaseName="kanshi_app_v1.db"
        onInit={initializeDatabase}
        useSuspense
      >
        <ThemeProvider>
          <StackLayout />
        </ThemeProvider>
      </SQLiteProvider>
    </Suspense>
  );
}