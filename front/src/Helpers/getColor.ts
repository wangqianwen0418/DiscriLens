const COLORS: string[] = [
    "#98E090",
    "#FF772D",
    "#1A7AB1",
    "#FF9398",
    "#9467B9",
    "#C5B0D3",
    "#C49B95",
    "#E474C0",
    "#F7B4D1",
    "#BCBC3D",
    "#07C1CD"
    ]
// let names:string[] = ['male', 'female']
let names:string[] = []

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

