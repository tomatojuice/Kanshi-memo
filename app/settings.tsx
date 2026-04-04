import * as Localization from 'expo-localization'; // 💡 追加
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME_COLORS, useTheme } from '../constants/ThemeContext';
import { TRANSLATIONS } from '../constants/translations';

export default function SettingsScreen() {
  const router = useRouter();
  const { themeColor, setThemeColor } = useTheme();

  // 💡 OSの言語設定を取得して初期表示を決定
  const deviceLanguage = Localization.getLocales()[0].languageCode;
  const initialLang = deviceLanguage?.includes('zh') ? 'CN' : 'JP';
  
  // 他の画面と同様、翻訳オブジェクトを取得
  const t = TRANSLATIONS[initialLang]; 

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ヘッダーエリア */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.settings}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          {/* 現在のテーマカラーが閉じるボタンに反映されます */}
          <Text style={[styles.closeBtnText, { color: themeColor }]}>{t.close}</Text>
        </TouchableOpacity>
      </View>

      {/* テーマカラー選択セクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.themeColor}</Text>
        <View style={styles.colorPalette}>
          {(Object.keys(THEME_COLORS) as Array<keyof typeof THEME_COLORS>).map((key) => {
            const colorHex = THEME_COLORS[key];
            const isSelected = themeColor === colorHex;
            
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.8}
                style={[
                  styles.colorCircle,
                  { backgroundColor: colorHex },
                  isSelected && { borderColor: '#202124', borderWidth: 3 } // 選択中の枠線
                ]}
                onPress={() => setThemeColor(key)}
              >
                {isSelected && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* メニューセクション */}
      <View style={styles.section}>
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.menuItem}
          onPress={() => router.push('/about')}
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuItemEmoji}>ℹ️</Text>
            <Text style={styles.menuItemText}>{t.aboutApp}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* フッター（コピーライトなど） */}
      <Text style={styles.footerText}>{t.copyright}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA', 
    paddingHorizontal: 20 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 20, 
    marginBottom: 30 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#202124' 
  },
  closeBtn: { 
    paddingVertical: 8, 
    paddingHorizontal: 4 
  },
  closeBtnText: { 
    fontSize: 17, 
    fontWeight: '600' 
  },
  section: { 
    marginBottom: 32 
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#5F6368', 
    marginBottom: 12, 
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  colorPalette: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16, 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 20,
    // 軽いシャドウで浮かせる
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  colorCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  checkMark: { 
    color: '#FFF', 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  menuItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuItemEmoji: {
    fontSize: 20,
    marginRight: 12
  },
  menuItemText: { 
    fontSize: 17, 
    color: '#202124', 
    fontWeight: '500' 
  },
  chevron: { 
    fontSize: 24, 
    color: '#BDBDBD',
    fontWeight: '300'
  },
  footerText: {
    textAlign: 'center',
    color: '#BDC1C6',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40
  }
});