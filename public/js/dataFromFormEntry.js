import { postDataForVerify } from "./requestsForEntry.js";

const formEntry = document.querySelector('[data-form="entry"]');
const inputLogin = document.querySelector('[data-input="login"]');
const inputPass = document.querySelector('[data-input="pass"]');

const handleGetDataFromEntry = (event) => {
  event.preventDefault();
  if (event.target.dataset.button === "entry") {
    const object = {};
    object.login = inputLogin.value;
    object.password = inputPass.value;
    postDataForVerify("/entryData", JSON.stringify(object));
    formEntry.reset();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  formEntry.addEventListener("click", handleGetDataFromEntry);
  if (localStorage.getItem("user")) {
    localStorage.removeItem("user");
  }
});
