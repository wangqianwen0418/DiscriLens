export const cutTxt = (str:string, len:number)=>{
    return str.length>len? str.slice(0,len-1) + '...': str
}