import {
  clearAndGenerateMarkers,
  dataEntryInFormFromDB,
  createResult,
  resultFromServer,
  formOne,
  divFieldMarker,
} from "./createElementsInForm.js";

export async function getDataForMarkerField(url) {
  const answer = await fetch(url)
    .then((response) => {
      if (response.ok) return response.text();
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

export async function postData(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) getDataForMarkerField("/marker");
      else throw new Error("Получение данных завершилось неудачей");
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function getDataForForm(url, data) {
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
      dataEntryInFormFromDB(result);
      formOne.scrollIntoView({ block: "start", inline: "nearest" });
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function deleteMarkerFormList(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) getDataForMarkerField("/marker");
      else throw new Error("Получение данных завершилось неудачей");
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function postDataForFetchApi(url, data) {
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
      createResult(result);
      resultFromServer.scrollIntoView({ block: "start", inline: "nearest" });
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}
