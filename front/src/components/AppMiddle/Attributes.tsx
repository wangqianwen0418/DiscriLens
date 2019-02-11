import * as React from 'react';
import {DataItem, Status, KeyGroup} from 'types';
import {Icon, Tooltip} from 'antd';
import {countItem, cutTxt, getColor} from 'components/helpers';
import Draggable, { ControlPosition } from 'react-draggable'
import * as d3 from 'd3';

export interface Props{
    key_attrs: string[],
    samples: DataItem[],
    key_groups: KeyGroup[],
    protected_attr: string,
    fetch_groups_status: Status,
    changePosArray: (g_endPos:number[][])=>void,
    changeKeyAttr:(key_attrs:string[],key_groups:KeyGroup[])=>void
} 
export interface State{
    selected_bar: string[],
    drag_array: number[][],
    key_attrNum: number,
    attrs_init: string[],
} 
export interface curveData{
    x: number,
    y: number,
    z: number
}

export default class Attributes extends React.Component<Props, State>{
    public height= 40; bar_margin=1;attr_margin=8;viewSwitch=-1;
    constructor(props:Props){
        super(props)
        this.state={
            selected_bar: ['',''],
            drag_array: null,
            key_attrNum: 0,
            attrs_init: null,
        }
        this.changeColor = this.changeColor.bind(this)
        this.onStop = this.onStop.bind(this)
        this.initendPos = this.initendPos.bind(this)
    }

    initendPos(attrs_length:number,key_attrsLength:number,attrs_init:any[],key_attrs:string[]){
        let drag_array = Array.apply(null, Array(attrs_length)).map((_:any, i:any)=> 
        [i,(key_attrsLength>i)?1:0])
        this.setState({drag_array:drag_array})
        this.setState({key_attrNum:key_attrsLength})
        this.setState({attrs_init:attrs_init})
        this.changeKeyAttr(key_attrs,this.props.key_groups)
        this.changePosArray(drag_array)
    }

    changeColor(e:string[]){
        this.setState({selected_bar:e})
    }
    
    changePosArray(e:any){
        this.props.changePosArray(e)
    }
    changeKeyAttr(e1:any,e2:any){
        this.props.changeKeyAttr(e1,e2)
    }
    // stop dragging
    onStop(e:any[]){
        // array recording every bars' position, [this attr's position,
        // whether this attr is key-attr(1 is yes while 0 is no)]
        let new_pos = this.state.drag_array
        // number of key attrs
        let key_attrNum = this.state.key_attrNum
        // the position before gragging
        let now_pos = this.state.drag_array[e[0]][0]
        // the position after dragging
        let end_pos = e[1]
        // all attrs
        let attrs = e[2]
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

        // array of key attrs' position
        let attrs_sort:number[] = []
        new_pos.map((attr,attr_i)=>{
            if(attr[1]==1){attrs_sort.push(attr[0])}
        })
        // filter out key attrs from initial attrs
        attrs = attrs.filter((_:any,attr_i:number)=>new_pos[attr_i][1]==1)
        // output key attrs
        let attrs_out = attrs.slice()
        // let output key attrs sort in the same way as drag_array, meaning that this array 
        //  has the same order as key attrs in drag_array
        attrs.map((attr:string,attr_i:number)=>{attrs_out[attrs_sort[attr_i]]=attrs[attr_i]})
        this.setState({drag_array:new_pos})
        this.setState({key_attrNum:key_attrNum})
        this.changeKeyAttr(attrs_out,this.props.key_groups)
        this.changePosArray(this.state.drag_array)
    }

    drawCurves = (attr: string, samples: DataItem[],height: number, curveFlag: boolean, curve_Width: number,color:string[],offsetX=0, offsetY=0,)=>{
        // get ranges of this attr
        let ranges = samples.map(d=>d[attr])
                    .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i) 
                    .sort((a:number,b:number) => a - b)
    
        // step length to merge data, to smooth curve
        function getStep(){
            if(ranges.length<20){return 2}
            else{return 4}
        }
        let step = getStep()
    
        // array recording curve nodes after merging
        let ListNums : curveData[][] = [[]]
        const dataPush = (x:number,y:number,z:number):curveData => {return {x,y,z}}
        // split samples by class
        let samples_reject = samples.filter((s)=>s.class==0)
        let samples_accept = samples.filter((s)=>s.class==1)
        // xRecord is the min & max value of x-axis ([min of x,max of x])
        let xRecord = [Infinity,0]
        // yRecord is the max values of accept & reject y-axis ([max of acc,max of rej])
        let yRecord = [0,0]
        ranges.map((range:number)=>{
            xRecord = [Math.min(xRecord[0],range),Math.max(xRecord[1],range)]
        })
        // split numerical range into categorical one
        let split_point: number[] = []
        let split_num = 4
        for(var i=0;i<split_num + 1;i++){
            split_point.push(Math.floor(i * (xRecord[1] - xRecord[0]) / split_num) + xRecord[0])
        }

        // accept data instances number and reject data instances number 
        let accept_num = 0,
            reject_num = 0,
        // range_num records now range interval 
            range_num: number = 0
        // loop all values of this attr
        ranges.map((range:number,range_i)=>{
            accept_num += samples_accept.filter(s=>s[attr]===range).length
            reject_num += samples_reject.filter(s=>s[attr]===range).length
            if(((range_i%step==0)&&(range_i!=0))||(range_i==ranges.length - 1)||((range_i==0))){
              if(range > split_point[range_num]){
                    ListNums[range_num].push(dataPush(range,accept_num,reject_num))
                    ListNums.push([])
                    range_num += 1
                }
                ListNums[range_num].push(dataPush(range,accept_num,reject_num))
                yRecord = [Math.max(yRecord[0],accept_num),Math.max(yRecord[1],reject_num)]
                accept_num = 0
                reject_num = 0
            }
        })
        // curve x-axis
        let xScale = d3.scaleLinear().domain([xRecord[0],xRecord[1]]).range([0,curve_Width])
        // curve y-axis for data with class = 1
        let yScaleAcc = d3.scaleLinear().domain([0,yRecord[0]]).range([height/2,0]);
        // curve y-axis for data woth class = 0
        let yScaleRej = d3.scaleLinear().domain([0,yRecord[1]]).range([height/2,height]);
        // draw areas based on axis
        const areasAcc = d3.area<curveData>().x(d=>xScale(d.x)).y1(height/2).y0(d=>yScaleAcc(d.y)).curve(d3.curveMonotoneX)
        const areasRej = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>yScaleRej(d.z)).y0(height/2).curve(d3.curveMonotoneX)    
        
        return <g key={attr + 'curve'} transform={`translate(${offsetX}, ${offsetY})`}>
            {ListNums.map((ListNum,ListNum_i)=>{
                
                if(ListNum.length<=1){return null}
                else{
                    let ListTitle:string 
                    if(ListNum_i==0){
                        ListTitle = split_point[ListNum_i] + '<x'
                    } else if(ListNum_i==split_point.length - 1){
                        ListTitle = 'x>' + split_point[ListNum_i] 
                    }else{
                        ListTitle = split_point[ListNum_i] + '<x<' + split_point[ListNum_i + 1]
                    }
                    
                    // change mouseOn bar's color
                    let mouseEnter = () => this.changeColor([attr,ListTitle])
                    // recover bar's color when mouseOut
                    let mouseOut = () => this.changeColor(['',''])

                    return <Tooltip title={ListTitle} key={`${attr}_${ListTitle}_tooltip`}>
                        <g onMouseEnter={mouseEnter} onMouseOut={mouseOut}>
                            <path d={areasAcc(ListNum)||''} style={{fill: ((color[0]==attr)&&(color[1]==ListTitle))?'#DE4863':'#999' }}/>   
                            <path d={areasRej(ListNum)||''} style={{fill: ((color[0]==attr)&&(color[1]==ListTitle))?'pink':'#bbb'}}/>
                        </g>
                    </Tooltip>
                    }
                })
            }
            
        </g>
    } 

    drawPies = (values:number[], radius:number, color:string, innerRadius:number)=>{
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
                return <Tooltip title={range} key={`${attr}_${range}_tooltip`}>
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
                {this.drawPies(subsamples_count, radius, getColor(protect_val), 0)}
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
        
        let attrs_init:any[] = attrs
        // move key attributes to the front
        attrs.sort((a,b)=>{
            if(key_attrs.indexOf(a)!=-1){
                return -1
            }else if(key_attrs.indexOf(b)!=-1){
                return 1
            }
            return 0
        })
        if(this.state.attrs_init!=null){attrs=this.state.attrs_init}
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
        
        
        if(this.state.drag_array==null){this.initendPos(attrs.length,key_attrs.length,attrs_init,key_attrs)}


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
                let posNum = Math.floor((e.x - 0.1 * window.innerWidth )/ (window.innerWidth*0.9 / attrs.length))
                this.onStop([attr_i,posNum,attrs])
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
                    key={attr}
                    axis="x"
                    defaultPosition={{x: offsetX, y: offsetY}}
                    position={draggablePos}
                    onStop={stopPos}>
                <g transform={`translate(${0}, ${0})`}>
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
                key={attr}
                axis="x"
                defaultPosition={{x: offsetX, y: offsetY}}
                position={draggablePos}
                onStop={stopPos}>
                    <g key={attr + 'curves'} transform={`translate(${offsetX}, ${offsetY})`}>
                        {
                            this.drawCurves(attr, samples,this.height,false,bar_w,selected_bar)
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
        return <g key='attrs'>
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