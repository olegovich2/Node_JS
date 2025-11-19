export async function postDataForVerify(url, data) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      } else {
        if (response.ok) {
          return response.json();
        } else throw new Error("Получение данных завершилось неудачей");
      }
    })
    .then((result) => {
      if (result !== undefined) {
        localStorage.setItem("user", JSON.stringify(result));
        redirectToMain("/toMain");
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}

export async function redirectToMain(url) {
  const answer = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${
        JSON.parse(localStorage.getItem("user")).jwt_access
      }`,
    },
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      }
    })
    .catch((error) => {
      console.error(error);
    });
  return answer;
}
