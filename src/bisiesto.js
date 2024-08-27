function bisiesto(n) {
  if (n%400===0)
  {
    return "True";

  }else if(n%100===0)
  {
    return "False";
  }else if(n%4===0)
  {
    return "True";
  }
  else{
    return "False";
  }
  }
 
  
  
  export default bisiesto;