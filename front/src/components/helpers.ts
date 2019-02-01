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

interface radiusDraw{
    innerRadius: number
    outerRadius: number
}
export const getRadius = (name: string, radius: number, radiusF: number): radiusDraw => {
    let idx: number = names.indexOf(name)
    if(idx == 1){
        return {innerRadius: 0,outerRadius: radiusF / 2}
    } else{
        return {innerRadius:  radius / 2, outerRadius: radius}
    }
}

/*********
 * *** */
function Step(this:any, context:any, t:number) {
    this._context = context;
    this._t = t;
  }
  
  Step.prototype = {
    areaStart: function() {
      this._line = 0;
    },
    areaEnd: function() {
      this._line = NaN;
    },
    lineStart: function() {
      this._x = this._y = NaN;
      this._point = 0;
    },
    lineEnd: function() {
      if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
      if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
      if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
    },
    point: function(x:number, y:number) {
      x = +x, y = +y;
      switch (this._point) {
        case 0:
        case 0:
          this._point = 1;
          this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
          break;
        case 1:
          this._point = 2; // proceed
        default:
          {
            var xN, yN, mYb, mYa;
            if (this._t <= 0) {
              xN = Math.abs(x - this._x) * 0.25;
              yN = Math.abs(y - this._y) * 0.25;
              mYb = (this._y < y) ? this._y + yN : this._y - yN;
              mYa = (this._y > y) ? y + yN : y - yN;
  
              this._context.quadraticCurveTo(this._x, this._y, this._x, mYb);
              this._context.lineTo(this._x, mYa);
              this._context.quadraticCurveTo(this._x, y, this._x + xN, y);
              this._context.lineTo(x - xN, y);
  
            } else {
              var x1 = this._x * (1 - this._t) + x * this._t;
  
              xN = Math.abs(x - x1) * 0.25;
              yN = Math.abs(y - this._y) * 0.25;
              mYb = (this._y < y) ? this._y + yN : this._y - yN;
              mYa = (this._y > y) ? y + yN : y - yN;
  
              this._context.quadraticCurveTo(x1, this._y, x1, mYb);
              this._context.lineTo(x1, mYa);
              this._context.quadraticCurveTo(x1, y, x1 + xN, y);
              this._context.lineTo(x - xN, y);
            }
            break;
          }
      }
      this._x = x, this._y = y;
    }
  };
  
  export const stepRound = function(context:any) {
    return new (Step as any)(context, 0.5);
  };
  