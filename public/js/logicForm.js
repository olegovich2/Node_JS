import {
  deleteElementsFromFieldset,
  createElementInForm,
  createElementInDiv,
  createElementsInDiv,
  deleteElementsInDiv,
  innerPFromJson,
  download,
} from "./createElement.js";

// переменные для работы форм
const formVote = document.querySelector('[data-form="vote"]');
const formResult = document.querySelector('[data-form="result"]');
const formStatAndVariants = document.querySelector(
  '[data-form="statAndVariants"]'
);
const formDownload = document.querySelector('[data-form="download"]');

// работа формы для голосования
formVote.addEventListener("submit", (event) => {
  event.preventDefault();
  const personalVote = {};
  const nameColour = event.target.elements.colour.value;
  personalVote.colour = nameColour;
  postData("/vote", JSON.stringify(personalVote));
  formVote.reset();
});

// работа формы статистики
formResult.addEventListener("submit", (event) => {
  event.preventDefault();
  postDataForStat("/stat");
});

//работа формы - получить с бэкенда статистику ответов и варианты ответов;
formStatAndVariants.addEventListener("submit", (event) => {
  event.preventDefault();
  deleteElementsInDiv();
  getData("/variants", "stat");
  postDataForStat("/stat", "stat");
});

// работа формы для скачивания
formDownload.addEventListener("click", (event) => {
  event.preventDefault();
  let target = event.target;
  let fetchOptions = {};
  if (target.tagName === "BUTTON" && target.dataset.button === "xml") {
    fetchOptions.headers = { Accept: "application/xml" };
    getDataForDownloadXml("/download", fetchOptions);
  } else if (target.tagName === "BUTTON" && target.dataset.button === "html") {
    fetchOptions.headers = { Accept: "application/html" };
    getDataForDownloadHtml("/download", fetchOptions);
  } else if (target.tagName === "BUTTON" && target.dataset.button === "json") {
    fetchOptions.headers = { Accept: "application/json" };
    getDataForDownloadJson("/download", fetchOptions);
  }
});

//получаем данные для опросника
const getData = (url, source) => {
  return fetch(url)
    .then((response) => {
      if (response.ok) return response.json();
      else throw new Error("Получение данных завершилось неудачей");
    })
    .then((result) => {
      if (source === "start") {
        deleteElementsFromFieldset();
        createElementInForm(result);
      } else if (source === "stat") {
        createElementsInDiv(result);
      }
    })
    .catch((error) => {
      console.error(error);
    });
};

// отправляем результат голосования
async function postData(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  })
    .then((response) => {
      if (response.ok) return postDataForStat("/stat", url);
      else throw new Error("Получение данных завершилось неудачей");
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

// отправляем запрос с accept
async function getDataForDownloadJson(url, fetchOptions) {
  const answer = await fetch(url, fetchOptions)
    .then((response) => {
      if (response.ok) {
        if (response.headers.get("Content-Type").includes("application/json")) {
          return response.json();
        } else
          throw new Error(
            "Получение данных в формате JSON завершилось неудачей"
          );
      }
    })
    .then((result) => {
      console.log(result);

      download(result, "json");
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}
async function getDataForDownloadHtml(url, fetchOptions) {
  const answer = await fetch(url, fetchOptions)
    .then((response) => {
      if (response.ok) {
        if (response.headers.get("Content-Type").includes("text/html")) {
          return response.text();
        } else throw new Error("Получение данных завершилось неудачей");
      }
    })
    .then((result) => {
      download(result, "html");
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

async function getDataForDownloadXml(url, fetchOptions) {
  const answer = await fetch(url, fetchOptions)
    .then((response) => {
      if (response.ok) {
        if (response.headers.get("Content-Type").includes("application/xml")) {
          return response.json();
        } else throw new Error("Получение данных завершилось неудачей");
      }
    })
    .then((result) => {
      const data = result;
      const output = OBJtoXML(data);
      download(output, "xml");
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

// отправляем запрос на статистику
async function postDataForStat(url, source) {
  const answer = await fetch(url, {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) return response.json();
      else throw new Error("Получение данных завершилось неудачей");
    })
    .then((result) => {
      if (source === "/vote") innerPFromJson(result);
      else if (source === "stat") createElementsInDiv(result);
      else createElementInDiv(result);
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

document.addEventListener("DOMContentLoaded", () => {
  getData("/variants", "start");
});

function OBJtoXML(obj) {
  var xml = "<body>";
  for (var prop in obj) {
    xml += "<entry>";
    xml += "<" + prop + ">";
    if (obj[prop] instanceof Array) {
      for (var array in obj[prop]) {
        xml += OBJtoXML(new Object(obj[prop][array]));
      }
    } else if (typeof obj[prop] == "object") {
      xml += OBJtoXML(new Object(obj[prop]));
    } else {
      xml += obj[prop];
    }
    xml += "</" + prop + ">";
    xml += "</entry>";
  }
  xml += "</body>";
  var xml = xml.replace(/<\/?[0-9]{1,}>/g, "");
  return xml;
}
