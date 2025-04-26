// подключение express
const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

// объект с кусочками html документа
const objectForCreateDom = {
  htmlNew: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Form with Express</title>
    <link href="/css/style.css" type="text/css" rel="stylesheet" />
</head>
<body>
    <div>
        <h3>Заполните данные полей:</h3>
        <form method="post" action="/variants" target="_self" data-form="transition">            
            <div class="fields">
                <p>Введите ваш логин:</p>
                <input class="input $[inputClassLogin]" type="text" placeholder="Введите ваш логин" name="login" value="$[login]">
                <p class="$[classPLogin]">$[textPErrorLogin]</p>
            </div>
            <div class="fields">
                <p>Введите ваш пароль:</p>
                <input class="input $[inputClassPassword]" type="text" placeholder="Введите ваш пароль" name="password" value="$[password]">
                <p class="$[classPPassword]">$[textPErrorPassword]</p>
            </div>
            <button type="submit">Отправить</button>
        </form>
    </div>
</body>
</html>`,
  htmlSuccess: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Form with Express</title>
    <link href="/css/style.css" type="text/css" rel="stylesheet" />
</head>
<body>
    <div>
        <h1>Поздравляем, $[login], вы успешно зарегистрировались!</h1>        
    </div>
    <form method="get" action="/index.html" target="_self" data-form="transition">            
            <button type="submit">Вернуться на главную страницу</button>
        </form>
</body>
</html>`,
  htmlError: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Form with Express</title>
    <link href="/css/style.css" type="text/css" rel="stylesheet" />
</head>
<body>
    <div>
        <h1>$[status]</h1>        
    </div>
    <form method="get" action="/index.html" target="_self" data-form="transition">            
            <button type="submit">Вернуться на главную страницу</button>
        </form>
</body>
</html>`,
};
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

// отправка вариантов ответа для голосования
webserver.post("/variants", function (request, response) {
  try {
    // проверка для поля логин
    if (request.body.login) {
      const loginString = JSON.stringify(request.body.login);
      if (loginString.includes("<script>") || loginString.includes("</script>"))
        throw new Error("Нельзя заполнять поле скриптом!");
      if (
        loginString.includes("<") ||
        loginString.includes(">") ||
        loginString.includes("/") ||
        loginString.includes("&")
      )
        throw new Error("Поле логин содержит недопустимые символы");
    }
    // проверка для поля пароль
    if (request.body.password) {
      const passwordString = JSON.stringify(request.body.password);
      if (
        passwordString.includes("<script>") ||
        passwordString.includes("</script>")
      )
        throw new Error("Нельзя заполнять поле скриптом!");
      if (
        passwordString.includes("<") ||
        passwordString.includes(">") ||
        passwordString.includes(" ")
      )
        throw new Error("Поле пароль содержит недопустимые символы");
    }
    // отправляем страницу
    const newPage = docHtml(request);
    if (fs.success) {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.redirect(302, "/success");
    } else {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.status(200).send(`${newPage}`);
    }
  } catch (error) {
    // отправляем текст ошибки
    fs.errorString = error;
    response.redirect(302, "/error");
  }
});

webserver.get("/error", function (request, response) {
  try {
    if (fs.errorString) {
      response.setHeader("Content-Type", "text/html");
      response.setHeader("Cache-Control", "no-store");
      response.status(400).send(`${errorHtml(fs.errorString)}`);
    } else {
      throw new Error("Ничего не нашлось");
    }
  } catch (error) {
    fs.errorString = error;
    response.redirect(302, "/error");
  }
});

webserver.get("/success", function (request, response) {
  try {
    if (fs.successPage) {
      response.setHeader("Content-Type", "text/html");
      response.setHeader("Cache-Control", "no-store");
      response.status(302).send(`${fs.successPage.toLowerCase()}`);
      delete fs.success;
    } else {
      throw new Error("Ничего не нашлось");
    }
  } catch (error) {
    fs.errorString = error;
    response.redirect(302, "/error");
  }
});

// начинаем прослушивать подключения на 7681 порту
webserver.listen(7681);

// создание html ошибки
const errorHtml = (string) => {
  let errorString = objectForCreateDom.htmlError;
  errorString = errorString.replace("$[status]", string);
  return errorString;
};

// функция создания html документа
const docHtml = (object) => {
  const resultObject = {};
  let anyconst = objectForCreateDom.htmlNew;
  // проверка логина на длину
  if (!object.body.login || object.body.login.length === 0) {
    anyconst = anyconst.replace("$[inputClassLogin]", "errors");
    anyconst = anyconst.replace("$[login]", "");
    anyconst = anyconst.replace("$[classPLogin]", "error_p");
    anyconst = anyconst.replace(
      "$[textPErrorLogin]",
      "В поле логин ничего нет, введине логин"
    );
  } else if (object.body.login.length !== 0 && object.body.login.length < 4) {
    anyconst = anyconst.replace("$[inputClassLogin]", "errors");
    anyconst = anyconst.replace("$[login]", `${object.body.login}`);
    anyconst = anyconst.replace("$[classPLogin]", "error_p");
    anyconst = anyconst.replace("$[textPErrorLogin]", "Логин слишком короткий");
  } else if (object.body.login.length !== 0 && object.body.login.length > 20) {
    anyconst = anyconst.replace("$[inputClassLogin]", "errors");
    anyconst = anyconst.replace("$[login]", `${object.body.login}`);
    anyconst = anyconst.replace("$[classPLogin]", "error_p");
    anyconst = anyconst.replace("$[textPErrorLogin]", "Логин слишком длинный");
  } else if (
    object.body.login.length !== 0 &&
    object.body.login.length >= 4 &&
    object.body.login.length <= 20
  ) {
    anyconst = anyconst.replace("$[inputClassLogin]", "success");
    anyconst = anyconst.replace("$[login]", `${object.body.login}`);
    anyconst = anyconst.replace("$[classPLogin]", "");
    anyconst = anyconst.replace("$[textPErrorLogin]", "");
    resultObject.login = "успех";
  }
  // проверка пароля на длину
  if (!object.body.password || object.body.password.length === 0) {
    anyconst = anyconst.replace("$[inputClassPassword]", "errors");
    anyconst = anyconst.replace("$[password]", "");
    anyconst = anyconst.replace("$[classPPassword]", "error_p");
    anyconst = anyconst.replace(
      "$[textPErrorPassword]",
      "В поле пароль ничего нет, введите пароль"
    );
  } else if (
    object.body.password.length !== 0 &&
    object.body.password.length <= 4
  ) {
    anyconst = anyconst.replace("$[inputClassPassword]", "errors");
    anyconst = anyconst.replace("$[password]", `${object.body.password}`);
    anyconst = anyconst.replace("$[classPPassword]", "error_p");
    anyconst = anyconst.replace(
      "$[textPErrorPassword]",
      "Пароль слишком короткий"
    );
  } else if (
    object.body.password.length !== 0 &&
    object.body.password.length > 15
  ) {
    anyconst = anyconst.replace("$[inputClassPassword]", "errors");
    anyconst = anyconst.replace("$[password]", `${object.body.password}`);
    anyconst = anyconst.replace("$[classPPassword]", "error_p");
    anyconst = anyconst.replace(
      "$[textPErrorPassword]",
      "Пароль слишком длинный"
    );
  } else if (
    object.body.password.length !== 0 &&
    object.body.password.length > 4 &&
    object.body.password.length <= 15
  ) {
    if (checkPasswords(object.body.password) === "Простой") {
      anyconst = anyconst.replace("$[inputClassPassword]", "simply");
      anyconst = anyconst.replace("$[password]", `${object.body.password}`);
      anyconst = anyconst.replace("$[classPPassword]", "simly_p");
      anyconst = anyconst.replace("$[textPErrorPassword]", "Пароль простой");
    }
    if (checkPasswords(object.body.password) === "Средний") {
      anyconst = anyconst.replace("$[inputClassPassword]", "medium");
      anyconst = anyconst.replace("$[password]", `${object.body.password}`);
      anyconst = anyconst.replace("$[classPPassword]", "medium_p");
      anyconst = anyconst.replace("$[textPErrorPassword]", "Пароль средний");
      resultObject.password = "успех";
    }
    if (checkPasswords(object.body.password) === "Сложный") {
      anyconst = anyconst.replace("$[inputClassPassword]", "success");
      anyconst = anyconst.replace("$[password]", `${object.body.password}`);
      anyconst = anyconst.replace("$[classPPassword]", "success_p");
      anyconst = anyconst.replace("$[textPErrorPassword]", "Пароль сложный");
      resultObject.password = "успех";
    }
  }

  if (resultObject.password === "успех" && resultObject.login === "успех") {
    let success = objectForCreateDom.htmlSuccess;
    success = success.replace("$[login]", `${object.body.login}`).toUpperCase();
    fs.success = "успех";
    fs.successPage = success;
    return;
  }
  return anyconst;
};

const checkPasswords = (string) => {
  const s_letters = "qwertyuiopasdfghjklzxcvbnm"; // Буквы в нижнем регистре
  const b_letters = "QWERTYUIOPLKJHGFDSAZXCVBNM"; // Буквы в верхнем регистре
  const digits = "0123456789"; // Цифры
  const specials = "!@#$%^&*()_-+=|/.,:;[]{}"; // Спецсимволы
  let is_s = false; // Есть ли в пароле буквы в нижнем регистре
  let is_b = false; // Есть ли в пароле буквы в верхнем регистре
  let is_d = false; // Есть ли в пароле цифры
  let is_sp = false; // Есть ли в пароле спецсимволы
  for (let i = 0; i < string.length; i++) {
    /* Проверяем каждый символ пароля на принадлежность к тому или иному типу */
    if (!is_s && s_letters.indexOf(string[i]) != -1) is_s = true;
    else if (!is_b && b_letters.indexOf(string[i]) != -1) is_b = true;
    else if (!is_d && digits.indexOf(string[i]) != -1) is_d = true;
    else if (!is_sp && specials.indexOf(string[i]) != -1) is_sp = true;
  }
  let rating = 0;
  let text = "";
  if (is_s) rating++; // Если в пароле есть символы в нижнем регистре, то увеличиваем рейтинг сложности
  if (is_b) rating++; // Если в пароле есть символы в верхнем регистре, то увеличиваем рейтинг сложности
  if (is_d) rating++; // Если в пароле есть цифры, то увеличиваем рейтинг сложности
  if (is_sp) rating++; // Если в пароле есть спецсимволы, то увеличиваем рейтинг сложности
  /* Далее идёт анализ длины пароля и полученного рейтинга, и на основании этого готовится текстовое описание сложности пароля */
  if (string.length < 6 && rating < 3) text = "Простой";
  else if (string.length < 6 && rating >= 3) text = "Средний";
  else if (string.length >= 8 && rating < 3) text = "Средний";
  else if (string.length >= 8 && rating >= 3) text = "Сложный";
  else if (string.length >= 6 && rating == 1) text = "Простой";
  else if (string.length >= 6 && rating > 1 && rating < 4) text = "Средний";
  else if (string.length >= 6 && rating == 4) text = "Сложный";
  return text;
};
