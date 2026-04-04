// init-db.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// 作成するデータベースのパス（Expoのassetsフォルダ内に出力します）
const dbPath = './assets/kanshi.db';

// 既にファイルがあれば削除（何度でもやり直せるように）
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('データベースの構築を開始します...');

  // 1. テーブルの作成
  db.run(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phonetic TEXT NOT NULL,
      era TEXT NOT NULL,
      introduction TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS poems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      translation TEXT NOT NULL,
      FOREIGN KEY (author_id) REFERENCES authors (id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poem_id INTEGER,
      memo TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (poem_id) REFERENCES poems (id)
    )
  `);

  // 2. サンプルデータの挿入（旧Data.javaの一部を模しています）
  // 実際はここにCSVを読み込む処理を書くか、INSERT文を並べます。
  const insertAuthor = db.prepare(`INSERT INTO authors (name, phonetic, era, introduction) VALUES (?, ?, ?, ?)`);
  
  // 例として李白と杜甫を登録
  insertAuthor.run('李白', 'りはく', '盛唐', '唐代を代表する詩人。詩仙と呼ばれる。');
  insertAuthor.run('杜甫', 'とほ', '盛唐', '唐代を代表する詩人。詩聖と呼ばれる。');
  insertAuthor.finalize();

  const insertPoem = db.prepare(`INSERT INTO poems (author_id, title, content, translation) VALUES (?, ?, ?, ?)`);
  
  // 李白(id:1)の詩
  insertPoem.run(1, '静夜思', '牀前看月光\n疑是地上霜\n...', 'ベッドの前に月の光を見て...');
  // 杜甫(id:2)の詩
  insertPoem.run(2, '春望', '国破山河在\n城春草木深\n...', '国は破れたが山河はあり...');
  insertPoem.finalize();

  console.log('✅ assets/kanshi.db の作成が完了しました！');
});

db.close();