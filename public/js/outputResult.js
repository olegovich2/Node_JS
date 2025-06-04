const divResult = document.querySelector('[data-div="result"]');

export const hubResultFromServer = (object) => {
  if (object.error) {
    objectToDivResultError(object.error);
  } else if (object.modify) {
    objectToInfoRows(object);
  } else {
    objectToTableResult(object);
  }
};

const objectToDivResultError = (object) => {
  divResult.innerHTML = "";
  let div = document.createElement("div");
  div.className = "container";
  let h3 = document.createElement("h3");
  h3.textContent = "ОШИБКА";
  divResult.appendChild(h3);
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      let p = document.createElement("p");
      p.textContent = `${key}: ${object[key]}`;
      div.appendChild(p);
    }
  }
  divResult.appendChild(div);
};

const objectToTableResult = (object) => {
  divResult.innerHTML = "";
  let div = document.createElement("div");
  div.className = "containerSuccess";
  let h3 = document.createElement("h3");
  h3.textContent = "Результат:";
  divResult.appendChild(h3);
  let h4 = document.createElement("h4");
  h4.textContent = `Запрос: ${object.req}`;
  divResult.appendChild(h4);
  const table = document.createElement("table");
  const headers = object.fields;
  const headerRow = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header.name;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);
  Object.values(object).forEach((obj) => {
    const row = document.createElement("tr");
    if (typeof obj !== "string") {
      Object.values(obj).forEach((value) => {
        if (typeof value !== "object") {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        }
      });
    }
    table.appendChild(row);
  });
  div.appendChild(table);
  divResult.appendChild(div);
};

const objectToInfoRows = (object) => {
  divResult.innerHTML = "";
  let div = document.createElement("div");
  div.className = "containerInfo";
  let h3 = document.createElement("h3");
  h3.textContent = `Количество измененных строк: ${object.rows}`;
  div.appendChild(h3);
  let h4 = document.createElement("h4");
  h4.textContent = `Запрос: ${object.req}`;
  div.appendChild(h4);
  divResult.appendChild(div);
};
