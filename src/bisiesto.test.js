import bisiesto from "./bisiesto.js";

describe("El anio 2000 es un anio bisiesto", () => {
    it("Es un anio bisiesto", () => {
      expect(bisiesto(2000)).toEqual("True");
    });
  });