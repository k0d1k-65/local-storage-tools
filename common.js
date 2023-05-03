const path = require('path');
const fs = require('fs');

/** 入力ディレクトリのパス */
exports.ROOT_DIR = '../images';
/** 出力ディレクトリのパス */
exports.OUTPUT_DIR = '..';

/** リサイズ後の最大幅 */
exports.MAX_WIDTH = 1024;
/** リサイズ後の最大高さ */
exports.MAX_HEIGHT = 1000;

/** 画像識別対象の拡張子 */
exports.IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.jfif'];

const now = new Date();
const timestamp = now.getFullYear().toString().padStart(4, '0')
  + (now.getMonth() + 1).toString().padStart(2, '0')
  + now.getDate().toString().padStart(2, '0') + '-'
  + now.getHours().toString().padStart(2, '0')
  + now.getMinutes().toString().padStart(2, '0')
  + now.getSeconds().toString().padStart(2, '0');

/** ログファイル名 */
const LOG_FILE_NAME = `log_${timestamp}.txt`;
const LOG_ERROR_FILE_NAME = `log_${timestamp}.error.txt`;

exports.initLog = () => {
  const logFileName = path.join(__dirname, LOG_FILE_NAME);
  fs.writeFileSync(logFileName, ''); // 追加
};

exports.myLog = (logString, level = 'info', callback) => {
  const logFileName = level === 'error'
    ? path.join(__dirname, LOG_ERROR_FILE_NAME)
    : path.join(__dirname, LOG_FILE_NAME);

    const logData = `${new Date().toISOString()} - ${logString}\n`;

  fs.appendFile(logFileName, logData, function(err) {
    if (err) {
      console.error(`Failed to write log: ${logString}`);
    }

    if (callback) {
      callback();
    }
  });
};

exports.bytesToSize = (bytes) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 B';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};
