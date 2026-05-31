import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  // アプリ全体のベース
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  flex1: {
    flex: 1,
  },
  
  // 広告用コンテナ（全画面共通）
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#FDFBF7',
  },

  // ヘッダーの言語切り替えボタン
  headerLangBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  headerLangText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 白いカードのベーススタイル（リストや詳細画面の背景）
  cardBase: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  // リスト項目の右端にある矢印
  chevron: {
    fontSize: 20,
    color: '#BDBDBD',
  },
});