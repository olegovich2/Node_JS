const fs = require("fs");
const { messageToClientSuccessWrite } = require("../utils/funcForWebsocket");
const { messageToclientErrorWrite } = require("../utils/funcForWebsocket");

// функция чтения и записи
const readAndWrite = (object, path) => {
  fs.readFile(`${path}/upload.json`, "utf8", function (error, fileContent) {
    if (error) throw error;
    const newObj = JSON.parse(fileContent);
    newObj[object.filename] = {};
    newObj[object.filename].comment = object.comment;
    newObj[object.filename].file = object.file;
    newObj[object.filename].id = object.id;
    const fileStream = fs.createWriteStream(`${path}/upload.json`);
    fileStream.write(JSON.stringify(newObj));
    fileStream.end(messageToClientSuccessWrite(object));
    fileStream.on("error", (err) => {
      console.error("Ошибка при записи файла:", err);
      messageToclientErrorWrite(object);
    });
  });
};

// если нет директории, то создает и записывает
const createFileAndWrite = (object, path) => {
  fs.stat(`${path}/upload.json`, function (err, stat) {
    const newObj = {};
    newObj[object.filename] = {};
    newObj[object.filename].comment = object.comment;
    newObj[object.filename].file = object.file;
    newObj[object.filename].id = object.id;
    if (err) {
      const fileStream = fs.createWriteStream(`${path}/upload.json`);
      fileStream.write(JSON.stringify(newObj));
      fileStream.end(messageToClientSuccessWrite(object));
      fileStream.on("error", (err) => {
        console.error("Ошибка при записи файла:", err);
        messageToclientErrorWrite(object);
      });
    }
  });
};

module.exports = {
  readAndWrite,
  createFileAndWrite,
};
