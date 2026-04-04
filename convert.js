// convert.js
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// UTF-8(BOM付き)も安全に読み込める設定
const authorsCsv = fs.readFileSync('./authors.csv', 'utf8');
const poemsCsv = fs.readFileSync('./poems.csv', 'utf8');

const authorsRecords = parse(authorsCsv, { columns: true, skip_empty_lines: true, bom: true });
const poemsRecords = parse(poemsCsv, { columns: true, skip_empty_lines: true, bom: true });

const authorMap = {};
let poemCount = 0;

// 1. 作者マスターの構築
authorsRecords.forEach(row => {
  const name = (row['作者'] || '').trim();
  if (!name) return;
  authorMap[name] = {
    name: name,
    phonetic: (row['ふりがな'] || '').trim(),
    pinyin: (row['ピンイン'] || '').trim(),
    era: (row['時代'] || '').trim(),
    introduction: (row['作者紹介'] || '').trim(),
    introduction_cn: (row['作者簡介'] || '').trim(), // 👈 追加した列を読み込む
    poems: []
  };
});

// 2. 漢詩データの紐付け
poemsRecords.forEach(row => {
  const authorName = (row['作者名'] || '').trim();
  if (!authorName) return;

  if (!authorMap[authorName]) {
    authorMap[authorName] = {
      name: authorName,
      phonetic: '', pinyin: '', era: (row['時代'] || '').trim(),
      introduction: '', introduction_cn: '', poems: []
    };
  }

  const title = (row['タイトル'] || '').trim();
  if (title) {
    poemCount++;
    authorMap[authorName].poems.push({
      title: title,
      content: (row['漢詩本文'] || '').trim(),
      translation: (row['和訳'] || '').trim(),
      explanation_cn: (row['解説'] || '').trim()
    });
  }
});

const finalData = Object.values(authorMap);
const outputContent = `export const KANSHI_DATA = ${JSON.stringify(finalData, null, 2)};\n`;

if (!fs.existsSync('./constants')) fs.mkdirSync('./constants');
fs.writeFileSync('./constants/kanshiData.ts', outputContent, 'utf8');

console.log(`✅ データ生成完了！ (作者: ${finalData.length}人 / 漢詩: ${poemCount}件)`);