import { rewriteSurveyLocalStorage } from "./allFunctionsForWorkMain.js";

// отправка списка диагнозов для забора из базы данных рекомендаций
export async function postTitlesForListRecomFromDB(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).jwt_access}`,
    },
    body: data,
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        if (response.ok) return response.json();
        else throw new Error("Получение рекомендаций завершилось неудачей");
      }
    })
    .then((result) => {
      if (result !== undefined) {
        rewriteSurveyLocalStorage(result);
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

// редирект на страницу аккаунта
export async function redirectToAccount(url) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).jwt_access}`,
    },
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        if (response.ok) return response.text();
        else throw new Error("Редирект завершился неудачей");
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

// редирект на страницу аккаунта
export async function checkJWT(url) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).jwt_access}`,
    },
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        if (response.ok) return true;
        else throw new Error("JWT просрочен");
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}
