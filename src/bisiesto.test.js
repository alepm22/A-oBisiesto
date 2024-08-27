import bisiesto from "./bisiesto.js";

describe("bisiesto", () => {

    it("Debería ser un año bisiesto", () => {
      expect(bisiesto(2000)).toEqual("True");
    });

    it("No debería ser un año bisiesto", () => {
      expect(bisiesto(2001)).toEqual("False");
    });
});