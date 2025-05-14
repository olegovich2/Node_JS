const path = require("path");
const os = require("os");
const fs = require("fs");
const zlib = require("zlib"); // Для сжатия
const readlineSync = require("readline-sync"); // Для введения в консоли пользователем
var any = true;

const funcAutoCompressor = () => {
  console.log("==== AutoCompressor ====");
  let platform = process.platform;
  const choice = readlineSync.question(
    `Do you want to (c)ompress, (d)ecompress or (del)ete a file?`
  );
  if (choice.toLowerCase() === "c") {
    questionPath(platform);
  } else if (choice.toLowerCase() === "d") {
    decompressPath(platform);
  } else if (choice.toLowerCase() === "del") {
    deletePath(platform);
  } else {
    console.log('Invalid choice. Please enter "c" or "d".');
    funcAutoCompressor();
  }
};

const questionPath = (platform) => {
  let reg = /\\/g;
  const inputPath = readlineSync.question(
    "Enter the path of the file to compress: "
  );
  if (platform === "win32") {
    let path = inputPath.replace(/\\/g, "/");
    if (!fs.existsSync(path)) {
      console.log(
        `That file doesn't exist. Please check the path and try again.   `
      );
      return funcAutoCompressor();
    }
    getFilesPr(path);
  } else {
    if (reg.test(inputPath)) {
      let path = inputPath.replace(/\\/g, "/");
      if (!fs.existsSync(path)) {
        console.log(
          `That file doesn't exist. Please check the path and try again.   `
        );
        return funcAutoCompressor();
      }
      getFilesPr(path);
    } else {
      if (!fs.existsSync(inputPath)) {
        console.log(
          `That file doesn't exist. Please check the path and try again.   `
        );
        return funcAutoCompressor();
      }
      getFilesPr(inputPath);
    }
  }
};

const deletePath = (platform) => {
  let reg = /\\/g;
  const inputPath = readlineSync.question(
    "Enter the path of the file to delete: "
  );
  if (platform === "win32") {
    let path = inputPath.replace(/\\/g, "/");
    if (!fs.existsSync(path)) {
      console.log(
        `That file doesn't exist. Please check the path and try again.   `
      );
      return funcAutoCompressor();
    }
    deleteOrDecompressFilesPr(path, "del");
  } else {
    if (reg.test(inputPath)) {
      let path = inputPath.replace(/\\/g, "/");
      if (!fs.existsSync(path)) {
        console.log(
          `That file doesn't exist. Please check the path and try again.   `
        );
        return funcAutoCompressor();
      }
      deleteOrDecompressFilesPr(path, "del");
    } else {
      if (!fs.existsSync(inputPath)) {
        console.log(
          `That file doesn't exist. Please check the path and try again.   `
        );
        return funcAutoCompressor();
      }
      deleteOrDecompressFilesPr(inputPath, "del");
    }
  }
};

const decompressPath = (platform) => {
  let reg = /\\/g;
  const inputPath = readlineSync.question(
    "Enter the path of the file to decompress: "
  );
  if (platform === "win32") {
    let path = inputPath.replace(/\\/g, "/");
    if (!fs.existsSync(path)) {
      console.log(
        `That file doesn't exist. Please check the path and try again.   `
      );
      return funcAutoCompressor();
    }
    deleteOrDecompressFilesPr(path, "d");
  } else {
    if (reg.test(inputPath)) {
      let path = inputPath.replace(/\\/g, "/");
      if (!fs.existsSync(path)) {
        console.log(
          `That file doesn't exist. Please check the path and try again.   `
        );
        return funcAutoCompressor();
      }
      deleteOrDecompressFilesPr(path, "d");
    } else {
      if (!fs.existsSync(inputPath)) {
        console.log(
          `That file doesn't exist. Please check the path and try again.   `
        );
        return funcAutoCompressor();
      }
      deleteOrDecompressFilesPr(inputPath, "d");
    }
  }
};

const createGZ = async (string) => {
  try {
    any = false;
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
        const originalSize = fs.statSync(object.filePath).size;
        const compressedSize = fs.statSync(outputPath).size;
        const percentage = ((1 - compressedSize / originalSize) * 100).toFixed(
          2
        );
        console.log(`Compression complete!`);
        console.log(`Original size: ${formatSize(originalSize)}`);
        console.log(`Compressed size: ${formatSize(compressedSize)}`);
        console.log(`You saved: ${percentage}% of space${os.EOL}`);
        any = true;
      })
      .on("error", (error) => {
        console.log("Something went wrong:", error.message);
      });
  } catch (error) {
    console.log(error);
  }
};

const decompressFile = async (object, param) => {
  try {
    any = param;
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
        console.log("\nDecompression complete!");
        console.log(`Output file: ${outputPath}${os.EOL}`);
        fs.unlink(`${object.gzPath}`, (err) => {
          if (err) throw err;
          console.log(`Deleted______${object.gzPath}${os.EOL}`);
        });
        any = true;
      })
      .on("error", (error) => {
        console.log("Something went wrong:", error.message);
        console.log("This might not be a valid compressed file.");
      });
  } catch (error) {
    console.log(error);
  }
};

const getFilesPr = async (dir) => {
  try {
    if (!dir.includes(".git")) {
      if (fs.statSync(dir).isDirectory()) {
        console.log(`******Scan Folder: ${dir}******`);
        const files = await fs.promises.readdir(dir).then((result) => {
          result.forEach((item) => {
            let path = `${dir}/${item}`;
            if (fs.statSync(`${path}`).isDirectory()) {
              getFilesPr(`${path}`);
            } else {
              new Promise((resolve, reject) => {
                resolve(`${dir}/${item}`);
              }).then((result) => {
                timeAndPath(result);
              });
            }
          });
        });
      } else {
        new Promise((resolve, reject) => {
          resolve(`${dir}`);
        }).then((result) => {
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

const deleteOrDecompressFilesPr = async (dir, str) => {
  try {
    if (!dir.includes(".git")) {
      if (fs.statSync(dir).isDirectory()) {
        console.log(`******Scan Folder: ${dir}******`);
        const files = await fs.promises.readdir(dir).then((result) => {
          result.forEach((item) => {
            let path = `${dir}/${item}`;
            if (fs.statSync(`${path}`).isDirectory()) {
              deleteOrDecompressFilesPr(`${path}`);
            } else {
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
                console.log("Пока нечего удалять");
              } else if (!path.includes(".gz") && str === "d") {
                console.log("Пока нечего разжимать");
              }
            }
          });
        });
      } else {
        if (dir.includes(".gz") && str === "del") {
          fs.unlink(`${dir}`, (err) => {
            if (err) throw err;
            console.log(`Deleted______${dir}`);
          });
        } else if (dir.includes(".gz") && str === "d") {
          new Promise((resolve, reject) => {
            resolve(`${dir}`);
          }).then((result) => {
            timeAndPath(result, {}, str);
          });
        }
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
          if (any === true) resolve(`${JSON.stringify(object)}`);
          else {
            sleep(object, 500);
          }
        }).then((result) => {
          createGZ(`${result}`);
        });
      } else if (object.error && object.type === "archive" && param === "d") {
        if (any === true) {
          any = false;
          return resultObjectForDecompress(object, "nofile");
        } else {
          return sleepFour(object, "nofile", 500);
        }
      }

      if (!path.includes(".gz")) object.fileTime = stat.mtime;
      else object.gzTime = stat.mtime;
      if (object.gzTime && object.fileTime && param === "d") {
        if (any === true) {
          any = false;
          return resultObjectForDecompress(object, "");
        } else {
          return sleepFour(object, "", 500);
        }
      } else if (object.gzTime && object.fileTime && !param)
        resultObject(object);
      else if (!object.gzTime) {
        new Promise((resolve, reject) => {
          setImmediate(() => {
            resolve(`${object.filePath}.gz`);
          });
        }).then((result) => {
          timeAndPath(result, object);
        });
      } else if (!object.fileTime && !param) {
        new Promise((resolve, reject) => {
          setImmediate(() => {
            resolve(`${object.gzPath.replace(".gz", "")}`);
          });
        }).then((result) => {
          timeAndPath(result, object);
        });
      } else if (!object.fileTime && param === "d") {
        new Promise((resolve, reject) => {
          setImmediate(() => {
            resolve(`${object.gzPath.replace(".gz", "")}`);
          });
        }).then((result) => {
          timeAndPath(result, object, "d");
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
          `______FILE:${object.filePath} HAS AN ARCHIVE, BUT THE ARCHIVE IS OUT OF THE DATE______`
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
          `______FILE:${object.gzPath} ARCHIVE IS OUT OF THE DATE______`
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

const resultObjectForDecompress = async (object, param) => {
  try {
    if (param === "nofile") {
      console.log(
        `*************No relevant file found, starting archive decompression***************`
      );
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
          any = true;
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
  if (any === true) {
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
  if (any === true) {
    any = false;
    resultObjectForDecompress(object, param);
  } else {
    sleepFour(object, "nofile", 500);
  }
};

funcAutoCompressor();

// D:/github/Pilipenko-1/chess1/chess1.html
