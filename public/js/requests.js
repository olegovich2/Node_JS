import {
  clearAndGenerateMarkers,
  divFieldMarker,
  download,
} from "./getDataFromForm.js";

export async function postDataForFileField(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) return response.json();
      else throw new Error("Получение данных завершилось неудачей");
    })
    .then((result) => {
      clearAndGenerateMarkers(result);
      divFieldMarker.scrollIntoView({ block: "start", inline: "nearest" });
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
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) postDataForFileField("/openmarker", data);
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
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) return response.json();
      else throw new Error("Получение данных завершилось неудачей");
    })
    .then((result) => {
      download(result.filename, result.file);
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
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) postDataForFileField("/openmarker", data);
      else throw new Error("Получение данных завершилось неудачей");
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}
