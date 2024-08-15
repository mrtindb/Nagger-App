'use strict';

/** Returns the datetime when a nagger must be sent as a notification, based on its severity */
function nextExecution(interval){
    let date = new Date();

    if(isNaN(interval)){

        return 0;
    }
    if(interval == 5){
       date.setHours(date.getHours() + 7);
    }
    else if(interval == 0){
        date.setMinutes(date.getMinutes() + 10);
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
    
    return date;
} 

module.exports = nextExecution;