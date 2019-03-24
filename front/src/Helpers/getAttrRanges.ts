import {DataItem} from 'types';

let attrRanges:{[attr:string]: (string|number)[]} = {} // prevent duplicated calculation

const range2num = (range:string|number):number=>{
    if (typeof(range)=="number"){
        return range
    }else if(typeof(range)=="string"){
        if (range.match(/(.*)<=?(x|X)<=?(.*)/)){ //regex match, a < x < b
            let match = range.match(/(.*)<=?(x|X)<=?(.*)/)
            return (parseFloat(match[1]) + parseFloat(match[3]))/2
        }else if (range.match(/(x|X)<=?(.*)/)){ //regex match, x < b
            let match = range.match(/(x|X)<=?(.*)/)
            return  parseFloat(match[2])
        }else if (range.match(/(x|X)>=?(.*)/)){ //regex match, x > b
            let match = range.match(/(x|X)>=?(.*)/)
            return  parseFloat(match[2])
        }else if (parseFloat(range)){ // range is int or float, e.g, "12"
            return parseFloat(range)
        }else if (range.match(/[0-9]+/)){
            let match = range.match(/[0-9]+/)
            return parseFloat( match[0] ) // e.g., grade-09
        }
    
        return range.charCodeAt(0) // string, sort by the first character
    }
    return 0 // default
    
}
export const getAttrRanges =  (samples: DataItem[], attr:string):(string|number)[]=>{
    if (attrRanges[attr]){
        return attrRanges[attr]
    }else if(attr=="workclass"){
        return ['Without-pay', 'State-gov', 'Self-emp-not-inc', 'Private', 'Never-worked', 'Self-emp-inc', 'Local-gov', 'Federal-gov']
    }
    else {
        let ranges = samples.map(d=>d[attr])
            .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)
        
        ranges.sort((a, b)=>range2num(a)-range2num(b))
        attrRanges[attr] = ranges
        return ranges
    }
    
}