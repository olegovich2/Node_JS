import { dataToSelect } from "./getDataFromForm.js";
import { hubResultFromServer } from "./outputResult.js";

export async function getDatabases(url) {
  const answer = await fetch(url, {
    method: "GET",
  })
    .then((response) => {
      if (response.ok) return response.json();
      else throw new Error("Получение данных завершилось неудачей");
    })
    .then((result) => {
      dataToSelect(result);
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function postDataForRequestToDB(url, data) {
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
      hubResultFromServer(result);
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}
