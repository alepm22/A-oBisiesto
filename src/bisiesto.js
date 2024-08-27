function bisiesto(año) {
  if (año%400===0)
  {
    return "True";

  }else if(año%100===0)
  {
    return "False";
  }
  else{
    return "False";
  }
  }
 
  export default bisiesto;