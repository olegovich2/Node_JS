const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
let clients = []; //массив клиентов

// работа websocket
const server = new WebSocket.Server({ port: 7680 });
server.on("connection", (connection) => {
  try {
    let directory = ""; //название директории для извенения файла
    let countMessage = 0; //счетчик сообщений вебсокета
    connection.on("message", (message) => {
      if (
        new TextDecoder("utf-8").decode(message) === "Соединение установлено"
      ) {
        //создание клиента
        countMessage++;
        clients.forEach((client) => {
          if (client.connection === connection)
            client.lastkeepalive = Date.now();
        });
        connection.send("Соединение установлено");
      } else if (countMessage === 1) {
        // создание папки для клиента или запись в существующую
        clients.forEach((client) => {
          if (client.connection === connection)
            client.lastkeepalive = Date.now();
        });
        directory = new TextDecoder("utf-8").decode(message);
        connection.send("Получено название директории");
        countMessage++;
      } else if (new TextDecoder("utf-8").decode(message) === "CLOSE") {
        //передача данных завершена
        connection.send("Передача данных завершена");
        directory = "";
        countMessage = 0;
        clients.forEach((client) => {
          if (Date.now() > client.lastkeepalive) {
            client.connection.close(1000, "Соединение с сервером закрыто");
            client.connection = null;
          }
        });
        clients = clients.filter((client) => client.connection);
      } else if (
        (new TextDecoder("utf-8").decode(message) !== "CLOSE" &&
          countMessage > 1) ||
        (new TextDecoder("utf-8").decode(message) !==
          "Соединение установлено" &&
          countMessage > 1)
      ) {
        //получаем данные данные
        connection.send("Получены данные");
        let data = new TextDecoder("utf-8").decode(message);
        clients.forEach((client) => {
          if (client.connection === connection)
            client.lastkeepalive = Date.now();
        });
        fs.stat(`upload/${directory}`, function (err, stat) {
          if (err) {
            return fs.mkdir(
              `upload/${directory}`,
              { recursive: true },
              (err) => {
                if (err) throw err;
                connection.send("Папка успешно создана");
                const object = JSON.parse(data);
                let path = `upload/${directory}`;
                createFileAndWrite(object, path);
                connection.send("Передача и запись данных успешно завершена");
              }
            );
          }
          if (stat.isDirectory()) {
            connection.send("Папка для добавления данных существует");
            const object = JSON.parse(data);
            let path = `upload/${directory}`;
            readAndWrite(object, path);
            connection.send("Передача и запись данных успешно завершена");
          }
        });
      }
    });

    clients.push({ connection: connection, lastkeepalive: Date.now() });
  } catch (error) {
    console.log(error);
  }
});

// создаем объект приложения
const webserver = express();

// статические данные с JS, CSS, HTML
webserver.use(express.static(path.join(__dirname, "public")));
webserver.use(express.urlencoded({ extended: false }));
webserver.use(bodyParser.json());

// отдаем html документ
webserver.get("/index.html", function (request, response) {
  response.setHeader("Content-Type", "text/html");
  response.setHeader("Cache-Control", "public, max-age=60");
  response.send(path.join(__dirname, "index.html"));
});

// отправляем данные для выгрузки листа загруженных файлов
webserver.post("/openMarker", function (request, response) {
  try {
    if (!request.body)
      throw new Error("Пусто, из участка кода для открытия списка закладок");
    else {
      fs.readFile(
        `${request.body.pathToFile}`,
        "utf8",
        function (error, fileContent) {
          if (error) {
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-store");
            const object = {};
            object.text = `На сервере пока ничего не сохранено`;
            response.status(200).send(`${JSON.stringify(object)}`);
          } else {
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-store");
            response.status(200).send(`${fileContent}`);
          }
        }
      );
    }
  } catch (error) {
    response.status(400).send(`${error}`);
  }
});

// удаляем файл по id
webserver.post("/delete", function (request, response) {
  try {
    if (!request.body)
      throw new Error("Пусто, из участка кода для удаления списка закладок");
    else {
      fs.readFile(
        `${request.body.pathToFile}`,
        "utf8",
        function (error, fileContent) {
          if (error) throw new Error("Что-то пошло не так");
          else {
            const object = JSON.parse(fileContent);
            for (const key in object) {
              if (object.hasOwnProperty(key)) {
                if (object[key].id === request.body.id) delete object[key];
              }
            }
            fs.writeFile(
              `${request.body.pathToFile}`,
              `${JSON.stringify(object)}`,
              function (error) {
                if (error) throw new Error("Что-то пошло не так");
                else response.sendStatus(200);
              }
            );
          }
        }
      );
    }
  } catch (error) {
    response.status(400).send(`${error}`);
  }
});

// загружаем файл по id
webserver.post("/download", function (request, response) {
  try {
    if (!request.body)
      throw new Error("Пусто, из участка кода для удаления списка закладок");
    else {
      fs.readFile(
        `${request.body.pathToFile}`,
        "utf8",
        function (error, fileContent) {
          if (error) throw new Error("Что-то пошло не так");
          else {
            const object = JSON.parse(fileContent);
            const newObject = {};
            for (const key in object) {
              if (object.hasOwnProperty(key)) {
                if (object[key].id === request.body.id) {
                  newObject.filename = key;
                  newObject.file = object[key].file;
                }
              }
            }
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-store");
            response.status(200).send(`${JSON.stringify(newObject)}`);
          }
        }
      );
    }
  } catch (error) {
    response.status(400).send(`${error}`);
  }
});

// начинаем прослушивать подключения на 7681 порту
webserver.listen(7681);

const readAndWrite = (object, path) => {
  fs.readFile(`${path}/upload.json`, "utf8", function (error, fileContent) {
    if (error) throw error;
    const newObj = JSON.parse(fileContent);
    newObj[object.filename] = {};
    newObj[object.filename].comment = object.comment;
    newObj[object.filename].file = object.file;
    newObj[object.filename].id = object.id;
    fs.writeFile(
      `${path}/upload.json`,
      `${JSON.stringify(newObj)}`,
      function (error) {
        if (error) throw error;
      }
    );
  });
};

const createFileAndWrite = (object, path) => {
  fs.stat(`${path}/upload.json`, function (err, stat) {
    const newObj = {};
    newObj[object.filename] = {};
    newObj[object.filename].comment = object.comment;
    newObj[object.filename].file = object.file;
    newObj[object.filename].id = object.id;
    if (err) {
      return fs.writeFile(
        `${path}/upload.json`,
        JSON.stringify(newObj),
        "utf8",
        (err) => {
          if (err) throw err;
        }
      );
    }
  });
};
