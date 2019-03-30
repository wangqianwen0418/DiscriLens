export const cutTxt = (str:string, len:number)=>{
    len=Math.ceil(len)
    if(len<=2){
        return str[0]
    }
    return str.length>len? str.slice(0,len-1) + '..': str
}