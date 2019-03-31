// match strings
export const stringTransfer=(input:string)=>{
    let firstCha = input[0],
    restCha = input.slice(1,input.length)
    if((input=='Gender')||(input=='Raisedhands')){
        return firstCha.toLowerCase() + restCha
    }
    else if(input=='AbsenceDays'){
        return 'StudentAbsenceDays'
    }
    else if(input=='hours'){
        return "hours-per-week"
    }
    else if(input=='educational'){
        return "educational-num"
    }
    else{
        return input
    }
}