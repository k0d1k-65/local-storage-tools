const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const { ROOT_DIR, IMAGE_EXTENSIONS, myLog, initLog, bytesToSize } = require("./common");

// ログファイルを生成
initLog();

let extentions = [];

const analyzeFile = async (inputPath) => {
  const extension = path.extname(inputPath).toLowerCase();

  // 画像以外
  if (!IMAGE_EXTENSIONS.includes(extension)) {
    return {
      isImage: false,
    };
  }

  // 画像サイズの取得
  const metadata = await sharp(inputPath).metadata();

  return {
    isImage: true,
    width: metadata.width,
    height: metadata.height,
  }
}

const processFiles = async (dirPath, indent = '') => {
  const files = await fs.promises.readdir(dirPath);

  // インデント
  const indentSpaces = `  ${indent}`;

  // 始端ログ
  myLog(`${indentSpaces}[${path.basename(dirPath)}]`);

  // 子ファイルのフルパス
  const childFiles = [];

  // ディレクトリについて解析（1ディレクトリずつ）
  for (const file of files) {
    const inputPath = path.join(dirPath, file);
    const stat = await fs.promises.stat(inputPath);

    // ディレクトリの場合、下層について実行
    if (stat.isDirectory()) {
      // 下層を再帰処理
      await processFiles(inputPath, indentSpaces);
    }
    // ファイルの場合、ディレクトリについて完了後に処理するため、一旦スタック
    else {
      childFiles.push({
        inputPath,
        size: stat.size,
      });
    }
  }

  // ファイルの拡張子を保存
  extentions = [...extentions, ...childFiles.map(({inputPath}) => path.extname(inputPath).toLowerCase())];

  // ファイルについて解析
  const analyzed = await Promise.all(childFiles.map(async ({inputPath, size}) => {
    return {
      ...await analyzeFile(inputPath),
      size,
    }
  }));

  // ファイルの解析結果を統計
  const initStatistic = {
    count: 0,
    images: 0,
    sumSize: 0,
    maxSize: 0,
    avgSize: 0,
    sumWidth: 0,
    maxWidth: 0,
    avgWidth: 0,
    sumHeight: 0,
    maxHeight: 0,
    avgHeight: 0,
  }
  const statistic = analyzed.reduce((result, meta) => {
    result.count += 1;

    if (meta.isImage) {
      result.images += 1;

      result.sumSize += meta.size || 0;
      if (result.maxSize < meta.size) {
        result.maxSize = meta.size;
      }

      result.sumWidth += meta.width || 0;
      if (result.maxWidth < meta.width) {
        result.maxWidth = meta.width;
      }

      result.sumHeight += meta.height || 0;
      if (result.maxHeight < meta.height) {
        result.maxHeight = meta.height;
      }
    }

    return result;
  }, initStatistic);
  statistic.avgSize = statistic.images <= 0 ? 0 :statistic.sumSize / statistic.images;
  statistic.avgWidth = statistic.images <= 0 ? 0 :statistic.sumWidth / statistic.images;
  statistic.avgHeight = statistic.images <= 0 ? 0 :statistic.sumHeight / statistic.images;

  // 終端ログ
  myLog(`${indentSpaces}[${basename}: ${JSON.stringify({
    files: statistic.count,
    images: statistic.images,
    size: bytesToSize(statistic.sumSize),
    avgSize: bytesToSize(statistic.avgSize.toFixed(2)),
    maxWidth: statistic.maxWidth,
    avgWidth: statistic.avgWidth.toFixed(2),
    maxHeight: statistic.maxHeight,
    avgHeight: statistic.avgHeight.toFixed(2),
  })}]`);
};

(async _ => {
  await processFiles(ROOT_DIR);
  myLog([...new Set(extentions)].join(', '));
})();
