function bisiesto(n) {
  let respuesta;
  if (n%400===0){
      respuesta="True";
  }
  else{
      respuesta="False";
  }
  return respuesta;
}
export default bisiesto;