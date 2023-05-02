const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const { ROOT_DIR, OUTPUT_DIR, MAX_WIDTH, MAX_HEIGHT, IMAGE_EXTENSIONS, myLog, initLog } = require("./common");

// ログファイルを生成
initLog();

const copyFile = (inputPath, outputPath, callback) => {
  // コピペ出力先のディレクトリが存在しない場合は作成する
  const outputDirectory = path.dirname(outputPath);
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  fs.copyFileSync(inputPath, outputPath);
  callback(outputPath);
}

const resizeAndSaveFile = (inputPath, outputPath, callback) => {
  sharp(inputPath)
    .metadata()
    .then(function(metadata) {
      const width = metadata.width;
      const height = metadata.height;

      // 最大サイズ以下の場合はリサイズをスキップしてコピペだけ
      if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
        copyFile(inputPath, outputPath, _ => myLog(`Copied: ${outputPath}`));
        return;
      }

      let newWidth = width;
      let newHeight = height;

      // 幅が最大サイズを超える場合、アスペクト比を保持したまま幅を最大サイズに変更
      if (width > MAX_WIDTH) {
        newWidth = MAX_WIDTH;
        newHeight = parseInt(height * (MAX_WIDTH / width));
      }

      // 高さが最大サイズを超える場合、アスペクト比を保持したまま高さを最大サイズに変更
      if (height > MAX_HEIGHT) {
        newWidth = parseInt(width * (MAX_HEIGHT / height));
        newHeight = MAX_HEIGHT;
      }

      // 出力先のディレクトリが存在しない場合は作成する
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // リサイズして出力
      sharp(inputPath)
        .resize(newWidth, newHeight)
        .toFile(outputPath, function(err, info) {
          if (err) {
            callback(`Failed to save file: ${outputPath}`);
          } else {
            callback(`Saved: [${width},${height}] -> [${newWidth},${newHeight}] ${outputPath}`);
          }
        });
    })
    .catch(function(err) {
      callback(`Failed to get metadata of file: ${inputPath}`);
    });
}

const processFiles = async (dirPath) => {
  const files = await fs.promises.readdir(dirPath);

  // 子ファイル・ディレクトリについて同期的に解析
  for (const file of files) {
    const inputPath = path.join(dirPath, file);
    const stat = await fs.promises.stat(inputPath);

    // ディレクトリの場合、下層について同期的に実行
    if (stat.isDirectory()) {
      // 下層を再帰処理
      await processFiles(inputPath);
    }
    // ファイルの場合、非同期でどんどんコピペ
    else {
      const relativePath = path.relative(ROOT_DIR, inputPath);
      const outputPath = path.join(OUTPUT_DIR, 'Resized', relativePath);

      const extension = path.extname(inputPath).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(extension)) {
        // 画像はリサイズしてコピペ
        resizeAndSaveFile(inputPath, outputPath, logString => {
          myLog(logString);
        });
      } else {
        // 単純にコピペ
        copyFile(inputPath, outputPath, outputPath => {
          myLog(`Not Image Copied: ${outputPath}`);
        });
      }
    }
  }
};

processFiles(ROOT_DIR);