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

// объект с ошибками
const objectError = {
  scriptNone: "Нельзя заполнять поле скриптом!",
  loginwrongSymbol: "Поле логин содержит недопустимые символы",
  passwordWrongSymbol: "Поле пароль содержит недопустимые символы",
  errorUndefined: "Ничего не нашлось",
  loginNull: "В поле логин ничего нет, введине логин",
  loginShort: "Логин слишком короткий",
  loginLonger: "Логин слишком длинный",
  passwordNull: "В поле пароль ничего нет, введине пароль",
  passwordKirillica: "В поле пароль нельзя использовать кириллицу",
  passwordShort: "Пароль слишком короткий",
  passwordLonger: "Пароль слишком длинный",
  passwordSimple: "Пароль простой",
  passwordMedium: "Пароль средний",
  passwordHard: "Пароль сложный",
};

// объект с классами
const objectCss = {
  errors: "errors",
  errorParagraf: "error_p",
  empty: "",
  success: "success",
  successParagraf: "success_p",
  simply: "simply",
  simplyParagraf: "simply_p",
  medium: "medium",
  mediumParagraf: "medium_p",
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
        throw new Error(objectError.scriptNone);
      if (
        loginString.includes("<") ||
        loginString.includes(">") ||
        loginString.includes("/") ||
        loginString.includes("&")
      )
        throw new Error(objectError.loginwrongSymbol);
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
    // отправляем страницу
    const newPage = docHtml(request);
    if (typeof newPage === "object") {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.redirect(
        302,
        `/success?login=${(request.query.login = newPage.login)}`
      );
    } else {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.status(200).send(`${newPage}`);
    }
  } catch (error) {
    // отправляем текст ошибки
    response.redirect(
      302,
      `/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

webserver.get("/error", function (request, response) {
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
      `/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

webserver.get("/success", function (request, response) {
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
      `/error?errorMessage=${(request.query.errorMessage = error)}`
    );
  }
});

// начинаем прослушивать подключения на 7681 порту
webserver.listen(7681);

// функция создания html документа
const docHtml = (object) => {
  const resultObject = {};
  const regularKirillica = /[а-яА-ЯёЁ\s\.\,\!\?\-]/gm;
  let anyconst = objectForCreateDom.htmlNew;
  // проверка логина на длину
  if (!object.body.login || object.body.login.length === 0) {
    anyconst = anyconst.replace("$[inputClassLogin]", objectCss.errors);
    anyconst = anyconst.replace("$[login]", objectCss.empty);
    anyconst = anyconst.replace("$[classPLogin]", objectCss.errorParagraf);
    anyconst = anyconst.replace("$[textPErrorLogin]", objectError.loginNull);
  } else if (object.body.login.length !== 0 && object.body.login.length < 4) {
    anyconst = anyconst.replace("$[inputClassLogin]", objectCss.errors);
    anyconst = anyconst.replace("$[login]", `${object.body.login}`);
    anyconst = anyconst.replace("$[classPLogin]", objectCss.errorParagraf);
    anyconst = anyconst.replace("$[textPErrorLogin]", objectError.loginShort);
  } else if (object.body.login.length !== 0 && object.body.login.length > 20) {
    anyconst = anyconst.replace("$[inputClassLogin]", objectCss.errors);
    anyconst = anyconst.replace("$[login]", `${object.body.login}`);
    anyconst = anyconst.replace("$[classPLogin]", objectCss.errorParagraf);
    anyconst = anyconst.replace("$[textPErrorLogin]", objectError.loginLonger);
  } else if (
    object.body.login.length !== 0 &&
    object.body.login.length >= 4 &&
    object.body.login.length <= 20
  ) {
    anyconst = anyconst.replace("$[inputClassLogin]", objectCss.success);
    anyconst = anyconst.replace("$[login]", `${object.body.login}`);
    anyconst = anyconst.replace("$[classPLogin]", objectCss.empty);
    anyconst = anyconst.replace("$[textPErrorLogin]", objectCss.empty);
    resultObject.login = "успех";
  }
  // проверка пароля на длину
  if (!object.body.password || object.body.password.length === 0) {
    anyconst = anyconst.replace("$[inputClassPassword]", objectCss.errors);
    anyconst = anyconst.replace("$[password]", objectCss.empty);
    anyconst = anyconst.replace("$[classPPassword]", objectCss.errorParagraf);
    anyconst = anyconst.replace(
      "$[textPErrorPassword]",
      objectError.passwordNull
    );
  } else if (regularKirillica.test(object.body.password)) {
    anyconst = anyconst.replace("$[inputClassPassword]", objectCss.errors);
    anyconst = anyconst.replace("$[password]", `${object.body.password}`);
    anyconst = anyconst.replace("$[classPPassword]", objectCss.errorParagraf);
    anyconst = anyconst.replace(
      "$[textPErrorPassword]",
      objectError.passwordKirillica
    );
  } else if (
    object.body.password.length !== 0 &&
    object.body.password.length > 15
  ) {
    anyconst = anyconst.replace("$[inputClassPassword]", objectCss.errors);
    anyconst = anyconst.replace("$[password]", `${object.body.password}`);
    anyconst = anyconst.replace("$[classPPassword]", objectCss.errorParagraf);
    anyconst = anyconst.replace(
      "$[textPErrorPassword]",
      objectError.passwordLonger
    );
  } else if (
    object.body.password.length !== 0 &&
    object.body.password.length <= 4
  ) {
    anyconst = anyconst.replace("$[inputClassPassword]", objectCss.errors);
    anyconst = anyconst.replace("$[password]", `${object.body.password}`);
    anyconst = anyconst.replace("$[classPPassword]", objectCss.errorParagraf);
    anyconst = anyconst.replace(
      "$[textPErrorPassword]",
      objectError.passwordShort
    );
  } else if (
    object.body.password.length !== 0 &&
    object.body.password.length > 4 &&
    object.body.password.length <= 15
  ) {
    if (checkPasswords(object.body.password) === "Простой") {
      anyconst = anyconst.replace("$[inputClassPassword]", objectCss.simply);
      anyconst = anyconst.replace("$[password]", `${object.body.password}`);
      anyconst = anyconst.replace(
        "$[classPPassword]",
        objectCss.simplyParagraf
      );
      anyconst = anyconst.replace(
        "$[textPErrorPassword]",
        objectError.passwordSimple
      );
    }
    if (checkPasswords(object.body.password) === "Средний") {
      anyconst = anyconst.replace("$[inputClassPassword]", objectCss.medium);
      anyconst = anyconst.replace("$[password]", `${object.body.password}`);
      anyconst = anyconst.replace(
        "$[classPPassword]",
        objectCss.mediumParagraf
      );
      anyconst = anyconst.replace(
        "$[textPErrorPassword]",
        objectError.passwordMedium
      );
      resultObject.password = "успех";
    }
    if (checkPasswords(object.body.password) === "Сложный") {
      anyconst = anyconst.replace("$[inputClassPassword]", objectCss.success);
      anyconst = anyconst.replace("$[password]", `${object.body.password}`);
      anyconst = anyconst.replace(
        "$[classPPassword]",
        objectCss.successParagraf
      );
      anyconst = anyconst.replace(
        "$[textPErrorPassword]",
        objectError.passwordHard
      );
      resultObject.password = "успех";
    }
  }

  if (resultObject.password === "успех" && resultObject.login === "успех") {
    const success = {};
    success.login = object.body.login;
    return success;
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
