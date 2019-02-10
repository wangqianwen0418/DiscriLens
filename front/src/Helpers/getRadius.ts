interface radiusDraw{
    innerRadius: number
    outerRadius: number
}
let names:string[] = ['male', 'female']

export const getRadius = (name: string, radius: number, radiusF: number): radiusDraw => {
    let idx: number = names.indexOf(name)
    if(idx == 1){
        return {innerRadius: 0,outerRadius: radiusF / 2}
    } else{
        return {innerRadius:  radius / 2, outerRadius: radius}
    }
}