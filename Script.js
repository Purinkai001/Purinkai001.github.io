window.onload=function(holder){
    const Lenght = document.getElementById('Lenght');
    const Output = document.getElementById('Output');
    const button = document.querySelector('#form');

    function out(){
      Output.innerHTML = Lenght.value;

    }
    if (button){
        button.addEventListener('click',out);
    }
    
}
