const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

// переменные websocket
let directory = ""; //название директории для изменения файла
let countMessage = 0; //счетчик сообщений вебсокета
const activeClients = []; //активные соединения websocket

// создаем объект приложения
const webserver = express();

// статические данные с JS, CSS, HTML
webserver.use(express.static(path.join(__dirname, "public")));
webserver.use(express.urlencoded({ extended: false }));

// отдаем html документ
webserver.get("/index.html", function (request, response) {
  response.setHeader("Content-Type", "text/html");
  response.setHeader("Cache-Control", "public, max-age=60");
  response.send(path.join(__dirname, "index.html"));
});

// загрузка файлов на сервер
webserver.post("/downloadToServer", function (request, response) {
  try {
    const contentLength = request.headers["content-length"];
    let body = "";
    let idForCompare = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
      idForCompare = body.slice(body.indexOf(":") + 2, body.indexOf(",") - 1);
      activeClients.forEach((client) => {
        if (
          client.readyState === WebSocket.OPEN &&
          client.uniqueID === idForCompare
        ) {
          client.lastkeepalive = Date.now();
          const objectToClient = {};
          objectToClient.websocketId = client.uniqueID;
          let percentData = Math.round((body.length / contentLength) * 100);
          objectToClient.message = `Получено данных: ${percentData}`;
          client.send(JSON.stringify(objectToClient));
        }
      });
    });
    request.on("end", () => {
      messageToClientFromExpress(
        JSON.parse(body),
        `Получение данных завершено: ${(body.length / contentLength) * 100}`
      );
      fs.stat(`upload/${directory}`, function (err, stat) {
        if (err) {
          return fs.mkdir(`upload/${directory}`, { recursive: true }, (err) => {
            if (err) throw err;
            const object = JSON.parse(body);
            messageToClientFromExpress(object, "Папка успешно создана");
            let path = `upload/${directory}`;
            createFileAndWrite(object, path);
            response.sendStatus(200);
          });
        }
        if (stat.isDirectory()) {
          const object = JSON.parse(body);
          messageToClientFromExpress(
            object,
            "Папка для добавления данных существует"
          );
          let path = `upload/${directory}`;
          readAndWrite(object, path);
          response.sendStatus(200);
        }
      });
    });
  } catch (error) {
    response.status(400).send(`${error}`);
  }
});

// парсит request
webserver.use(bodyParser.json());

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
            const object = JSON.parse(fileContent);
            for (const key in object) {
              if (object.hasOwnProperty(key)) {
                delete object[key].file;
              }
            }
            response.status(200).send(`${JSON.stringify(object)}`);
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

// начинаем прослушивать подключения на 7681 порту и создаем константу для апгрейда экспресса и вебсокета
const s = webserver.listen(7681);

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

// предварительный обработчик ошибок вебсокета
const onSocketPreError = (error = Error) => {
  console.log(error);
};

// дополнительный обработчик ошибок вебсокета
const onSocketPostError = (error = Error) => {
  console.log(error);
};

// создаем вебсокет на одном порту с экспрессом
const server = new WebSocket.Server({ noServer: true });

// апгрейд вебсокета
s.on("upgrade", (request, socket, head) => {
  socket.on("error", onSocketPreError);
  if (!!request.headers["BadAuth"]) {
    socket.write("HTTP/1.1 401 Unauthorized");
    socket.destroy();
    return;
  }
  server.handleUpgrade(request, socket, head, (ws) => {
    socket.removeListener("error", onSocketPreError);
    server.emit("connection", ws, request);
  });
});

// начинаем слушать соединение и события
server.on("connection", (ws, request) => {
  ws.on("error", onSocketPostError);
  ws.on("message", (msg, isBinary) => {
    const objectFromClient = JSON.parse(new TextDecoder("utf-8").decode(msg));
    if (objectFromClient.message === "Соединение установлено") {
      ws.uniqueID = objectFromClient.websocketId;
      activeClients.push(ws);
      countMessage++;
      messageToclient(objectFromClient);
    } else if (countMessage === 1) {
      directory = objectFromClient.message;
      objectFromClient.message = "Получено название директории";
      countMessage++;
      messageToclient(objectFromClient);
    } else if (objectFromClient.message === "CLOSE") {
      objectFromClient.message = "Передача данных завершена";
      directory = "";
      countMessage = 0;
      activeClients.forEach((client) => {
        if (
          Date.now() > client.lastkeepalive &&
          client.uniqueID === objectFromClient.websocketId
        ) {
          client.close(1000, "Соединение с сервером закрыто");
        }
      });
    }
  });
  ws.on("close", () => {
    activeClients.forEach((client, i) => {
      if (client.readyState !== WebSocket.CLOSE) {
        activeClients.splice(i, 1);
      }
    });
  });
});

// сообщение клиенту
const messageToclient = (object) => {
  activeClients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.uniqueID === object.websocketId
    ) {
      client.lastkeepalive = Date.now();
      client.send(JSON.stringify(object));
    }
  });
};

// отправка сообщения в случае успешной записи файла
const messageToClientSuccessWrite = (object) => {
  activeClients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.uniqueID === object.websocketid
    ) {
      client.lastkeepalive = Date.now();
      const objectToClient = {};
      objectToClient.websocketId = client.uniqueID;
      objectToClient.message = "Запись завершена на 100";
      client.send(JSON.stringify(objectToClient));
      objectToClient.message = "Передача и запись данных успешно завершена";
      client.send(JSON.stringify(objectToClient));
    }
  });
};

// отправка сообщения в случае ошибки
const messageToclientErrorWrite = (object) => {
  activeClients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.uniqueID === object.websocketid
    ) {
      client.lastkeepalive = Date.now();
      const objectToClient = {};
      objectToClient.websocketId = client.uniqueID;
      objectToClient.message = "Передача и запись данных завершилась неудачно";
      client.send(JSON.stringify(objectToClient));
    }
  });
};

// отпправка сообщения из экспресса
const messageToClientFromExpress = (object, message) => {
  activeClients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.uniqueID === object.websocketid
    ) {
      client.lastkeepalive = Date.now();
      const objectToClient = {};
      objectToClient.websocketId = client.uniqueID;
      objectToClient.message = message;
      client.send(JSON.stringify(objectToClient));
    }
  });
};
