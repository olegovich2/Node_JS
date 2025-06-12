const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { objectForCreateDom } = require("./utils/constants");
const { objectError } = require("./utils/constants");
const secretKey = "uploadfile";
const secretKeyTwo = "sessionkey";
const { poolConfig } = require("./utils/configFile");
const { transporter } = require("./utils/configFile");
const { validateEmail } = require("./utils/functions");
const { docHtml } = require("./utils/functions");
let pool = mysql.createPool(poolConfig);
const url = "http://178.172.195.18:7681";
// const url1 = "http://localhost:7681";

// переменные websocket
let directory = ""; //название директории для изменения файла
let countMessage = 0; //счетчик сообщений вебсокета
const { activeClients } = require("./utils/funcForWebsocket");
const { messageToClientFromExpress } = require("./utils/funcForWebsocket");
const { messageToclient } = require("./utils/funcForWebsocket");
const { onSocketPreError } = require("./utils/funcForWebsocket");
const { onSocketPostError } = require("./utils/funcForWebsocket");

// переменные чтения и записи
const { readAndWrite } = require("./utils/funcForReadWrite");
const { createFileAndWrite } = require("./utils/funcForReadWrite");

// создаем объект приложения
const webserver = express();

// статические данные с JS, CSS, HTML
webserver.use(express.static(path.join(__dirname, "public")));
webserver.use(express.urlencoded({ extended: false }));

// отдаем html документ
webserver.get("/main", function (request, response) {
  response.setHeader("Content-Type", "text/html");
  response.setHeader("Cache-Control", "no-cache");
  response.sendFile(__dirname + "/public" + "/main.html");
});

// загрузка файлов на сервер
webserver.post("/downloadToServer", async function (request, response) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return response.redirect(302, `/main/entry`);
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, secretKeyTwo, (err, user) => {
      if (err) {
        return response.redirect(302, `/main/entry`);
      } else {
        const contentLength = request.headers["content-length"];
        let body = "";
        let idForCompare = "";
        request.on("data", (chunk) => {
          body += chunk.toString();
          idForCompare = body.slice(
            body.indexOf(":") + 2,
            body.indexOf(",") - 1
          );
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
              return fs.mkdir(
                `upload/${directory}`,
                { recursive: true },
                (err) => {
                  if (err) throw err;
                  const object = JSON.parse(body);
                  messageToClientFromExpress(object, "Папка успешно создана");
                  let path = `upload/${directory}`;
                  createFileAndWrite(object, path);
                  response.sendStatus(200);
                }
              );
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
      }
    });
  } catch (error) {
    response.status(400).send(`${error}`);
  }
});

// парсит request
webserver.use(bodyParser.json());

// аутентификация начало

// отдаем страницу аутентификации
webserver.get("/main/auth", function (request, response) {
  response.setHeader("Content-Type", "text/html");
  response.setHeader("Cache-Control", "no-cache");
  response.sendFile(__dirname + "/public" + "/auth.html");
});

// аутентификация-валидация-токен-почта
webserver.post("/main/auth/variants", async function (request, response) {
  let connection = null;
  try {
    connection = await newConnectionFactory(pool, response);
    // проверка для поля логин
    if (request.body.login) {
      // валидация поля логин
      const loginString = JSON.stringify(request.body.login);
      if (loginString.includes("<script>") || loginString.includes("</script>"))
        throw new Error(objectError.scriptNone);
      if (
        loginString.includes("<") ||
        loginString.includes(">") ||
        loginString.includes("/") ||
        loginString.includes("&")
      )
        throw new Error(objectError.loginwrongSymbol);

      // проверка логина на уникальность
      let answer = await selectQueryFactory(
        connection,
        `select * from usersdata where login =?;`,
        [request.body.login]
      );
      if (answer.length > 0) {
        throw new Error(objectError.loginAlreadyExists);
      }
    }

    // проверка для поля пароль
    if (request.body.password) {
      const passwordString = JSON.stringify(request.body.password);
      if (
        passwordString.includes("<script>") ||
        passwordString.includes("</script>")
      )
        throw new Error(objectError.scriptNone);
      if (
        passwordString.includes("<") ||
        passwordString.includes(">") ||
        passwordString.includes(" ")
      )
        throw new Error(objectError.passwordWrongSymbol);
    }

    // проверка email
    if (!validateEmail(request.body.email)) {
      if (request.body.email.length === 0)
        throw new Error(objectError.emailNull);
      else throw new Error(objectError.emailerrorOne);
    }
    // отправляем страницу
    const newPage = docHtml(request);
    if (typeof newPage === "object") {
      const salt = await bcrypt.genSalt(10);
      const hashPass = await bcrypt.hash(request.body.password, salt);
      const payload = { username: request.body.login };
      const token = jwt.sign(payload, secretKey, { expiresIn: "366d" });
      let answerInsert = await selectQueryFactory(
        connection,
        `INSERT INTO usersdata (login, password, email, jwt, logic)
      VALUES(?, ?, ?, ?, ?);`,
        [request.body.login, hashPass, request.body.email, token, "false"]
      );
      if (answerInsert === "успех") {
        const mailOptions = {
          from: "trmailforupfile@gmail.com",
          to: `${request.body.email}`,
          subject: "Завершение авторизации",
          html: `<p>Для завершения авторизации - перейдите по ссылке:</p><br><p><a href="${url}/main/auth/final?token=${(request.query.token =
            token)}">${url}/main/auth/final?token=${token}</a></p>`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            response.redirect(302, `/main/auth/error?errorMessage=${error}`);
          } else {
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.redirect(
              302,
              `/main/auth/success?login=${(request.query.login =
                newPage.login)}`
            );
          }
        });
      }
    } else {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.status(200).send(`${newPage}`);
    }
  } catch (error) {
    // отправляем текст ошибки
    response.redirect(
      302,
      `/main/auth/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

// аутентификация ошибки
webserver.get("/main/auth/error", function (request, response) {
  try {
    if (request.query.errorMessage) {
      response.setHeader("Content-Type", "text/html");
      response.setHeader("Cache-Control", "no-store");
      // создание html ошибки
      let errorPage = objectForCreateDom.htmlError;
      errorPage = errorPage.replace(
        "$[status]",
        `${request.query.errorMessage}`
      );
      response.status(200).send(`${errorPage}`);
    } else {
      throw new Error(objectError.errorUndefined);
    }
  } catch (error) {
    response.redirect(
      302,
      `/main/auth/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

// страница успешной аутентификации
webserver.get("/main/auth/success", function (request, response) {
  try {
    if (request.query.login) {
      response.setHeader("Content-Type", "text/html");
      response.setHeader("Cache-Control", "no-store");
      // создание html успеха
      let successPage = objectForCreateDom.htmlSuccess;
      successPage = successPage.replace("$[login]", `${request.query.login}`);
      response.status(200).send(`${successPage}`);
    } else {
      throw new Error(objectError.errorUndefined);
    }
  } catch (error) {
    response.redirect(
      302,
      `/main/auth/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

// обработчик страницы финальной авторизации
webserver.get("/main/auth/final", async function (request, response) {
  let connection = null;
  try {
    connection = await newConnectionFactory(pool, response);
    if (request.query.token) {
      let answerUpdate = await selectQueryFactory(
        connection,
        `UPDATE usersdata
     SET logic = REPLACE(logic, 'false', 'true')
     WHERE jwt = ?;`,
        [request.query.token]
      );
      if (answerUpdate === "успех") {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.redirect(302, `/main/entry`);
      }
    }
  } catch (error) {
    response.redirect(
      302,
      `/main/auth/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

// обработчик страницы входа
webserver.get("/main/entry", async function (request, response) {
  try {
    response.setHeader("Content-Type", "text/html");
    response.setHeader("Cache-Control", "no-store");
    response.sendFile(__dirname + "/public" + "/entry.html");
  } catch (error) {
    response.redirect(
      302,
      `/main/entry/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

// обработчик ошибок страницы входа
webserver.get("/main/entry/error", function (request, response) {
  try {
    if (request.query.errorMessage) {
      response.setHeader("Content-Type", "text/html");
      response.setHeader("Cache-Control", "no-store");
      // создание html ошибки
      let errorPage = objectForCreateDom.htmlErrorTwo;
      errorPage = errorPage.replace(
        "$[status]",
        `${request.query.errorMessage}`
      );
      response.status(200).send(`${errorPage}`);
    } else {
      throw new Error(objectError.errorUndefined);
    }
  } catch (error) {
    response.redirect(
      302,
      `/main/entry/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

// валидация входа, создание сессии
webserver.post("/entryData", async function (request, response) {
  let connection = null;
  try {
    connection = await newConnectionFactory(pool, response);
    // валидация поля логин
    if (request.body.login) {
      const loginString = JSON.stringify(request.body.login);
      if (loginString.includes("<script>") || loginString.includes("</script>"))
        throw new Error(objectError.scriptNone);
      if (
        loginString.includes("<") ||
        loginString.includes(">") ||
        loginString.includes("/") ||
        loginString.includes("&")
      )
        throw new Error(objectError.loginwrongSymbol);
    } else throw new Error(objectError.loginNull);

    // проверка для поля пароль
    if (request.body.password) {
      const passwordString = JSON.stringify(request.body.password);
      if (
        passwordString.includes("<script>") ||
        passwordString.includes("</script>")
      )
        throw new Error(objectError.scriptNone);
      if (
        passwordString.includes("<") ||
        passwordString.includes(">") ||
        passwordString.includes(" ")
      )
        throw new Error(objectError.passwordWrongSymbol);
    } else throw new Error(objectError.passwordNull);

    // проверка логина на нахождение в таблице
    let answerExistLogin = await selectQueryFactory(
      connection,
      `select * from usersdata where login =?;`,
      [request.body.login]
    );
    if (answerExistLogin.length === 0) {
      throw new Error(objectError.loginPasswordPairNotExist);
    } else {
      const passwordCompare = await bcrypt.compare(
        request.body.password,
        answerExistLogin[0].password
      );
      if (passwordCompare) {
        createTokenAndWriteToDB(request.body.login, connection, response);
      } else {
        throw new Error(objectError.loginPasswordPairNotExist);
      }
    }
  } catch (error) {
    response.redirect(
      302,
      `/main/entry/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

// создание сессионного ключа и запись в сессию
const createTokenAndWriteToDB = async (login, connection, response) => {
  const payload = { username: login };
  const token = jwt.sign(payload, secretKeyTwo, { expiresIn: "2h" });
  let insertToSessionTab = await selectQueryFactory(
    connection,
    `INSERT INTO sessionsdata (login, jwt_access)
      VALUES(?, ?);`,
    [login, token]
  );
  if (insertToSessionTab === "успех") {
    let getDataFromSessionTab = await selectQueryFactory(
      connection,
      `select * from sessionsdata where jwt_access =?;`,
      [token]
    );
    const objectToClient = getDataFromSessionTab[0];
    response.status(200).send(`${JSON.stringify(objectToClient)}`);
  }
};

webserver.use((request, response, next) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return response.redirect(302, `/main/entry`);
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, secretKeyTwo, (err, user) => {
      if (err) {
        return response.redirect(302, `/main/entry`);
      } else {
        return next();
      }
    });
  } catch (error) {
    response.redirect(
      302,
      `/main/entry/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});
// аутентификация конец

// переход на главную страницу
webserver.post("/toMain", (request, response) => {
  response.redirect(302, `/main`);
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

// работа с БД
// возвращает соединение с БД, взятое из пула соединений
function newConnectionFactory(pool, response) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
}

// выполняет SQL-запрос на чтение, возвращает массив прочитанных строк
function selectQueryFactory(connection, queryText, queryValues, response) {
  return new Promise((resolve, reject) => {
    connection.query(queryText, queryValues, function (err, results, fields) {
      if (err) {
        reject(err);
      } else {
        if (fields === undefined) {
          resolve("успех");
        } else {
          resolve(results);
        }
      }
    });
  });
}
