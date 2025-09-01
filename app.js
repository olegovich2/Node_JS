// подключение express
const express = require("express");
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

// создаем объект приложения
const webserver = express();

// статические данные с JS, CSS, HTML
webserver.use(express.static(path.join(__dirname, "public")));
webserver.use(express.urlencoded({ extended: false }));
webserver.use(bodyParser.json());

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
          html: `<p>Для завершения авторизации - перейдите по ссылке:</p><br><p><a href="http://localhost:7681/main/auth/final?token=${(request.query.token =
            token)}">http://localhost:7681/main/auth/final?token=${token}</a></p>`,
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

webserver.post("/toMain", function (request, response) {
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
        return response.redirect(302, `/main`);
      }
    });
  } catch (error) {
    response.redirect(
      302,
      `/main/entry/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

webserver.get("/main", function (request, response) {
  response.setHeader("Content-Type", "text/html");
  response.setHeader("Cache-Control", "no-cache");
  response.sendFile(__dirname + "/public" + "/main.html");
});

// начинаем прослушивать подключения на 7681 порту
webserver.listen(7681);

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
