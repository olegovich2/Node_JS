import {
  objectToLIstSurveysAndImages,
  imageToBlock,
} from "./allFunctionsForWorkAccount.js";

// редирект на главную страницу
export async function redirectToMain(url) {
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

export async function getSurveysAndImages(url, data) {
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
        else throw new Error("Получение данных завершилось неудачей");
      }
    })
    .then((result) => {
      if (result !== undefined) {
        objectToLIstSurveysAndImages(result);
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function deleteSurveysAndImages(url, data) {
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
        if (response.ok) getSurveysAndImages("/getSurveys", data);
        else throw new Error("Удаление данных завершилось неудачей");
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function downloadFileToServer(url, data) {
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
        if (response.ok) return;
        else throw new Error("Получение данных завершилось неудачей");
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function getOriginImage(url, data) {
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
        else throw new Error("Получение данных завершилось неудачей");
      }
    })
    .then((result) => {
      if (result !== undefined) {
        imageToBlock(result);
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}
