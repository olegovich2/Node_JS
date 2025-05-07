const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const fetch = require("isomorphic-fetch");
const helmet = require("helmet");

// создаем объект приложения
const webserver = express();

// настройка работы с handlebars
webserver.engine("handlebars", exphbs.engine());
webserver.set("view engine", "handlebars");
webserver.set("views", path.join(__dirname, "views"));
// статические данные с JS, CSS, HTML
webserver.use(express.static(path.join(__dirname, "public")));
webserver.use(express.urlencoded({ extended: false }));
webserver.use(bodyParser.json());
webserver.use(helmet());

// отдаем html документ
webserver.get("/index.html", function (request, response) {
  response.setHeader("Content-Type", "text/html");
  response.setHeader("Cache-Control", "public, max-age=60");
  response.send(path.join(__dirname, "index.html"));
});

// отправляем закладки
webserver.get("/marker", function (request, response) {
  try {
    const data = reduceKeysFromJson();
    response.setHeader("Content-Type", "text/html");
    response.setHeader("Cache-Control", "no-store");
    response.status(200);
    response.render("marker", {
      layout: "article_layout",
      marker: data,
    });
  } catch (error) {
    // отправляем текст ошибки
    response.status(400).send(`${error}`);
  }
});
// отправляем данные для выгрузки из закладки в форму для редактирования или открытия
webserver.post("/openMarker", function (request, response) {
  try {
    if (!request.body)
      throw new Error("Пусто, из участка кода для открытия списка закладок");
    else {
      const data = keyInObject(request.body);
      const key = data.id;
      const object = JSON.parse(fs.readFileSync("marker.json", "utf8"));
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Cache-Control", "no-store");
      response.status(200).send(`${object.admin[key]}`);
    }
  } catch (error) {
    // отправляем текст ошибки
    response.status(400).send(`${error}`);
  }
});

// удаляем закладку по id
webserver.post("/delete", function (request, response) {
  try {
    if (!request.body)
      throw new Error("Пусто, из участка кода для удаления списка закладок");
    else {
      const data = keyInObject(request.body);
      const key = data.id;
      const object = JSON.parse(fs.readFileSync("marker.json", "utf8"));
      delete object.admin[key];
      fs.writeFileSync("marker.json", JSON.stringify(object));
      response.sendStatus(200);
    }
  } catch (error) {
    // отправляем текст ошибки
    response.status(400).send(`${error}`);
  }
});

// отправка
webserver.post("/dataForFetch", async function (request, response) {
  try {
    if (!request.body)
      throw new Error("Пусто, из участка кода для отправки тестового урла");
    else {
      const object = {};
      const headers = {};
      const options = {};
      options.redirect = "manual";
      let url = `${request.body.url}?${request.body.params}`;
      if (request.body.method !== "GET") {
        options.method = request.body.method;
        options.headers = request.body.headers;
        options.body = request.body.textareaBodyRequest;
      } else {
        options.method = request.body.method;
        options.headers = request.body.headers;
      }
      if (
        request.body.url.includes(".png") ||
        request.body.url.includes(".jpg") ||
        request.body.url.includes(".jpeg") ||
        request.body.url.includes(".gif")
      ) {
        const proxy_response = await fetch(url, options);
        if (proxy_response.ok) {
          const proxy_blob = await proxy_response.blob();
          object.image = "";
          const str = Buffer.from(await proxy_blob.arrayBuffer()).toString(
            "base64"
          );
          object.page = str;
          object.status = proxy_response.status;
          for (header of proxy_response.headers) {
            headers[header[0]] = header[1];
          }
          object.headers = headers;
          object.body = str;
          response.status(200).send(`${JSON.stringify(object)}`);
        } else {
          const proxy_text = await proxy_response.text();
          object.page = proxy_text;
          object.status = proxy_response.status;
          for (header of proxy_response.headers) {
            headers[header[0]] = header[1];
          }
          object.headers = headers;
          object.body = proxy_text;
          response.status(200).send(`${JSON.stringify(object)}`);
        }
      } else {
        const proxy_response = await fetch(url, options);
        const proxy_text = await proxy_response.text();
        object.page = proxy_text;
        object.status = proxy_response.status;
        for (header of proxy_response.headers) {
          headers[header[0]] = header[1];
        }
        object.headers = headers;
        object.body = proxy_text;
        response.status(200).send(`${JSON.stringify(object)}`);
      }
    }
  } catch (error) {
    // отправляем текст ошибки
    response.status(400).send(`${error}`);
  }
});

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
  const object = JSON.parse(fs.readFileSync("marker.json", "utf8"));
  const objectUser = object.admin;
  const array = [];
  if (JSON.stringify(objectUser).length > 2) {
    for (const key in objectUser) {
      if (objectUser.hasOwnProperty(key)) {
        const objectForResult = {};
        objectForResult.key = key;
        objectForResult.method = JSON.parse(objectUser[key]).method;
        if (JSON.parse(objectUser[key]).method === "GET")
          objectForResult.class = "red";
        if (JSON.parse(objectUser[key]).method === "POST")
          objectForResult.class = "blue";
        if (JSON.parse(objectUser[key]).method === "PATCH")
          objectForResult.class = "green";
        if (JSON.parse(objectUser[key]).method === "UPDATE")
          objectForResult.class = "violet";
        if (JSON.parse(objectUser[key]).method === "OPTIONS")
          objectForResult.class = "white";
        if (JSON.parse(objectUser[key]).method === "")
          objectForResult.class = "grey";
        objectForResult.url = JSON.parse(objectUser[key]).urlFromForm;
        objectForResult.isLogic = true;
        array.push(objectForResult);
      }
    }
    return array;
  } else {
    const objectForResult = {};
    objectForResult.isLogic = false;
    array.push(objectForResult);
    return array;
  }
};

// хаб для санации ключей
const keyInObject = (object) => {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      object.key = escapeHTML(key);
    }
  }
  return object;
};

// функция санации ключа объекта
const escapeHTML = (text) => {
  if (!text) return text;
  text = text
    .toString()
    .split("&")
    .join("&amp;")
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;")
    .split('"')
    .join("&quot;")
    .split("'")
    .join("&#039;");
  return text;
};
