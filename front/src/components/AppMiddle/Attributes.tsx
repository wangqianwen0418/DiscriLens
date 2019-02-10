import * as React from 'react';
import {DataItem, Status, KeyGroup} from 'types';
import {Icon, Tooltip, Button} from 'antd';
import {countItem, cutTxt, getColor} from 'components/helpers';
import Draggable, { ControlPosition } from 'react-draggable'
import * as d3 from 'd3';

export interface Props{
    key_attrs: string[],
    samples: DataItem[],
    key_groups: KeyGroup[],
    protected_attr: string,
    fetch_groups_status: Status,
    changePosArray: (g_endPos:number[][])=>void
} 
export interface State{
    selected_bar: string[],
    drag_array: number[][],
    key_attrNum: number,
} 
export interface curveData{
    x: number,
    y: number,
    z: number
}


const drawCurves = (attr: string, samples: DataItem[],height: number, curveFlag: boolean, curve_Width: number,  highlightRange:string ,offsetX=0, offsetY=0,)=>{
    let ranges = samples.map(d=>d[attr])
                .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i) 
                .sort((a:number,b:number) => a - b)
    let ListNum : curveData[] = []
    let samples_reject = samples.filter((s)=>s.class==0)
    let samples_accept = samples.filter((s)=>s.class==1)
    let xRecord = 0
    let yRecord = [0,0]
    function getStep(){
        if(ranges.length<20){return 2}
        else{return 4}
    }
    let step = getStep()
    const dataPush = (x:number,y:number,z:number):curveData => {return {x,y,z}}
    let accept_num = 0,
        reject_num = 0
    ranges.map((range:number,range_i)=>{
        accept_num += samples_accept.filter(s=>s[attr]===range).length
        reject_num += samples_reject.filter(s=>s[attr]===range).length
        //console.log(range,samples_accept,samples_reject,range_i,step)
        if(((range_i%step==0)&&(range_i!=0))||(range_i==ranges.length - 1)||((range_i==0))){
            ListNum.push(dataPush(range,accept_num,reject_num))
            xRecord = Math.max(xRecord,range)
            yRecord = [Math.max(yRecord[0],accept_num),Math.max(yRecord[1],reject_num)]
            accept_num = 0
            reject_num = 0
        }
    })
    let xScale = d3.scaleLinear().domain([0,xRecord]).range([0,curve_Width])
    let yScaleAcc = d3.scaleLinear().domain([0,yRecord[0]]).range([height/2,0]);
    let yScaleRej = d3.scaleLinear().domain([0,yRecord[1]]).range([height/2,height]);
    const areasAcc = d3.area<curveData>().x(d=>xScale(d.x)).y1(height/2).y0(d=>yScaleAcc(d.y)).curve(d3.curveMonotoneX)
    const areasRej = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>yScaleRej(d.z)).y0(height/2).curve(d3.curveMonotoneX)    
    //console.log(ranges,ListNum,highlightRange)
    if(curveFlag){
        let xRange = [0,0]
        let numbers = highlightRange.match(/\d+/g).map(Number)
        if(numbers.length==2){xRange = [numbers[0],numbers[1]]}
        else if(highlightRange.includes('>')){xRange = [numbers[0],xRecord]}
        else{xRange = [0,numbers[0]]}
        const areasAccSelect = d3.area<curveData>().x(d=>xScale(d.x)).y1(height/2).y0(d=>yScaleAcc(d.y)).curve(d3.curveMonotoneX)
        const areasRejSelect = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>yScaleRej(d.z)).y0(height/2).curve(d3.curveMonotoneX)
        let ListNumFilter = ListNum.filter((s)=>{
            if((s.x>xRange[0])&&(s.x<=xRange[1]+1)){return s}
            else{return null}})
        return <g key={attr + 'curve'} transform={`translate(${offsetX}, ${offsetY})`}>
        <path d={areasAcc(ListNum)||''} style={{fill:'#999'}}/> 
        <path d={areasAccSelect(ListNumFilter)||''} style={{fill:'#DE4863'}}/>
        <path d={areasRej(ListNum)||''} style={{fill:'#bbb'}}/>
        <path d={areasRejSelect(ListNumFilter)||''} style={{fill:'pink'}}/>
    </g>
    }
    

    return <g key={attr + 'curve'} transform={`translate(${offsetX}, ${offsetY})`}>
        <path d={areasAcc(ListNum)||''} style={{fill:'#999'}}/>   
        <path d={areasRej(ListNum)||''} style={{fill:'#bbb'}}/>
    </g>

} 
const drawPies = (values:number[], radius:number, color:string, innerRadius:number)=>{
    // convert a list of values to format that can feed into arc generator
    let pie = d3.pie()
    // arc path generator
    let arc = d3.arc()
    .cornerRadius(1)

    return pie(values).map((d:any,i)=>{
        let pathData = arc
            .innerRadius(innerRadius)
            .outerRadius(radius)(d)
        // return an arc
        return <path key={i} d={pathData||''} fill={color} opacity={0.4+i*0.4}/>
    })

}


export default class Attributes extends React.Component<Props, State>{
    public height= 40; bar_margin=1;attr_margin=8;viewSwitch=-1;
    constructor(props:Props){
        super(props)
        this.state={
            selected_bar: ['',''],
            drag_array: null,
            key_attrNum: 0,
        }
        this.changeColor = this.changeColor.bind(this)
        this.onStop = this.onStop.bind(this)
        this.initendPos = this.initendPos.bind(this)
    }

    initendPos(attrs_length:number,key_attrsLength:number){
        this.setState({drag_array:Array.apply(null, Array(attrs_length)).map((_:any, i:any)=> 
            [i,(key_attrsLength>i)?1:0])})
        this.setState({key_attrNum:key_attrsLength})
    }

    changeColor(e:string[]){
        this.setState({selected_bar:e})
    }
    
    changePosArray(e:any){
        this.props.changePosArray(e)
    }
    // stop dragging
    onStop(e:number[]){
        // array recording every bars' position
        let new_pos = this.state.drag_array
        // number of key attrs
        let key_attrNum = this.state.key_attrNum
        // the position before gragging
        let now_pos = this.state.drag_array[e[0]][0]
        // the position after dragging
        let end_pos = e[1]
        // dragging a component right
        if(end_pos>now_pos){
            new_pos = new_pos.map((pos)=>{
                if(((pos[0]<=end_pos))&&(pos[0]>now_pos)){return [pos[0]-1,pos[1]]}
                else{return pos}
            })
            // check whether a key attr is dragged out
            if((key_attrNum<=end_pos)&&(key_attrNum>now_pos)){
                new_pos[e[0]] = [e[1],0]
                key_attrNum -= 1
            } else{new_pos[e[0]] = [e[1],new_pos[e[0]][1]]}
        }
        // dragging a component left
        else{
            if(end_pos>=0){
                new_pos = new_pos.map((pos)=>{
                    if(((pos[0]<now_pos))&&(pos[0]>=end_pos)){return [pos[0]+1,pos[1]]}
                    else{return pos}
                })
                // check whether a key attr is dragged in
                if((key_attrNum>end_pos)&&(key_attrNum<=now_pos)){
                    new_pos[e[0]] = [e[1],1]
                    key_attrNum += 1
                }else{new_pos[e[0]] = [e[1],new_pos[e[0]][1]]}
            }
                
        }
        this.setState({drag_array:new_pos})
        this.setState({key_attrNum:key_attrNum})
        this.changePosArray(this.state.drag_array)
    }

    /**
     * Function to draw bars
     * Inputs:
     *      attr: attribute
     *      samples: all numerical samples
     *      bar_w: the overall length of all bars of each attribute
     *      color: [attr,value of this attr], select a bar, use to change the color of 
     *             selected bar (mouse hover) 
     * 
     * */
    drawBars= (attr:string, samples:DataItem[], 
        bar_w:number, max_accept:number,max_reject:number, height:number,color:string[],
        offsetX=0, offsetY=0):JSX.Element=>{
        let ranges = samples.map(d=>d[attr])
                    .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)
        let samples_reject = samples.filter((s)=>s.class==0)
        let samples_accept = samples.filter((s)=>s.class==1)
        // a single bar's width
        let bar_width = bar_w / ranges.length
        return <g key={attr} transform={`translate(${offsetX}, ${offsetY})`}>
            {/* bars */}
            {ranges.map((range:string, range_i)=>{
                let accept_num = samples_accept.filter(s=>s[attr]===range).length,
                    reject_num = samples_reject.filter(s=>s[attr]===range).length,
                    accept_h = height/2*accept_num/max_accept,
                    reject_h = height/2*reject_num/max_reject
                
                // change mouseOn bar's color
                let mouseEnter = () => this.changeColor([attr,range])
                // recover bar's color when mouseOut
                let mouseOut = () => this.changeColor(['',''])
                return <Tooltip title={range}>
                    <g key={`${attr}_${range}`} 
                        transform={`translate(${range_i*(bar_width)}, ${height/2})`}
                        onMouseEnter={mouseEnter} onMouseOut={mouseOut}>
                        <rect width={bar_width * 0.9} height={accept_h} y={-1*accept_h} style={{fill: ((color[0]==attr)&&(color[1]==range))?'#DE4863':'#999' }}/>
                        <rect width={bar_width * 0.9} height={reject_h} y={0} style={{fill: ((color[0]==attr)&&(color[1]==range))?'pink':'#bbb'}}/>
                    </g>
                </Tooltip>
            })}
        </g>
        
    }

    /********************
     * main function to draw 
     ******************/
    draw(){
        let {samples, key_attrs, protected_attr} = this.props
        let {selected_bar} = this.state
        // get numerical data
        samples = samples.slice(0,1000)
        // protect attribute
        const protect_vals = Object.keys(countItem(samples.map(s=>s[protected_attr])))

        //******************** draw overview pie charts
        let pies = protect_vals.map((protect_val, pie_i)=>{
            let subsamples = samples.filter(d=>d[protected_attr]==protect_val)
            let subsamples_count = Object.values(
                countItem( subsamples.map(s=>s.class) )
            )
            let radius = subsamples.length/samples.length*this.height/2
            // return a pie
            return <g key={protect_val+'_pie'} transform={`translate(${window.innerWidth*0.03}, ${pie_i * this.height})`}>
                {drawPies(subsamples_count, radius, getColor(protect_val), 0)}
            <text>{ (100*subsamples_count[1]/(subsamples_count[0]+subsamples_count[1])).toFixed(2)+'%' }</text>
            <text y={this.height/2} textAnchor='middle'>{`${protect_val}:${subsamples.length}`}</text>
            </g>
        })

        //****************** get all attributes
        let attrs = [...Object.keys(samples[0])]
        // remove the attribute 'id' and 'class'
        //attrs.splice(attrs.indexOf('id'), 1)
        attrs.splice(attrs.indexOf('class'), 1)
        attrs.splice(attrs.indexOf(protected_attr), 1)
        // move key attributes to the front
        attrs.sort((a,b)=>{
            if(key_attrs.indexOf(a)!=-1){
                return -1
            }else if(key_attrs.indexOf(b)!=-1){
                return 1
            }
            return 0
        })
        let counts:number[] = [] // the height of each bar
        let attr_counts:number[] = [0] // the number of previous bars when start draw a new attr

        attrs.forEach(attr=>{
            let count = Object.values(
                countItem(samples.filter(s=>s.class=='0').map(s=>s[attr]))
                )
            counts = counts.concat(count)
            attr_counts.push(count.length + attr_counts[attr_counts.length-1])
        })
        let max_reject = Math.max(...counts)

        counts = []
        attrs.forEach(attr=>{
            let count = Object.values(
                countItem(samples.filter(s=>s.class=='1').map(s=>s[attr]))
                )
                counts = counts.concat(count)
        })
        let max_accept = Math.max(...counts)

        //******************** draw bars
        // the overall length of all bars of each attribute
        let bar_w = window.innerWidth*0.9 / attrs.length * 0.6
        // loop all attributes and draw bars for each one
        let bars = attrs.map((attr:string, attr_i)=>{
            // check whether numerical or categorical attribute
            let dataType = typeof samples.map(d=>d[attr])
            .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)[0]
            // trigger event of stop dragging 
            let stopPos = (e:any) =>{
                if(this.state.drag_array==null){this.initendPos(attrs.length,key_attrs.length)}
                let posNum = Math.floor((e.x - 0.1 * window.innerWidth )/ (window.innerWidth*0.9 / attrs.length))
                this.onStop([attr_i,posNum])
            }

            let offsetX = window.innerWidth*0.9 / attrs.length * attr_i
            let offsetY = 0
            // init position of draggable components
            let draggablePos:ControlPosition = {x:0,y:0}
            let textColor = 'black'
            // whether key attributes or non-key attributes 
            if(this.state.drag_array==null){
                textColor = attr_i<key_attrs.length?'red':'black'
                draggablePos = null
            }else{
                let x = window.innerWidth*0.9 / attrs.length * this.state.drag_array[attr_i][0]
                let y = 0
                textColor = this.state.drag_array[attr_i][1]==1?'red':'black'
                if(x<0){x=0}
                draggablePos.x = x
                draggablePos.y = y
            }
            // categorical attr, draw bars
            if(dataType=='string'){
                return <Draggable
                    axis="x"
                    defaultPosition={{x: offsetX, y: offsetY}}
                    position={draggablePos}
                    onStop={stopPos}>
                <g key={attr} transform={`translate(${0}, ${0})`}>
                {
                    this.drawBars(attr, samples, bar_w, max_accept, max_reject,this.height,selected_bar)
                }
                        <text className='attrLabel' x={0} y={2*this.bar_margin} 
                                transform="rotate(-30)" textAnchor='middle'
                                fill={textColor}
                            >
                        {cutTxt(attr, attr_counts[attr_i+1]- attr_counts[attr_i]+1)}
                    </text>  
                </g>
                </Draggable>
            }
            // numerical attr, draw areas
            else{
                return <Draggable
                axis="x"
                defaultPosition={{x: offsetX, y: offsetY}}
                position={draggablePos}
                onStop={stopPos}>
                    <g key={attr + 'curves'} transform={`translate(${offsetX}, ${offsetY})`}>
                        {
                            drawCurves(attr, samples,this.height,false,bar_w,'')
                        }
                        <text className='attrLabel' x={0} y={2*this.bar_margin} 
                            transform="rotate(-30)" textAnchor='middle'
                            fill={textColor}
                        >
                            {cutTxt(attr, attr_counts[attr_i+1]- attr_counts[attr_i]+1)}
                        </text>
                    </g>
                </Draggable>
            }
        }) 
        return <g>
                
            <foreignObject  transform={`translate(${window.innerWidth*0.1}, ${this.attr_margin*2})`}>
                <Button 
                    type="primary"
                    style={{fontSize:'10px'}}    >
                    <Icon type="right"/>
                </Button>
            </foreignObject>
            <g className='attrs' transform={`translate(${window.innerWidth*0.1}, ${this.attr_margin*2})`}>
                {bars}
            </g>
            <g className='protected_attrs' transform={`translate(${0}, ${this.height/2})`}>
                {pies}
            </g>
        </g>
    }
    render(){
        let {fetch_groups_status} = this.props
        let content:JSX.Element = <g/>        
        // if pending, then return a loading icon
        //console.log(this.props)
        switch(fetch_groups_status){
            case Status.INACTIVE:
                content = <text>no data</text>
                break
            case Status.PENDING:
            content = <g transform={`translate(${window.innerWidth*.5}, ${100})`}>
                        <foreignObject>
                        <Icon 
                            type="sync" 
                            spin={true} 
                            style={{fontSize: '40px', margin: '10px'}}
                        />
                        </foreignObject>
                    </g>
                break
            case Status.COMPLETE:
                content = this.draw()
                break
            default:
                break

        }

        return(<g 
            className='Attributes' 
            transform={`translate(${window.innerWidth*0.01}, ${0})`}
        >
            {content}
        </g>

        
    )}
}