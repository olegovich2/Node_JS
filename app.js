const os = require("os");
const fs = require("fs");
const zlib = require("zlib"); // Для сжатия
const readlineSync = require("readline-sync"); // Для введения в консоли пользователем

// объекта для хранения строк
const questionMessagesMap = {
  c: "Enter the path of the file or folder to compress files: ",
  d: "Enter the path of the file or folder to decompress archives: ",
  del: "Enter the path of the file or folder to delete archives: ",
  questionOne:
    "Do you want to (c)ompress files, or (d)ecompress or (del)ete archives?",
  questionTwo: `Do you want to decompress archive, because the file is more current than the archive? Press (y)es or (n)o:`,
  answerOne: 'Invalid choice. Please enter "c", "d" or "del".',
  answerTwo: "That file doesn't exist. Please check the path and try again.",
  answerThree: "You entered an invalid character. Try again.",
  errorOne: "При удалении архива, после декомпрессии что-то пошло не так",
  errorTwo: "This might not be a valid compressed file.",
  errorThree: "function getFilesPr not found dir",
  errorFour: "function getFilesPr not found path",
  errorFive: "function deleteOrDecompressFilesPr not found dir",
  errorSix: "function deleteOrDecompressFilesPr not found path",
  messageOne: "Пока нечего удалять",
  messageTwo: "Пока нечего разжимать",
  noRelevant: `*************No relevant file found, starting archive decompression***************`,
  createArchive: `______Create New Archive______`,
};

// спрашивает, что делать будем
const funcAutoCompressor = () => {
  console.log("==== AutoCompressor ====");
  let platform = process.platform;
  const choice = readlineSync.question(questionMessagesMap.questionOne);
  const choicedSymbol = choice.toLowerCase();
  if (["c", "d", "del"].includes(choicedSymbol)) {
    questionPath(platform, choicedSymbol);
  } else {
    console.log(questionMessagesMap.answerOne);
    funcAutoCompressor();
  }
};
// проверка пути
const someCommonFunction = (path, param) => {
  fs.stat(path, function (err, stat) {
    if (err) {
      console.log(questionMessagesMap.answerTwo);
      return funcAutoCompressor();
    }
    if (param === "c") {
      getFilesPr(path);
    } else deleteOrDecompressFilesPr(path, param);
  });
};

// для ввода пути, с последующей обработкой пути в зависимости от платформы использования
const questionPath = (platform, param) => {
  const reg = /\\/g;
  const inputPath = Object.hasOwn(questionMessagesMap, param)
    ? readlineSync.question(questionMessagesMap[param])
    : "";

  if (platform === "win32") {
    someCommonFunction(inputPath.replace(/\\/g, "/"), param);
  } else {
    if (reg.test(inputPath)) {
      someCommonFunction(inputPath.replace(/\\/g, "/"), param);
    } else {
      someCommonFunction(inputPath, param);
    }
  }
};

// функция сжатия
const createGZ = (string) => {
  try {
    const object = JSON.parse(string);
    if (object.messageArchiveUp) {
      console.log(
        `******Scan File: ${object.filePath}_____${object.type}******`
      );
      console.log(`${object.messageArchiveUp}${os.EOL}`);
    } else if (object.messageArchiveUpTwo) {
      console.log(`******Scan File: ${object.gzPath}_____${object.type}******`);
      console.log(`${object.messageArchiveUpTwo}${os.EOL}`);
    } else {
      const outputPath = object.filePath + ".gz";
      const readStream = fs.createReadStream(object.filePath);
      const writeStream = fs.createWriteStream(outputPath);
      const gzip = zlib.createGzip();

      readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on("finish", () => {
          if (object.type === "file") {
            console.log(
              `******Scan File: ${object.filePath}_____${object.type}******`
            );
          } else {
            console.log(
              `******Scan File: ${object.gzPath}_____${object.type}******`
            );
          }
          if (object.messageArchiveOut) {
            console.log(object.messageArchiveOut);
            console.log(object.messageNewArchive);
          }
          if (object.messageArchiveOutTwo) {
            console.log(object.messageArchiveOutTwo);
            console.log(object.messageNewArchive);
          }
          console.log("Starting compression...");
          console.log(`file compression:${object.filePath}`);
          console.log(`Compression complete!${os.EOL}`);
        })
        .on("error", (error) => {
          console.log("Something went wrong:", error.message);
        });
    }
  } catch (error) {
    console.log(error);
  }
};

// функция разжатия архива с последующим удалением архива
const decompressFile = (object) => {
  try {
    let outputPath = object.gzPath.endsWith(".gz")
      ? object.gzPath.slice(0, -3)
      : object.gzPath + ".decompressed";

    const readStream = fs.createReadStream(object.gzPath);
    const writeStream = fs.createWriteStream(outputPath);
    const gunzip = zlib.createGunzip();

    readStream
      .pipe(gunzip)
      .pipe(writeStream)
      .on("finish", () => {
        fs.unlink(`${object.gzPath}`, (err) => {
          if (err) throw new Error(questionMessagesMap.errorOne);
          if (object.noRelevantFile) console.log(object.noRelevantFile);
          console.log(
            `******Scan File: ${object.gzPath}_____${object.type}******`
          );
          if (object.decArchiveOut) console.log(object.decArchiveOut);
          if (object.decArchiveUp) console.log(object.decArchiveUp);
          console.log(`Starting decompression...`);
          console.log("Decompression complete!");
          console.log(`Output file: ${outputPath}`);
          console.log(`Deleted______${object.gzPath}${os.EOL}`);
        });
      })
      .on("error", (error) => {
        console.log("Something went wrong:", error.message);
        console.log(questionMessagesMap.errorTwo);
      });
  } catch (error) {
    console.log(error);
  }
};

// рекурссивная функция получения всех путей в указанной папке, нужна для последующего сжатия
const getFilesPr = (dir) => {
  try {
    if (!dir.includes(".git")) {
      fs.stat(`${dir}`, async function (err, stat) {
        if (err) throw new Error(questionMessagesMap.errorThree);
        if (stat.isDirectory()) {
          console.log(`******Scan Folder: ${dir}******${os.EOL}`);
          const files = await fs.promises.readdir(dir).then((result) => {
            result.forEach((item) => {
              let path = `${dir}/${item}`;
              fs.stat(`${path}`, function (err, stat) {
                if (err) throw new Error(questionMessagesMap.errorFour);
                if (stat.isDirectory()) {
                  getFilesPr(`${path}`);
                } else {
                  timeAndPath(path);
                }
              });
            });
          });
        } else {
          timeAndPath(dir);
        }
      });
    } else {
      console.log(`Сканирует: ${dir}`);
    }
  } catch (error) {
    console.log(error);
  }
};

// рекурссивная функция получения всех путей в указанной папке, нужна для последующего удаления или разжатия
const deleteOrDecompressFilesPr = async (dir, str) => {
  try {
    if (!dir.includes(".git")) {
      fs.stat(`${dir}`, async function (err, stat) {
        if (err) throw new Error(questionMessagesMap.errorFive);
        if (stat.isDirectory()) {
          console.log(`******Scan Folder: ${dir}******${os.EOL}`);
          const files = await fs.promises.readdir(dir).then((result) => {
            result.forEach((item) => {
              let path = `${dir}/${item}`;
              fs.stat(`${path}`, function (err, stat) {
                if (err) throw new Error(questionMessagesMap.errorSix);
                if (stat.isDirectory()) {
                  deleteOrDecompressFilesPr(`${path}`, str);
                } else {
                  if (path.includes(".gz") && str === "del") {
                    fs.unlink(`${path}`, (error) => {
                      if (error) throw error;
                      console.log(`Deleted______${path}`);
                    });
                  } else if (path.includes(".gz") && str === "d") {
                    timeAndPath(path, {}, str);
                  } else if (!dir.includes(".gz") && str === "del") {
                    console.log(questionMessagesMap.messageOne);
                  } else if (!dir.includes(".gz") && str === "d") {
                    console.log(questionMessagesMap.messageTwo);
                  }
                }
              });
            });
          });
        } else {
          if (dir.includes(".gz") && str === "del") {
            fs.unlink(`${dir}`, (error) => {
              if (error) throw error;
              console.log(`Deleted______${dir}`);
            });
          } else if (dir.includes(".gz") && str === "d") {
            timeAndPath(dir, {}, str);
          } else if (!dir.includes(".gz") && str === "del") {
            console.log(questionMessagesMap.messageOne);
          } else if (!dir.includes(".gz") && str === "d") {
            console.log(questionMessagesMap.messageTwo);
          }
        }
      });
    } else {
      console.log(`Сканирует: ${dir}`);
    }
  } catch (error) {
    console.log(error);
  }
};

// функция получения ценных данных об файле перед сжатием или разжатием
const timeAndPath = (path, object, param) => {
  try {
    var object = object || {};
    if (!path.includes(".gz") && !object.type) {
      object.filePath = path;
      object.type = "file";
    } else if (path.includes(".gz") && !object.type) {
      object.gzPath = path;
      object.type = "archive";
    }
    fs.stat(path, function (err, stat) {
      if (err) object.error = "nofile";
      if (object.error && object.type === "file") {
        return createGZ(JSON.stringify(object));
      } else if (object.error && object.type === "archive" && param === "d") {
        object.noRelevantFile = questionMessagesMap.noRelevant;
        return decompressFile(object);
      }
      if (!path.includes(".gz")) {
        if (object.error) {
          return resultObject(object);
        } else {
          object.fileTime = stat.mtime;
          object.size = stat.size;
        }
      } else object.gzTime = stat.mtime;
      if (object.gzTime && object.fileTime && param === "d") {
        return resultObjectForDecompress(object);
      } else if (object.gzTime && object.fileTime && !param)
        return resultObject(object);
      else if (!object.gzTime) {
        return timeAndPath(`${object.filePath}.gz`, object);
      } else if (!object.fileTime && !param) {
        return timeAndPath(`${object.gzPath.replace(".gz", "")}`, object);
      } else if (!object.fileTime && param === "d") {
        return timeAndPath(`${object.gzPath.replace(".gz", "")}`, object, "d");
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// функция для обработки полученных данных перед сжатием
const resultObject = async (object) => {
  try {
    if (object.error) {
      console.log(`******Scan File: ${object.gzPath}_____${object.type}******`);
      console.log(
        `______FILE:${object.gzPath} ARCHIVE WITHOUT FILE______${os.EOL}`
      );
    }
    if (object.type === "file") {
      if (object.fileTime > object.gzTime) {
        object.messageArchiveOut = `______FILE:${object.filePath} HAS AN ARCHIVE, BUT THE ARCHIVE IS OUT OF THE DATE______`;
        object.messageNewArchive = questionMessagesMap.createArchive;
        return createGZ(JSON.stringify(object));
      } else {
        object.messageArchiveUp = `______FILE:${object.filePath} HAS AN ARCHIVE, BUT THE ARCHIVE IS UP-TO-DATE______`;
        return createGZ(JSON.stringify(object));
      }
    } else {
      if (object.fileTime > object.gzTime) {
        object.messageArchiveOutTwo = `______FILE:${object.gzPath} ARCHIVE IS OUT OF THE DATE______`;
        object.messageNewArchive = questionMessagesMap.createArchive;
        object.filePath = object.gzPath.replace(".gz", "");
        return createGZ(JSON.stringify(object));
      } else {
        object.messageArchiveUpTwo = `______FILE:${object.gzPath} ARCHIVE IS UP-TO-DATE______`;
        return createGZ(JSON.stringify(object));
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// функция для обработки полученных данных перед разжатием
const resultObjectForDecompress = (object, param) => {
  try {
    if (object.fileTime > object.gzTime) {
      object.decArchiveOut = `______FILE:${object.gzPath} ARCHIVE IS OUT OF THE DATE______`;
      const result = actualFile();
      if (result === "y") {
        decompressFile(object);
      } else {
        console.log(`FILE:${object.gzPath} --- decompression stopped`);
      }
    } else {
      object.decArchiveUp = `______FILE:${object.gzPath} ARCHIVE IS UP-TO-DATE______`;
      decompressFile(object);
    }
  } catch (error) {
    console.log(error);
  }
};

// если при декомпрессии выявляется архив, у которого файл с более свежей датой, то вас спросят нужно лиего разжать
const actualFile = () => {
  const choice = readlineSync.question(questionMessagesMap.questionTwo);
  const choicedSymbol = choice.toLowerCase();
  if (["y", "n"].includes(choicedSymbol)) {
    return choicedSymbol;
  } else {
    console.log(questionMessagesMap.answerThree);
    actualFile();
  }
};

// запуск приложения
funcAutoCompressor();
