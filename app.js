const path = require("path");
const os = require("os");
const fs = require("fs");
const zlib = require("zlib"); // Для сжатия
const readlineSync = require("readline-sync"); // Для введения в консоли пользователем

// шлюз, необходим для последовательного отображения проделанной работы в терминале, регулирует работу функций ожидания
let gateway = true;

// спрашивает, что делать будем
const funcAutoCompressor = () => {
  console.log("==== AutoCompressor ====");
  let platform = process.platform;
  const choice = readlineSync.question(
    `Do you want to (c)ompress files, or (d)ecompress or (del)ete archives?`
  );

  const choicedSymbol = choice.toLowerCase();

  if (["c", "d", "del"].includes(choicedSymbol)) {
    questionPath(platform, choicedSymbol);
  } else {
    console.log('Invalid choice. Please enter "c", "d" or "del".');
    funcAutoCompressor();
  }
};

const QUESTION_MESSAGES_MAP = {
  c: "Enter the path of the file or folder to compress files: ",
  d: "Enter the path of the file or folder to decompress archives: ",
  del: "Enter the path of the file or folder to delete archives: ",
};

const someCommonFunction = (path, param) => {
  fs.stat(path, function (err, stat) {
    if (err) {
      console.log(
        `That file doesn't exist. Please check the path and try again.   `
      );
      return funcAutoCompressor();
    }

    if (param === "c") getFilesPr(path);
    else deleteOrDecompressFilesPr(path, param);
  });
};

// для ввода пути, с последующей обработкой пути в зависимости от платформы использования
const questionPath = (platform, param) => {
  const reg = /\\/g;
  const inputPath = Object.hasOwn(QUESTION_MESSAGES_MAP, param)
    ? readlineSync.question(QUESTION_MESSAGES_MAP[param])
    : "";

  if (platform === "win32") {
    someCommonFunction(inputPath.replace(/\\/g, "/"), param);
  } else {
    if (reg.test(inputPath)) {
      someCommonFunction(inputPath.replace(/\\/g, "/"), param);
    } else {
      someCommonFunction(path, param);
    }
  }
};

// функция сжатия
const createGZ = async (string) => {
  try {
    gateway = false;
    const object = JSON.parse(string);
    console.log(`******Scan File: ${object.filePath}_____${object.type}******`);

    const outputPath = object.filePath + ".gz";
    console.log("Starting compression...");
    const readStream = fs.createReadStream(object.filePath);
    const writeStream = fs.createWriteStream(outputPath);
    const gzip = zlib.createGzip();
    console.log(`file compression:${object.filePath}`);
    readStream
      .pipe(gzip)
      .pipe(writeStream)
      .on("finish", () => {
        fs.stat(outputPath, function (err, stat) {
          if (err)
            throw new Error("Что-то пошло не так в функции сжатия fs.stat");
          const compressedSize = stat.size;
          const originalSize = object.size;
          const percentage = (
            (1 - compressedSize / originalSize) *
            100
          ).toFixed(2);
          console.log(`Compression complete!`);
          console.log(`Original size: ${formatSize(originalSize)}`);
          console.log(`Compressed size: ${formatSize(compressedSize)}`);
          console.log(`You saved: ${percentage}% of space${os.EOL}`);
          gateway = true;
        });
      })
      .on("error", (error) => {
        console.log("Something went wrong:", error.message);
      });
  } catch (error) {
    console.log(error);
  }
};

// функция разжатия архива с последующим удалением архива
const decompressFile = async (object, param) => {
  try {
    gateway = param;
    console.log(`******Scan File: ${object.gzPath}_____${object.type}******`);

    let outputPath = object.gzPath.endsWith(".gz")
      ? object.gzPath.slice(0, -3)
      : object.gzPath + ".decompressed";
    console.log(`Starting decompression...`);

    const readStream = fs.createReadStream(object.gzPath);
    const writeStream = fs.createWriteStream(outputPath);
    const gunzip = zlib.createGunzip();

    readStream
      .pipe(gunzip)
      .pipe(writeStream)
      .on("finish", () => {
        console.log("Decompression complete!");
        console.log(`Output file: ${outputPath}`);
        fs.unlink(`${object.gzPath}`, (err) => {
          if (err)
            throw new Error(
              "При удалении архива, после декомпрессии что-то пошло не так"
            );
          console.log(`Deleted______${object.gzPath}${os.EOL}`);
        });
        gateway = true;
      })
      .on("error", (error) => {
        console.log("Something went wrong:", error.message);
        console.log("This might not be a valid compressed file.");
      });
  } catch (error) {
    console.log(error);
  }
};

const func1 = (stat, path) => {
  if (stat.isDirectory()) {
    getFilesPr(`${path}`);
  } else {
    new Promise((resolve, reject) => {
      resolve(`${path}`);
    }).then((result) => {
      timeAndPath(result);
    });
  }
};

const func2 = (path, str) => {
  if (path.includes(".gz") && str === "del") {
    fs.unlink(`${path}`, (err) => {
      if (err) throw err;
      console.log(`Deleted______${path}`);
    });
  } else if (path.includes(".gz") && str === "d") {
    new Promise((resolve, reject) => {
      resolve(`${path}`);
    }).then((result) => {
      timeAndPath(result, {}, str);
    });
  } else if (!path.includes(".gz") && str === "del") {
    if (gateway === true) {
      gateway = false;
      console.log("Пока нечего удалять");
      gateway = true;
    } else {
      sleepFive("Пока нечего удалять", 300);
    }
  } else if (!path.includes(".gz") && str === "d") {
    if (gateway === true) {
      gateway = false;
      console.log("Пока нечего разжимать");
      gateway = true;
    } else {
      sleepFive("Пока нечего разжимать", 300);
    }
  }
};

const func3 = (stat, path, str) => {
  if (stat.isDirectory()) {
    deleteOrDecompressFilesPr(`${path}`, str);
  } else {
    func2(path, str);
  }
};

const func4 = (dir) => {
  new Promise((resolve) => {
    resolve(`${dir}`);
  }).then((result) => {
    timeAndPath(result);
  });
};

// рекурссивная функция получения всех путей в указанной папке, нужна для последующего сжатия
const getFilesPr = (dir) => {
  workingWithFiles(func1, func4, dir);
};

// рекурссивная функция получения всех путей в указанной папке, нужна для последующего удаления или разжатия
const deleteOrDecompressFilesPr = async (dir, str) => {
  workingWithFiles(func3, func2, dir, str);
};

const workingWithFiles = async (cb1, cb2, dir, str) => {
  try {
    if (dir.includes(".git")) {
      console.log(`Сканирует: ${dir}`);
      return;
    }

    fs.stat(`${dir}`, async function (err, stat) {
      if (err) throw new Error("function getFilesPr not found dir");
      if (stat.isDirectory()) {
        console.log(`******Scan Folder: ${dir}******`);
        const files = await fs.promises.readdir(dir).then((result) => {
          result.forEach((item) => {
            let path = `${dir}/${item}`;
            fs.stat(`${path}`, function (err, stat) {
              if (err) throw new Error("function getFilesPr not found path");
              cb1(stat, path, str);
            });
          });
        });
      } else {
        cb2(dir, str);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// для указания размеров файла после сжатия
const formatSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + " bytes";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + " KB";
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
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
        return new Promise(async (resolve, reject) => {
          if (gateway === true) resolve(`${JSON.stringify(object)}`);
          else {
            sleep(object, 500);
          }
        }).then((result) => {
          createGZ(`${result}`);
        });
      } else if (object.error && object.type === "archive" && param === "d") {
        if (gateway === true) {
          gateway = false;
          return resultObjectForDecompress(object, "nofile");
        } else {
          return sleepFour(object, "nofile", 500);
        }
      }

      if (!path.includes(".gz")) {
        object.fileTime = stat.mtime;
        object.size = stat.size;
      } else object.gzTime = stat.mtime;
      if (object.gzTime && object.fileTime && param === "d") {
        if (gateway === true) {
          gateway = false;
          return resultObjectForDecompress(object, "");
        } else {
          return sleepFour(object, "", 500);
        }
      } else if (object.gzTime && object.fileTime && !param)
        resultObject(object);
      else if (!object.gzTime) {
        new Promise((resolve, reject) => {
          resolve(`${object.filePath}.gz`);
        }).then((result) => {
          timeAndPath(result, object);
        });
      } else if (!object.fileTime && !param) {
        new Promise((resolve, reject) => {
          resolve(`${object.gzPath.replace(".gz", "")}`);
        }).then((result) => {
          timeAndPath(result, object);
        });
      } else if (!object.fileTime && param === "d") {
        new Promise((resolve, reject) => {
          resolve(`${object.gzPath.replace(".gz", "")}`);
        }).then((result) => {
          timeAndPath(result, object, "d");
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

// функция для обработки полученных данных перед сжатием
const resultObject = async (object) => {
  try {
    if (object.type === "file") {
      if (object.fileTime > object.gzTime) {
        console.log(
          `******Scan File: ${object.filePath}_____${object.type}******`
        );
        console.log(
          `______FILE:${object.filePath} HAS AN ARCHIVE, BUT THE ARCHIVE IS OUT OF THE DATE______`
        );
        return new Promise(async (resolve, reject) => {
          if (gateway === true) resolve(`${JSON.stringify(object)}`);
          else {
            await sleep(object, 500);
          }
        }).then((result) => {
          console.log(`______Create New Archive______`);
          createGZ(`${result}`);
        });
      } else {
        sleepThree(object, 500);
      }
    } else {
      if (object.fileTime > object.gzTime) {
        console.log(
          `******Scan File: ${object.gzPath}_____${object.type}******`
        );
        console.log(
          `______FILE:${object.gzPath} ARCHIVE IS OUT OF THE DATE______`
        );
        return new Promise(async (resolve, reject) => {
          object.filePath = object.filePath.replace(".gz", "");
          if (gateway === true) resolve(`${JSON.stringify(object)}`);
          else {
            await sleep(object, 500);
          }
        }).then((result) => {
          console.log(`______Create New Archive______`);
          createGZ(`${result}`);
        });
      } else {
        sleepTwo(object, 500);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// функция для обработки полученных данных перед разжатием
const resultObjectForDecompress = async (object, param) => {
  try {
    // console.log(object, param);

    if (param === "nofile") {
      console.log(
        `*************No relevant file found, starting archive decompression***************`
      );
      // console.log(object, param);
      decompressFile(object, "false");
    } else {
      if (object.fileTime > object.gzTime) {
        console.log(
          `______FILE:${object.fileTime} ARCHIVE IS OUT OF THE DATE______`
        );
        const result = actualFile();
        if (result === "y") {
          decompressFile(object, "false");
        } else {
          gateway = true;
        }
      } else {
        console.log(
          `______FILE:${object.fileTime} ARCHIVE IS UP-TO-DATE______`
        );
        decompressFile(object, "false");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// если при декомпрессии выявляется архив, у которого файл с более свежей датой, то вас спросят нужно лиего разжать
const actualFile = () => {
  const choice = readlineSync.question(
    `Do you want to decompress archive, because the file is more current than the archive? Press (y)es or (n)o:`
  );
  if (choice === "y") {
    return "y";
  } else if (choice === "n") {
    return "n";
  } else {
    console.log("You entered an invalid character. Try again.");
    actualFile();
  }
};

//функции ожидания, работают в паре, нужны для корректного отображения информации в терминале, без них происходят все процессы, но с "кашей" в терминале
function sleep(object, ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      awaitFunction(object);
    }, ms)
  );
}

const awaitFunction = (object) => {
  return new Promise(async (resolve, reject) => {
    if (gateway === true) resolve(`${JSON.stringify(object)}`);
    else {
      sleep(object, 500);
    }
  }).then((result) => {
    createGZ(`${result}`);
  });
};

function sleepTwo(object, ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      awaitFunctionTwo(object);
    }, ms)
  );
}

const awaitFunctionTwo = (object) => {
  if (gateway === true) {
    console.log(`******Scan File: ${object.gzPath}_____${object.type}******`);
    console.log(`______FILE:${object.gzPath} ARCHIVE IS UP-TO-DATE______`);
  } else {
    sleepTwo(object, 500);
  }
};

function sleepThree(object, ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      awaitFunctionThree(object);
    }, ms)
  );
}

const awaitFunctionThree = (object) => {
  if (gateway === true) {
    console.log(`******Scan File: ${object.filePath}_____${object.type}******`);
    console.log(
      `______FILE:${object.filePath} HAS AN ARCHIVE, BUT THE ARCHIVE IS UP-TO-DATE______`
    );
  } else {
    sleepThree(object, 500);
  }
};

function sleepFour(object, param, ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      awaitFunctionFour(object, param);
    }, ms)
  );
}

const awaitFunctionFour = (object, param) => {
  if (gateway === true) {
    gateway = false;
    resultObjectForDecompress(object, param);
  } else {
    sleepFour(object, param, 500);
  }
};

function sleepFive(str, ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      awaitFunctionFive(str);
    }, ms)
  );
}

const awaitFunctionFive = (str) => {
  if (gateway === true) {
    gateway = false;
    console.log(str);
    gateway = true;
  } else {
    sleepFive(str, 333);
  }
};

// запуск приложения
funcAutoCompressor();
