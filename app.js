const mysql = require("mysql2");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

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

const poolConfig = {
  connectionLimit: 2,
  host: "localhost",
  user: "root",
  password: "1234",
  port: 3306,
};

// получаем все DB
webserver.get("/getDB", async function (request, response) {
  let connection = null;
  try {
    let pool = mysql.createPool(poolConfig);
    connection = await newConnectionFactory(pool, response);
    let groups = await selectQueryFactory(connection, "SHOW DATABASES;", []);
    const object = {};
    const array = [];
    groups.forEach((row) => {
      array.push(row.Database);
    });
    object.arrayDB = array;
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");
    response.status(200).send(`${JSON.stringify(object)}`);
  } catch (error) {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");
    response.status(200).send(`${JSON.stringify(error)}`);
  } finally {
    if (connection) connection.release();
  }
});

// отправка запроса и получения ответа
webserver.post("/reqToDB", async function (request, response) {
  let connection = null;
  try {
    poolConfig.database = request.body.DB;
    let pool = mysql.createPool(poolConfig);
    connection = await newConnectionFactory(pool, response);
    if (
      request.body.req.includes("INSERT") ||
      request.body.req.includes("UPDATE") ||
      request.body.req.includes("DELETE") ||
      request.body.req.includes("CREATE") ||
      request.body.req.includes("RENAME") ||
      request.body.req.includes("DROP")
    ) {
      await modifyQueryFactory(connection, request.body.req, [], response);
    } else {
      let groups = await selectQueryFactory(connection, request.body.req, []);
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Cache-Control", "no-store");
      response.status(200).send(`${JSON.stringify(groups)}`);
    }
  } catch (error) {
    poolConfig.database = "";
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");
    response.status(200).send(`${JSON.stringify(error)}`);
  } finally {
    poolConfig.database = "";
    if (connection) connection.release();
  }
});

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
function selectQueryFactory(connection, queryText, queryValues) {
  return new Promise((resolve, reject) => {
    connection.query(queryText, queryValues, function (err, results, fields) {
      if (err) {
        const object = {};
        object.error = err;
        reject(object);
      } else {
        if (queryText === "SHOW DATABASES;") resolve(results);
        else {
          const object = { ...results };
          object.fields = fields;
          object.req = queryText;
          resolve(object);
        }
      }
    });
  });
}

// выполняет SQL-запрос на модификацию
function modifyQueryFactory(connection, queryText, queryValues, response) {
  return new Promise((resolve, reject) => {
    connection.query(queryText, queryValues, function (err, res) {
      if (err) {
        const object = {};
        object.error = err;
        reject(object);
      } else {
        getModifiedRowsCount(connection, queryText, response);
      }
    });
  });
}

// возвращает количество изменённых последним запросом строк
function getModifiedRowsCount(connection, queryText, response) {
  return new Promise((resolve, reject) => {
    selectQueryFactory(connection, "select row_count() as row_count")
      .then((rows) => {
        const object = {};
        object.rows = rows[0].row_count;
        object.req = queryText;
        object.modify = true;
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Cache-Control", "no-store");
        response.status(200).send(`${JSON.stringify(object)}`);
      })
      .catch((err) => {
        const object = {};
        object.error = err;
        reject(object);
      });
  });
}
