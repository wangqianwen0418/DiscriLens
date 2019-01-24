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

export const cutTxt = (str:string, len:number)=>{
    return str.length>len? str.slice(0,5) + '...': str
}


const COLORS: string[] = [
    "#1A7AB1",
    "#FF772D",
    "#98E090",
    "#FF9398",
    "#9467B9",
    "#C5B0D3",
    "#C49B95",
    "#E474C0",
    "#F7B4D1",
    "#BCBC3D",
    "#07C1CD"
    ]
let names:string[] = ['male', 'female']

export  const getColor = (name: string): string =>{
        let idx: number = names.indexOf(name)
        let numColor = COLORS.length
        if (idx === -1) {
            names.push(name)
            return COLORS[(names.length - 1) % numColor]
        } else {
            return COLORS[idx % numColor]
        }
    }