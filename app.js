const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

// переменные websocket
let directory = ""; //название директории для изменения файла
let countMessage = 0; //счетчик сообщений вебсокета

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
    request.on("data", (chunk) => {
      body += chunk.toString();
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            `Получено данных: ${(body.length / contentLength) * 100}`
          );
        }
      });
    });
    request.on("end", () => {
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            `Получение данных завершено: ${(body.length / contentLength) * 100}`
          );
        }
      });
      fs.stat(`upload/${directory}`, function (err, stat) {
        if (err) {
          return fs.mkdir(`upload/${directory}`, { recursive: true }, (err) => {
            if (err) throw err;
            server.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send("Папка успешно создана");
              }
            });
            const object = JSON.parse(body);
            let path = `upload/${directory}`;
            createFileAndWrite(object, path);
            response.sendStatus(200);
          });
        }
        if (stat.isDirectory()) {
          server.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send("Папка для добавления данных существует");
            }
          });
          const object = JSON.parse(body);
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
    fileStream.end(
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send("Запись завершена на 100");
          client.send("Передача и запись данных успешно завершена");
        }
      })
    );
    fileStream.on("error", (err) => {
      console.error("Ошибка при записи файла:", err);
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send("Передача и запись данных завершилась неудачно");
        }
      });
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
      fileStream.end(
        server.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send("Запись завершена на 100");
            client.send("Передача и запись данных успешно завершена");
          }
        })
      );
      fileStream.on("error", (err) => {
        console.error("Ошибка при записи файла:", err);
        server.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send("Передача и запись данных завершилась неудачно");
          }
        });
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
    if (new TextDecoder("utf-8").decode(msg) === "Соединение установлено") {
      ws.send("Соединение установлено");
      countMessage++;
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.lastkeepalive = Date.now();
        }
      });
    } else if (countMessage === 1) {
      directory = new TextDecoder("utf-8").decode(msg);
      ws.send("Получено название директории");
      countMessage++;
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.lastkeepalive = Date.now();
        }
      });
    } else if (new TextDecoder("utf-8").decode(msg) === "CLOSE") {
      ws.send("Передача данных завершена");
      directory = "";
      countMessage = 0;
      server.clients.forEach((client) => {
        if (Date.now() > client.lastkeepalive) {
          client.close(1000, "Соединение с сервером закрыто");
          client = null;
        }
      });
    }
  });

  ws.on("close", () => {
    ws.send("Соединение завершено");
  });
});
