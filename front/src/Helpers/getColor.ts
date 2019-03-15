export const COLORS: string[] = [
    "#98E090",
    "#FF9F1E",
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

export const boundaryColor = [
    "#b9b9b9",
    "#e2aaaa",
    "#7cb8c5",
    "#8c97bd",
    "#b9b9b9",
    "#e2aaaa",
    "#7cb8c5",
    "#8c97bd"
]