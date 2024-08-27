import bisiesto from "./bisiesto.js";

describe("El anio 2000 es un anio bisiesto", () => {
    it("Es un anio bisiesto", () => {
      expect(bisiesto(2000)).toEqual("True");
    });
  });
  describe("El anio 2001 no es un anio bisiesto", () => {
    it("No es un anio bisiesto", () => {
      expect(bisiesto(2001)).toEqual("False");
    });
  });
  describe("El anio 1700 no es un anio bisiesto", () => {
    it("No es un anio bisiesto divisible entre 100", () => {
      expect(bisiesto(1700)).toEqual("False");
    });
  });
  describe("El anio 2008 es un anio bisiesto", () => {
    it("Es un anio bisiesto divisible entre 4", () => {
      expect(bisiesto(2008)).toEqual("True");
    });
  });
  describe("El anio 2008 es un anio bisiesto", () => {
    it("Es un anio bisiesto divisible entre 4", () => {
      expect(bisiesto(2017)).toEqual("False");
    });
  });

  
  