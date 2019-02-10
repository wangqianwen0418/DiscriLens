export const countItem = (arr: (string|number)[]):{[key:string]:number}=>{
    let ref:{[key:string]:number} = {}
    for (let i=0; i < arr.length; i++){
        let item = arr[i]
        if (item in ref ){
            ref[item] += 1
        }else{
            ref[item] = 0
        }
    }
    return ref
}
