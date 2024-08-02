'use strict';

function nextExecution(interval){
    let date = new Date();
    console.log(date);
    console.log(interval);
    if(isNaN(interval)){
        console.log("Invalid interval"+ interval);
        return 0;
    }
    if(interval == 5){
       date.setHours(date.getHours() + 7);
    }
    else if(interval == 0){
        date.setSeconds(date.getSeconds() + 10);
    }
    else if(interval == 1){
        date.setMinutes(date.getMinutes() + 20);
    }
    else if(interval == 2){
        date.setHours(date.getHours() + 1);
    }
    else if(interval == 3){
        date.setHours(date.getHours() + 2);
    }
    else if(interval == 4){
        date.setHours(date.getHours() + 4);
    }
    console.log(date);
    return date;
} 

module.exports = nextExecution;