import bisiesto from "./bisiesto";

const first = document.querySelector("#primer-numero");
const form = document.querySelector("#sumar-form");
const div = document.querySelector("#resultado-div");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const firstNumber = Number.parseInt(first.value);
  
  if (bisiesto(firstNumber) === "True") {
    div.innerHTML = "<p>Es un Año bisiesto: " + firstNumber + "</p>";
  } else if (bisiesto(firstNumber) === "False") {
    div.innerHTML = "<p>No es un año bisiesto: " + firstNumber + "</p>";
  }
});