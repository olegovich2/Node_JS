const path = require("path");
const fs = require("fs");
const zlib = require("zlib"); // Для сжатия
const readlineSync = require("readline-sync"); // Для введения в консоли пользователем
var any = true;

const funcAutoCompressor = () => {
  console.log("==== AutoCompressor ====");
  const choice = readlineSync.question(
    `Do you want to (c)ompress or (d)ecompress a file?`
  );
  if (choice.toLowerCase() === "c") {
    questionPath();
  } else if (choice.toLowerCase() === "d") {
    decompressFile();
  } else {
    console.log('Invalid choice. Please enter "c" or "d".');
    funcAutoCompressor();
  }
};

const questionPath = () => {
  const inputPath = readlineSync.question(
    "Enter the path of the file to compress: "
  );
  if (!fs.existsSync(inputPath)) {
    console.log(
      `That file doesn't exist. Please check the path and try again. \n \n \n`
    );
    return funcAutoCompressor();
  }
  getFilesPr(inputPath);
};

const createGZ = async (string) => {
  try {
    any = false;
    const object = JSON.parse(string);
    console.log(
      `******Scan File: ${object.filePath}_____${object.type}******\n`
    );

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
        const originalSize = fs.statSync(object.filePath).size;
        const compressedSize = fs.statSync(outputPath).size;
        const percentage = ((1 - compressedSize / originalSize) * 100).toFixed(
          2
        );
        console.log("\nCompression complete!");
        console.log(`Original size: ${formatSize(originalSize)}`);
        console.log(`Compressed size: ${formatSize(compressedSize)}`);
        console.log(`You saved: ${percentage}% of space\n`);
        any = true;
      })
      .on("error", (error) => {
        console.log("Something went wrong:", error.message);
      });
  } catch (error) {
    console.log(error);
  }
};

const getFilesPr = async (dir) => {
  try {
    if (!dir.includes(".git")) {
      if (fs.statSync(dir).isDirectory()) {
        console.log(`\n******Scan Folder: ${dir}******\n`);
        const files = await fs.promises.readdir(dir).then((result) => {
          result.forEach((item) => {
            if (fs.statSync(`${dir}/${item}`).isDirectory()) {
              getFilesPr(`${dir}/${item}`);
            } else {
              new Promise((resolve, reject) => {
                setImmediate(() => {
                  resolve(`${dir}/${item}`);
                });
              }).then(async (result) => {
                timeAndPath(result);
              });
            }
          });
        });
      } else {
        new Promise((resolve, reject) => {
          setImmediate(() => {
            resolve(`${dir}`);
          });
        }).then(async (result) => {
          timeAndPath(result);
        });
      }
    } else {
      throw new Error("Path contains .git. Try changing path");
    }
  } catch (error) {
    console.log(error);
  }
};

const formatSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + " bytes";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + " KB";
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }
};

const timeAndPath = (path, object) => {
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
          if (any === true) resolve(`${JSON.stringify(object)}`);
          else {
            sleep(object, 500);
          }
        }).then((result) => {
          createGZ(`${result}`);
        });
      } else if (object.error && object.type === "archive") return console.log(`______NO FILE______`);
      if (!path.includes(".gz")) object.fileTime = stat.mtime;
      else object.gzTime = stat.mtime;

      if (object.gzTime && object.fileTime) resultObject(object);
      else if (!object.gzTime) {
        new Promise((resolve, reject) => {
          setImmediate(() => {
            resolve(`${object.filePath}.gz`);
          });
        }).then((result) => {
          timeAndPath(result, object);
        });
      } else if (!object.fileTime) {
        new Promise((resolve, reject) => {
          setImmediate(() => {
            resolve(`${object.gzPath.replace(".gz", "")}`);
          });
        }).then((result) => {
          timeAndPath(result, object);
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const resultObject = async (object) => {
  try {
    if (object.type === "file") {
      if (object.fileTime > object.gzTime) {
        console.log(
          `******Scan File: ${object.filePath}_____${object.type}******`
        );
        console.log(
          `______FILE:${object.filePath} HAS AN ARCHIVE, BUT THE ARCHIVE IS OUT OF THE DATE______\n`
        );
        return new Promise(async (resolve, reject) => {
          if (any === true) resolve(`${JSON.stringify(object)}`);
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
          `______FILE:${object.gzPath} ARCHIVE IS OUT OF THE DATE______\n`
        );
        return new Promise(async (resolve, reject) => {
          object.filePath = object.filePath.replace(".gz", "");
          if (any === true) resolve(`${JSON.stringify(object)}`);
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

function sleep(object, ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      awaitFunction(object);
    }, ms)
  );
}

const awaitFunction = (object) => {
  return new Promise(async (resolve, reject) => {
    if (any === true) resolve(`${JSON.stringify(object)}`);
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
  if (any === true) {
    console.log(`******Scan File: ${object.gzPath}_____${object.type}******`);
    console.log(`______FILE:${object.gzPath} ARCHIVE IS UP-TO-DATE______\n`);
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
  if (any === true) {
    console.log(`******Scan File: ${object.filePath}_____${object.type}******`);
    console.log(
      `______FILE:${object.filePath} HAS AN ARCHIVE, BUT THE ARCHIVE IS UP-TO-DATE______\n`
    );
  } else {
    sleepThree(object, 500);
  }
};

funcAutoCompressor();

// D:/github/Pilipenko-1/chess1/chess1.html
