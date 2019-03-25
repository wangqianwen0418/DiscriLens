import * as React from 'react';
import { DataItem, Status } from 'types';
import { Icon, Tooltip} from 'antd';
import { countItem, cutTxt,BAD_COLOR,GOOD_COLOR } from 'Helpers';
import Draggable, { ControlPosition } from 'react-draggable'
import * as d3 from 'd3';
import {getAttrRanges} from "Helpers";

import "./Attributes.css";
// import { histogram } from 'd3';
export interface Props {
    keyAttrNum: number,
    showAttrNum: number,
    dragArray: string[],
    samples: DataItem[],
    protectedAttr: string,
    fetchKeyStatus: Status,
    step:number,
    barWidth: number,
    offsetX:number,
    selected_bar:string[],
    foldFlag: boolean,
    leftWidth:number,
    offset:number,
    offsetLength:number,
    compFlag: boolean,
    onChangeKeyAttr: (keyAttrs:string[])=>void,
    onChangeDragArray: (dragArray: string[]) => void,
    onChangeShowAttr: (showAttrs: string[])=>void,
    onChangeSelectedBar: (selected_bar:string[])=>void,
}
export interface State {
    cursorDown: boolean,
}
export interface curveData {
    x: number,
    y: number,
    z: number
}

export default class Attributes extends React.Component<Props, State>{
    public bar_margin = 1; attr_margin = 8; viewSwitch = -1; fontSize = 15; rotate = 90;
    height = window.innerHeight / 10;
    posColor = 'rgb(253, 194, 140)';
    negColor = 'rgb(183, 226, 177)';

    constructor(props: Props) {
        super(props)
        this.state = {
            // showAttrs: [],
            cursorDown: false,
        }
        this.changeColor = this.changeColor.bind(this)
        this.draw = this.draw.bind(this)
        this.onDragEnd = this.onDragEnd.bind(this)
        this.toggleShowAttr = this.toggleShowAttr.bind(this)
        this.changeCursorStatus = this.changeCursorStatus.bind(this)
    }

    changeCursorStatus(cursorDown:boolean){
        this.setState({cursorDown})
    }

    changeColor(selected_bar: string[]) {
        this.props.onChangeSelectedBar(selected_bar)
        this.setState({})
    }


    toggleShowAttr(attr:string, showFlag:boolean){
        let {showAttrNum, keyAttrNum, dragArray} = this.props
        let showAttrs = dragArray.slice(0, showAttrNum),
            keyAttrs = dragArray.slice(0, keyAttrNum),
            attrIdx = dragArray.indexOf(attr)
        if(showFlag){
            // collapse an attribute
            if (attrIdx<keyAttrNum){
                // a key attribute
                keyAttrs.splice(attrIdx, 1)
                this.props.onChangeKeyAttr(keyAttrs)
            }
            showAttrs.splice(attrIdx, 1)
            dragArray = showAttrs.concat(dragArray.filter(attr=>!showAttrs.includes(attr)))
        }else{
            // expand an attribute
            showAttrs.push(attr)
            dragArray = showAttrs.concat(dragArray.filter(attr=>!showAttrs.includes(attr)))
            
        }
        this.props.onChangeShowAttr(showAttrs)
        this.setState({}) // force update
    }

    // stop dragging
    onDragEnd(attr:string,startNum:number,endNum:number,endReal:number){
        let dragArray:string[] = []
        let {dragArray: oldArray, keyAttrNum} = this.props
        let boarder = oldArray.slice(0, keyAttrNum)
        // dragging left
        if(startNum>endNum){
            let startAttr = oldArray[startNum]
            oldArray.forEach((d,i)=>{
                if((i>endNum)&&(i<=startNum)){dragArray.push(oldArray[i - 1])}
                else if(i==endNum){ dragArray.push(startAttr)}
                else{dragArray.push(d)}
            })
            // add a new keyAttr
            if((endReal<0)&&(startNum>=boarder.length)){
                boarder.push(attr)
            }else if((startNum>=boarder.length)&&(endNum<boarder.length)){
                boarder.push(attr)
            }
        }
        
        // dragging right
        else if(startNum<endNum){
            let startAttr = oldArray[startNum]
            oldArray.forEach((d,i)=>{
                if((i>=startNum)&&(i<endNum)){dragArray.push(oldArray[i + 1])}
                else if(i==endNum){dragArray.push(startAttr)}
                else{dragArray.push(d)}
            })
            // remove a keyAttr
            if((endReal!=endNum)&&(startNum<boarder.length)){
                boarder.splice(boarder.indexOf(attr),1)
            }else if((startNum<boarder.length)&&(endNum>=boarder.length)){
                boarder.splice(boarder.indexOf(attr),1)
            } 
        }
        else{
            if(startNum!=endReal){
                if((endReal>=this.props.showAttrNum)&&(startNum<boarder.length)){
                    boarder.splice(boarder.indexOf(attr),1)
                }
                if((endReal<0)&&(startNum>=boarder.length)){
                    boarder.push(attr)
                }
            }
            dragArray = oldArray
        }
        this.props.onChangeKeyAttr(boarder)
        this.props.onChangeDragArray(dragArray)
    }

    findCateBound = (arr:number[]) =>{
        let n = 4 
        let maxValue = Math.max(...arr)
        let minValue = Math.min(...arr)
        let thresholds = [] 
        for( var i=0; i < n + 1 ;i++){
            thresholds.push(Math.floor(i*(maxValue-minValue)/n)+minValue)
        }
        return thresholds
    }

    linearInterpolate = ({x:x1,y:yA1,z:yR1}:curveData,{x:x2,y:yA2,z:yR2}:curveData,x0:number) =>{
        //let x1 = in1.x,yA1=in1.y,yR1=in1.z,x2 = in2.x,yA2=in2.y,yR2=in2.z
        return {
            yA0: (yA2 - yA1) * (x0 - x1) / (x2 - x1) + yA1 ,
            yR0: (yR2 - yR1) * (x0 - x1) / (x2 - x1) + yR1 
        }
    }

    drawCurves = (attr: string, attr_i:number, samples: DataItem[], height: number, curveFlag: boolean, curve_Width: number, selected_bar: string[]) => {
        // get ranges of this attr
        let ranges = samples.map(d => d[attr])
            .filter((x: string, i: number, a: string[]) => a.indexOf(x) == i)
            .sort((a: number, b: number) => a - b)

        let rangesNum:number[] = []
        ranges.forEach((range:number,i)=>{rangesNum.push(range)} )
        // let rangesSplit = this.findCateBound(rangesNum)
        // step length to merge data, to smooth curve
        function getStep() {
            if (ranges.length < 20) { return 2 }
            else if(ranges.length>200){return Math.floor(ranges.length/20)}
            else { return 5}
        }
        let stepMerge = getStep()
    
        // array recording curve nodes after merging
        let ListNum: {range:number[],acc:number[],rej:number[]} = {range:[],acc:[],rej:[]}
        // split samples by class
        let samples_reject = samples.filter((s) => s.class == 0)
        let samples_accept = samples.filter((s) => s.class == 1)
        // xRecord is the min & max value of x-axis ([min of x,max of x])
        let xRecord = [Infinity, 0]
        // yRecord is the max values of accept & reject y-axis ([max of acc,max of rej])
        let yRecord = [0, 0]
    
        // accept data instances number and reject data instances number 
        let accept_num = 0,
            reject_num = 0
        // range_num records now range interval 
        // loop all values of this attr
        ranges.forEach((range: number, range_i) => {
                accept_num += samples_accept.filter(s => s[attr] === range).length
                reject_num += samples_reject.filter(s => s[attr] === range).length
                if ((range_i % stepMerge
                    == 0&&(range_i!=0))) {
                    ListNum.range.push(range)
                    ListNum.acc.push(accept_num)
                    ListNum.rej.push(reject_num)
                    xRecord = [Math.min(xRecord[0], range), Math.max(xRecord[1], range)]
                    yRecord = [Math.max(yRecord[0], accept_num), Math.max(yRecord[1], reject_num)]
                    accept_num = 0
                    reject_num = 0
                }
        })

        let hisWidth = curve_Width/ListNum.range.length,
        hisAccHeight = this.height/2/Math.max(...ListNum.acc),
        hisRejHeight = this.height/2/Math.max(...ListNum.rej)

        ListNum.acc = ListNum.acc.map((acc)=>acc*hisAccHeight)
        ListNum.rej = ListNum.rej.map((rej)=>rej*hisRejHeight)

        return <g>
            {ListNum.range.map((range,i)=>{
                return <g>
                <rect x={hisWidth*i} y={this.height/2-ListNum.acc[i]} width={hisWidth} height={ListNum.acc[i]} 
                    style={{fill:GOOD_COLOR}}/>
                <rect x={hisWidth*i} y={this.height/2} width={hisWidth} height={ListNum.rej[i]} 
                    style={{fill:BAD_COLOR}}/>
                </g>
            })
            }

        </g>
    }

    drawBars = (attr: string, attr_i:number, samples: DataItem[],
        barWidth: number, max_accept: number, max_reject: number, height: number, color: string[]): JSX.Element => {
        // let ranges = samples.map(d => d[attr])
        //     .filter((x: string, i: number, a: string[]) => a.indexOf(x) == i)
        let ranges = getAttrRanges(samples, attr) 
        let samples_reject = samples.filter((s) => s.class == 0)
        let samples_accept = samples.filter((s) => s.class == 1)
        // a single bar's width
        let barWidthidth = barWidth / ranges.length
        
        let markArea = d3.line<curveData>().x(d=>d.x).y(d=>d.y)
        let markData:curveData[] = [{x:0,y:this.height/2,z:0},{x:barWidth - barWidthidth * 0.1,y:this.height/2,z:0}]
        return <g key={attr}>
            <path d={markArea(markData)} stroke='transparent' strokeWidth={this.height}/>
            {ranges.map((range: string, range_i) => {
                let accept_num = samples_accept.filter(s => s[attr] === range).length,
                    reject_num = samples_reject.filter(s => s[attr] === range).length,
                    accept_h = height / 2 * accept_num / max_accept,
                    reject_h = height / 2 * reject_num / max_reject

                // change mouseOn bar's color when the button is not pressed
                let mouseEnter = (e:any) => {
                    // e.buttons is used to detect whether the button is pressed
                    if(e.buttons==0){
                        this.changeColor([attr, range])
                    }
                }
                // recover bar's color when mouseOut
                let mouseOut = () => this.changeColor(['', ''])
                let mouseDown = ()=> {this.changeColor(['', ''])}

                let transXText = 0
                let textShow = cutTxt(range, barWidthidth*0.9/this.fontSize*2)
                if (document.getElementById(`rangeText${attr+String(range_i)}`)){
                    let textWidth = document.getElementById(`rangeText${attr+String(range_i)}`).getClientRects()[0].width
                    if(textWidth<0.9*barWidthidth){
                        transXText = 0.45*barWidthidth - textWidth/2
                    }else if(textWidth>barWidthidth){
                        textShow = cutTxt(range, barWidthidth*0.7/this.fontSize*2)
                    }
                }
                let rangeText = <text id={'rangeText'+attr+String(range_i)} fontSize={10} fill='#999'
                transform={`translate(${range_i * (barWidthidth)+transXText},${this.height*1.2})`}>
                {textShow}</text>

                if(!document.getElementById(`rangeText${attr+String(range_i)}`)){
                    this.setState({})
                }
                return <g>
                    <Tooltip title={range} key={`${attr}_${range}_tooltip`}>
                    <g key={`${attr}_${range}`}
                        transform={`translate(${range_i * (barWidthidth)}, ${height / 2})`}
                        onMouseOver={mouseEnter} onMouseOut={mouseOut} onMouseDown={mouseDown}>
                        <rect width={barWidthidth * 0.9} height={accept_h} y={-1 * accept_h} style={{ fill: ((color[0] == attr) && (color[1] == range)) ? '#DE4863' : GOOD_COLOR }} />
                        <rect width={barWidthidth * 0.9} height={reject_h} y={0} style={{ fill: ((color[0] == attr) && (color[1] == range)) ? 'pink' : BAD_COLOR }} />
                         </g>
                </Tooltip>
                <g>
                    {rangeText}
                </g>

                </g>
            })}
        </g>

    }
    /********************
     * main function to draw 
     ******************/
    draw() {
        let {selected_bar, samples, keyAttrNum, barWidth, step, showAttrNum, dragArray } = this.props
        let showAttrs = dragArray.slice(0, showAttrNum), keyAttrs = dragArray.slice(0, keyAttrNum)
        // get numerical data
        samples = samples.slice(0, Math.floor(samples.length/2) )
        let counts:number[] = [] // the height of each bar
        let attr_counts:number[] = [0] // the number of previous bars when start draw a new attr
        dragArray.forEach(attr => {
            let count = Object.values(
                countItem(samples.filter(s => s.class == '0').map(s => s[attr]))
            )
            counts = counts.concat(count)
            attr_counts.push(count.length + attr_counts[attr_counts.length - 1])
        })
        let max_reject = Math.max(...counts)

        counts = []
        dragArray.forEach(attr => {
            let count = Object.values(
                countItem(samples.filter(s => s.class == '1').map(s => s[attr]))
            )
            counts = counts.concat(count)
        })
        let max_accept = Math.max(...counts)
        
        //******************** draw bars
        // the overall length of all bars of each attribute
        // let step = window.innerWidth * 0.4/  keyAttrs.length
        let shiftX = this.props.compFlag?(this.props.offset*3/4-this.props.offsetLength):0
        // loop all attributes and draw bars for each one
        let attrCharts = dragArray.map((attr: string, attr_i) => {
            // check whether numerical or categorical attribute
            let dataType = typeof samples.map(d => d[attr])
                .filter((x: string, i: number, a: string[]) => a.indexOf(x) == i)[0]
            // trigger event of stop dragging 
            let onDragEnd = (e:any) =>{
                e.preventDefault();
                // e.stopPropagation();
                
                let endNum = Math.floor((e.x - (window.innerWidth-this.props.leftWidth) - this.props.offset - this.props.offsetX+shiftX)/ step)
                let endReal = endNum
                let startNum = this.props.dragArray.indexOf(attr)
                if(showFlag){
                    endNum = Math.max(0,endNum)
                    endNum = Math.min(showAttrNum - 1,endNum)}
                else{
                    endNum = Math.max(showAttrNum, endNum)
                    endNum = Math.min(dragArray.length,endNum)
                }
                this.onDragEnd(attr,startNum,endNum,endReal)
            }
            let showFlag = (showAttrs.indexOf(attr)>-1),

                offsetX =  showFlag?
                    step* attr_i // key attribute
                    :
                    step * showAttrNum+ this.fontSize*2*(attr_i - showAttrNum) // non key attribute

            let offsetY = 0
            // init position of draggable components
            let draggablePos: ControlPosition = { x: 0, y: 0 }
            // let textColor = 'black'
            // whether key attributes or non-key attributes 
            if (this.props.dragArray.length == 0) {
                // textColor = attr_i < keyAttrs.length ? 'red' : 'black'
                draggablePos = null
            } else {
                let current_i = this.props.dragArray.indexOf(attr)
                let x = showFlag?step*current_i: step*showAttrNum
                let y = 0
                // textColor = this.state.dragArray[attr_i][1] == 1 ? 'red' : 'black'
                if (x < 0) { x = 0 }
                draggablePos.x = x
                draggablePos.y = y
            }

            // label postition
            let labelX = showFlag?0:0.3*this.height,  labelY = showFlag?1.5*this.height: this.fontSize*1.2*(attr_i-keyAttrNum+1)
            const toggleShowAttr = (e:React.SyntheticEvent)=>{
                this.toggleShowAttr(attr, showFlag)
            }
            /*
            let mouseDown =()=>{this.changeCursorStatus(true)}
            let mouseUp =()=>{this.changeCursorStatus(false)}
            let changeCursor=(e:boolean)=>{
                if(e){return "pointer"}
                else{return "e-resize"}
            }*/

            return <Draggable key={attr} axis="x"
                defaultPosition={{ x: offsetX, y: offsetY }}
                handle='.attrChart'
                position={draggablePos}
                onStop={onDragEnd}
                >
                    <g className="attr" id={'drag'+String(attr_i)+attr}>
                        {showAttrs.includes(attr)?
                            <g className='attrChart' cursor='pointer'>
                                {dataType == 'string'? 
                                    this.drawBars(attr, attr_i,samples, barWidth, max_accept, max_reject, this.height, selected_bar)
                                    :
                                    this.drawCurves(attr, attr_i,samples, this.height, false, barWidth, selected_bar)
                                }
                            </g>
                            :
                            <g className='attrChart non-key'/>
                        }
                        <g 
                            className='attrLabel' 
                            transform={`translate(${labelX}, ${labelY})`} 
                            style={{transformOrigin: `(${labelX}, ${labelY})`}}
                        >
                            <rect 
                                width={barWidth} height={this.fontSize*1.2} 
                                x={-this.fontSize*0.2}
                                y={-this.fontSize*1}
                                rx="2" ry="2"
                                fill="#ebf8ff"
                                stroke="#85cdf9"
                                strokeWidth="1px"
                            />
                            <text 
                                textAnchor="start" 
                                style={{
                                    MozUserSelect:'none',
                                    WebkitUserSelect:'none',
                                    msUserSelect:'none'
                                }}
                                fontSize={this.fontSize} 
                                fill={keyAttrs.includes(attr)?'#0e4b8e':'#bbb'}>
                                {cutTxt(attr, barWidth*0.7/this.fontSize*2)}
                            </text>
                            <text 
                                className='toggleShowLabel'
                                textAnchor="end"
                                x={barWidth-this.fontSize/2} 
                                fontSize={this.fontSize} 
                                cursor="pointer"
                                onClick={toggleShowAttr}
                                >
                                {showFlag?"-":"+"}
                            </text> 
                        </g>
                    </g>
            </Draggable>   
        })
        /* let boarder = d3.line<curveData>().x(d=>d.x).y(d=>d.y)
        let keyAttrBoarder:curveData[] = [{x:(keyAttrs.length - 0.2) * step,y:60,z:0},
            {x:(keyAttrs.length - 0.2)* step,y:0,z:0}] */
        return <g id={'attributes_draggable'}>
            <g className='attrs' transform={`translate(${this.props.offsetX - shiftX}, ${this.attr_margin * 2})`}>
                {attrCharts}
            </g>
        </g>
    }
    render() {
        let { fetchKeyStatus } = this.props
        let content: JSX.Element = <g />
        // if pending, then return a loading icon
        switch (fetchKeyStatus) {
            case Status.INACTIVE:
                content = <text>no data</text>
                break
            case Status.PENDING:
                content = <g transform={`translate(${window.innerWidth * .5}, ${100})`}>
                    <foreignObject>
                        <Icon
                            type="sync"
                            spin={true}
                            style={{ fontSize: '40px', margin: '10px' }}
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

        return (<g className='Attributes'>
            {content}
        </g>


        )
    }
}