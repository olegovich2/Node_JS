const { objectForCreateDom } = require("../utils/constants");
const { objectError } = require("../utils/constants");
const { objectCss } = require("../utils/constants");

// валидация email
const validateEmail = (email) => {
  var re =
    /^(([^&lt;&gt;()\[\]\\.,;:\s@"]+(\.[^&lt;&gt;()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

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
  // участок страницы email
  anyconst = anyconst.replace("$[inputClassEmail]", objectCss.success);
  anyconst = anyconst.replace("$[email]", `${object.body.email}`);
  anyconst = anyconst.replace("$[classEmail]", objectCss.empty);
  anyconst = anyconst.replace("$[textErrorEmail]", objectCss.empty);
  resultObject.email = "успех";

  if (
    resultObject.password === "успех" &&
    resultObject.login === "успех" &&
    resultObject.email === "успех"
  ) {
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

module.exports = {
  validateEmail,
  docHtml,
};
