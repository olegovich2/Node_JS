import {
  clearAndGenerateMarkers,
  divFieldMarker,
  download,
} from "./getDataFromForm.js";

let jwt_access = "";
if (localStorage.getItem("user")) {
  jwt_access = JSON.parse(localStorage.getItem("user")).jwt_access;
}

export async function postDataForFileField(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt_access}`,
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
        clearAndGenerateMarkers(result);
        divFieldMarker.scrollIntoView({ block: "start", inline: "nearest" });
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function deleteFile(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt_access}`,
    },
    body: data,
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        if (response.ok) postDataForFileField("/openmarker", data);
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function downloadFile(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt_access}`,
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
        download(result.filename, result.file);
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
      Authorization: `Bearer ${jwt_access}`,
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
