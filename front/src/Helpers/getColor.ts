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

export function hsvToRgb(h:number, s:number, v:number) {
    // convert hsv color to rgb color
    // h: [0, 360], s: [0, 1], v:[0, 1]
    var r, g, b;
    h = h/360
  
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
  
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }
  
    // return [ r * 255, g * 255, b * 255 ];
    return `rgb(${r*255}, ${g*255}, ${b*255})`
  }


  // color
// export const GOOD_COLOR = '#89bffd'
export const GOOD_COLOR = '#95c8f7'
export const BAD_COLOR = '#b9dcfd'
