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

let pool = mysql.createPool(poolConfig);

// получаем все DB
webserver.get("/getDB", async function (request, response) {
  let connection = null;
  try {
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

const resetPool = (data) => {
  pool.end();
  poolConfig.database = data;
  pool = mysql.createPool(poolConfig);
};

// отправка запроса и получения ответа
webserver.post("/reqToDB", async function (request, response) {
  let connection = null;
  try {
    resetPool(request.body.DB);
    connection = await newConnectionFactory(pool, response);
    let groups = await selectQueryFactory(
      connection,
      request.body.req,
      [],
      response
    );
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");
    response.status(200).send(`${JSON.stringify(groups)}`);
  } catch (error) {
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Cache-Control", "no-store");
    response.status(200).send(`${JSON.stringify(error)}`);
  } finally {
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
function selectQueryFactory(connection, queryText, queryValues, response) {
  return new Promise((resolve, reject) => {
    connection.query(queryText, queryValues, function (err, results, fields) {
      if (err) {
        const object = {};
        object.error = err;
        reject(object);
      } else {
        if (queryText === "SHOW DATABASES;") resolve(results);
        else {
          if (fields === undefined) {
            getModifiedRowsCount(connection, queryText, response);
          } else {
            const object = { ...results };
            object.fields = clearArrayToClient(fields);
            object.req = queryText;
            resolve(object);
          }
        }
      }
    });
  });
}

// очистка массива объектов от лишних ключей
const clearArrayToClient = (array) => {
  const newArray = [];
  for (let i = 0; i < array.length; i++) {
    const object = {};
    object.name = array[i].name;
    newArray.push(object);
  }
  return newArray;
};

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
