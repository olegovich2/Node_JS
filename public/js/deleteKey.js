document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("user")) {
    localStorage.removeItem("user");
  }
});
