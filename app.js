const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

let clients = []; //массив клиентов
let buffer = []; //массив полученных данных
let countMessage = 0; //счетчик сообщений вебсокета

// работа websocket
const server = new WebSocket.Server({ port: 7680 });
server.on("connection", (connection) => {
  try {
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
        fs.stat(
          `upload/${new TextDecoder("utf-8").decode(message)}`,
          function (err, stat) {
            if (err) {
              return fs.mkdir(
                `upload/${new TextDecoder("utf-8").decode(message)}`,
                { recursive: true },
                (err) => {
                  if (err) throw err;
                  connection.send("Папка успешно создана");
                  const object = JSON.parse(buffer.toString("utf8"));
                  let path = `upload/${new TextDecoder("utf-8").decode(
                    message
                  )}`;
                  createFileAndWrite(object, path);
                  connection.send("Данные успешно записаны");
                  buffer.length = 0;
                  countMessage = 0;
                  clients.forEach((client) => {
                    if (Date.now() > client.lastkeepalive) {
                      client.connection.close(
                        1000,
                        "Соединение с сервером закрыто"
                      );
                      client.connection = null;
                    }
                  });
                  clients = clients.filter((client) => client.connection);
                }
              );
            }
            if (stat.isDirectory()) {
              connection.send("Папка для добавления данных существует");
              const object = JSON.parse(buffer.toString("utf8"));
              let path = `upload/${new TextDecoder("utf-8").decode(message)}`;
              readAndWrite(object, path);
              connection.send("Данные успешно записаны");
              buffer.length = 0;
              countMessage = 0;
              clients.forEach((client) => {
                if (Date.now() > client.lastkeepalive) {
                  client.connection.close(
                    1000,
                    "Соединение с сервером закрыто"
                  );
                  client.connection = null;
                }
              });
              clients = clients.filter((client) => client.connection);
            }
          }
        );
        countMessage++;
      } else if (new TextDecoder("utf-8").decode(message) === "CLOSE") {
        //передача данных завершена
        connection.send("Передача данных завершена");
      } else if (
        (new TextDecoder("utf-8").decode(message) !== "CLOSE" &&
          countMessage > 1) ||
        (new TextDecoder("utf-8").decode(message) !==
          "Соединение установлено" &&
          countMessage > 1)
      ) {
        //получаем данные данные
        connection.send("Получены данные");
        buffer.push(message);
        clients.forEach((client) => {
          if (client.connection === connection)
            client.lastkeepalive = Date.now();
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
            response.status(200).send(`${JSON.stringify(newObject)}`);
          }
        }
      );
    }
  } catch (error) {
    response.status(400).send(`${error}`);
  }
});

// отправка
// webserver.post("/dataForFetch", async function (request, response) {
//   try {
//     if (!request.body)
//       throw new Error("Пусто, из участка кода для отправки тестового урла");
//     else {
//       const object = {};
//       const headers = {};
//       const options = {};
//       options.redirect = "manual";
//       let url = `${request.body.url}?${request.body.params}`;
//       if (request.body.method !== "GET") {
//         options.method = request.body.method;
//         options.headers = request.body.headers;
//         options.body = request.body.textareaBodyRequest;
//       } else {
//         options.method = request.body.method;
//         options.headers = request.body.headers;
//       }
//       if (
//         request.body.url.includes(".png") ||
//         request.body.url.includes(".jpg") ||
//         request.body.url.includes(".jpeg") ||
//         request.body.url.includes(".gif")
//       ) {
//         const proxy_response = await fetch(url, options);
//         if (proxy_response.ok) {
//           const proxy_blob = await proxy_response.blob();
//           object.image = "";
//           const str = Buffer.from(await proxy_blob.arrayBuffer()).toString(
//             "base64"
//           );
//           object.page = str;
//           object.status = proxy_response.status;
//           for (header of proxy_response.headers) {
//             headers[header[0]] = header[1];
//           }
//           object.headers = headers;
//           object.body = str;
//           response.status(200).send(`${JSON.stringify(object)}`);
//         } else {
//           const proxy_text = await proxy_response.text();
//           object.page = proxy_text;
//           object.status = proxy_response.status;
//           for (header of proxy_response.headers) {
//             headers[header[0]] = header[1];
//           }
//           object.headers = headers;
//           object.body = proxy_text;
//           response.status(200).send(`${JSON.stringify(object)}`);
//         }
//       } else {
//         const proxy_response = await fetch(url, options);
//         const proxy_text = await proxy_response.text();
//         object.page = proxy_text;
//         object.status = proxy_response.status;
//         for (header of proxy_response.headers) {
//           headers[header[0]] = header[1];
//         }
//         object.headers = headers;
//         object.body = proxy_text;
//         response.status(200).send(`${JSON.stringify(object)}`);
//       }
//     }
//   } catch (error) {
//     // отправляем текст ошибки
//     response.status(400).send(`${error}`);
//   }
// });

// сохранение данных формы для переиспользования
webserver.post("/write", function (request, response) {
  try {
    if (!request.body)
      throw new Error("Пусто, из участка кода для записи списка закладок");
    else {
      const data = keyInObject(JSON.stringify(request.body));
      let key = "";
      if (request.body.originalKey.length > 0) {
        key = request.body.originalKey;
      } else {
        key = Date.now().toString();
      }
      const objectForDelete = JSON.parse(data);
      delete objectForDelete.originalKey;
      const object = JSON.parse(fs.readFileSync("marker.json", "utf8"));
      object.admin[key] = JSON.stringify(objectForDelete);
      fs.writeFileSync("marker.json", JSON.stringify(object));
      response.sendStatus(200);
    }
  } catch (error) {
    // отправляем текст ошибки
    response.status(400).send(`${error}`);
  }
});

// начинаем прослушивать подключения на 7681 порту
webserver.listen(7681);

// функция для создания закладки
const reduceKeysFromJson = () => {
  const objectForResult = {};
  const object = JSON.parse(fs.readFileSync("marker.json", "utf8"));
  const objectUser = object.admin;
  for (const key in objectUser) {
    if (objectUser.hasOwnProperty(key)) {
      objectForResult[key] = {};
      objectForResult[key].method = JSON.parse(objectUser[key]).method;
      objectForResult[key].url = JSON.parse(objectUser[key]).urlFromForm;
    }
  }
  return objectForResult;
};

// хаб для санации ключей
// const keyInObject = (object) => {
//   for (const key in object) {
//     if (object.hasOwnProperty(key)) {
//       object.key = escapeHTML(key);
//     }
//   }
//   return object;
// };

// функция санации ключа объекта
// const escapeHTML = (text) => {
//   if (!text) return text;
//   text = text
//     .toString()
//     .split("&")
//     .join("&amp;")
//     .split("<")
//     .join("&lt;")
//     .split(">")
//     .join("&gt;")
//     .split('"')
//     .join("&quot;")
//     .split("'")
//     .join("&#039;");
//   return text;
// };

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
