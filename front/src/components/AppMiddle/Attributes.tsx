import * as React from 'react';
import { DataItem, Status } from 'types';
import { Icon, Tooltip } from 'antd';
import { countItem, GOOD_COLOR, BAD_COLOR, cutTxt } from 'Helpers';
import Draggable, { ControlPosition } from 'react-draggable'
import * as d3 from 'd3';
import {getAttrRanges} from "Helpers";

import "./Attributes.css";
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
    onChangeKeyAttr: (keyAttrs:string[])=>void,
    onChangeDragArray: (dragArray: string[]) => void,
    onChangeShowAttr: (showAttrs: string[])=>void,
}
export interface State {
    selected_bar: string[],
    cursorDown: boolean,
}
export interface curveData {
    x: number,
    y: number,
    z: number
}

export default class Attributes extends React.Component<Props, State>{
    public bar_margin = 1; attr_margin = 8; viewSwitch = -1; fontSize = 12; rotate = 50;
    height = this.props.step*Math.tan(this.rotate/180*Math.PI)/2
    constructor(props: Props) {
        super(props)
        this.state = {
            selected_bar: ['', ''],
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
        this.setState({ selected_bar })
    }


    toggleShowAttr(attr:string, showFlag:boolean){
        // console.info('toggle show')
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
        // console.info('drag end')
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
            yR0: (yR2 - yR1) * (x0 - x1) / (x2 - x1) + yA1 
        }
    }

    drawCurves = (attr: string, attr_i:number, samples: DataItem[], height: number, curveFlag: boolean, curve_Width: number, selected_bar: string[]) => {
        // get ranges of this attr
        let ranges = samples.map(d => d[attr])
            .filter((x: string, i: number, a: string[]) => a.indexOf(x) == i)
            .sort((a: number, b: number) => a - b)

        let rangesNum:number[] = []
        ranges.forEach((range:number,i)=>{rangesNum.push(range)} )
        let rangesSplit = this.findCateBound(rangesNum)
        // step length to merge data, to smooth curve
        function getStep() {
            if (ranges.length < 20) { return 2 }
            else { return 4 }
        }
        let stepMerge = getStep()
    
        // array recording curve nodes after merging
        let ListNum: curveData[][] = [[]]
        const dataPush = (x: number, y: number, z: number): curveData => { return { x, y, z } }
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
        let rangesCounter = 0
        ranges.forEach((range: number, range_i) => {
            if((range>rangesSplit[rangesCounter])&&(rangesCounter!=rangesSplit.length-1)){
                {rangesCounter ++}
                ListNum.push([])
            }else{
                accept_num += samples_accept.filter(s => s[attr] === range).length
                reject_num += samples_reject.filter(s => s[attr] === range).length
                if (((range_i % stepMerge
                    == 0) && (range_i != 0)) || (range_i == ranges.length - 1) || ((range_i == 0))) {
        
                    ListNum[rangesCounter].push(dataPush(range, accept_num, reject_num))
                    xRecord = [Math.min(xRecord[0], range), Math.max(xRecord[1], range)]
                    yRecord = [Math.max(yRecord[0], accept_num), Math.max(yRecord[1], reject_num)]
                    accept_num = 0
                    reject_num = 0
                }
            }
        })
        // re-loop to add interpolation nodes to achieve consistancy
       // left part
        rangesCounter = 0
        // right part
        let rangesCounter2 = 1
        // line-interpulate between left & right parts
        ranges.forEach((range:number,i)=>{
            if((range>rangesSplit[rangesCounter])&&(rangesCounter2<ListNum.length)){
                // avoid right part being empty
                while(ListNum[rangesCounter2].length==0){rangesCounter2++}
                // calculate interpulation values
                let y0 = this.linearInterpolate(ListNum[rangesCounter][ListNum[rangesCounter].length-1],ListNum[rangesCounter2][0],rangesSplit[rangesCounter])
                // push new nodes
                ListNum[rangesCounter].push({x:range,y:y0.yA0,z:y0.yR0})
                ListNum[rangesCounter2].unshift({x:range,y:y0.yA0,z:y0.yR0})
                rangesCounter ++
                rangesCounter2 ++
            }
        })
    
        // curve x-axis
        let xScale = d3.scaleLinear().domain([xRecord[0], xRecord[1]]).range([0, curve_Width])
        // curve y-axis for data with class = 1
        let yScaleAcc = d3.scaleLinear().domain([0, yRecord[0]]).range([height / 2, 0]);
        // curve y-axis for data woth class = 0
        let yScaleRej = d3.scaleLinear().domain([0, yRecord[1]]).range([height / 2, height]);
        // draw areas based on axis
        const areasAcc = d3.area<curveData>().x(d => xScale(d.x)).y1(height / 2).y0(d => yScaleAcc(d.y)).curve(d3.curveMonotoneX)
        const areasRej = d3.area<curveData>().x(d => xScale(d.x)).y1(d => yScaleRej(d.z)).y0(height / 2).curve(d3.curveMonotoneX)
        
        let markArea = d3.line<curveData>().x(d=>d.x).y(d=>d.y)
        let markData:curveData[] = [{x:0,y:this.height/2,z:0},{x:curve_Width,y:this.height/2,z:0}]
        return <g key={attr + 'curve'}>
            <path d={markArea(markData)} stroke='transparent' strokeWidth={this.height}/>
            {ListNum.map((List,i)=>{
                    let title: string = ''
                    if(i==0){
                        title = 'x<=' + rangesSplit[i]
                    }else if(i==rangesSplit.length - 1){
                        title = 'x>' + rangesSplit[i - 1]
                    }else{
                        title = rangesSplit[i-1] + '<x<=' + rangesSplit[i]
                    }
                    // change mouseOn bar's color when the button is not pressed
                    let mouseEnter = (e:any) => {
                        // e.buttons is used to detect whether the button is pressed
                        if(e.buttons==0){
                            this.changeColor([attr, title])
                        }
                    }
                    // recover bar's color when mouseOut
                    let mouseOut = () => this.changeColor(['', ''])
                    let mouseDown = ()=> {this.changeColor(['', ''])}
                    return <Tooltip title={title} key={`${attr}_${'curve'}_tooltip`}>
                    <g  onMouseOver={mouseEnter} onMouseOut={mouseOut} onMouseDown={mouseDown}>
                        <path d={areasAcc(List) || ''}  style={{ fill: ((selected_bar[0] == attr) && (selected_bar[1] == title)) ? '#DE4863' : GOOD_COLOR }}  />
                        <path d={areasRej(List) || ''}  style={{ fill: ((selected_bar[0] == attr) && (selected_bar[1] == title)) ? 'pink' : BAD_COLOR }}  />
                    </g>
                    </Tooltip>
                })
            }
        </g>
    }
    /**
     * Function to draw bars
     * Inputs:
     *      attr: attribute
     *      samples: all numerical samples
     *      barWidth: the overall length of all bars of each attribute
     *      color: [attr,value of this attr], select a bar, use to change the color of 
     *             selected bar (mouse hover) 
     * 
     * */
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
                return <Tooltip title={range} key={`${attr}_${range}_tooltip`}>
                    <g key={`${attr}_${range}`}
                        transform={`translate(${range_i * (barWidthidth)}, ${height / 2})`}
                        onMouseOver={mouseEnter} onMouseOut={mouseOut} onMouseDown={mouseDown}>
                        <rect width={barWidthidth * 0.9} height={accept_h} y={-1 * accept_h} style={{ fill: ((color[0] == attr) && (color[1] == range)) ? '#DE4863' : GOOD_COLOR }} />
                        <rect width={barWidthidth * 0.9} height={reject_h} y={0} style={{ fill: ((color[0] == attr) && (color[1] == range)) ? 'pink' : BAD_COLOR }} />
                         </g>
                </Tooltip>
            })}
        </g>

    }

    /********************
     * main function to draw 
     ******************/
    draw() {
        let { samples, keyAttrNum, barWidth, step, showAttrNum, dragArray } = this.props
        let showAttrs = dragArray.slice(0, showAttrNum), keyAttrs = dragArray.slice(0, keyAttrNum)
        let { selected_bar } = this.state
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
        
        // loop all attributes and draw bars for each one
        let attrCharts = dragArray.map((attr: string, attr_i) => {
            // check whether numerical or categorical attribute
            let dataType = typeof samples.map(d => d[attr])
                .filter((x: string, i: number, a: string[]) => a.indexOf(x) == i)[0]
            // trigger event of stop dragging 
            let onDragEnd = (e:any) =>{
                e.preventDefault();
                // e.stopPropagation();
                let endNum = Math.floor((e.x - window.innerWidth / 6 - this.props.offsetX)/ step)
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
                let x = showFlag?step*current_i: step*showAttrNum + (current_i-showAttrNum)*this.fontSize*2
                let y = 0
                // textColor = this.state.dragArray[attr_i][1] == 1 ? 'red' : 'black'
                if (x < 0) { x = 0 }
                draggablePos.x = x
                draggablePos.y = y
            }

            // label postition
            let labelX = showFlag?0:-1*this.height,  labelY = showFlag?1.5*this.height: 1*this.height
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
                    <g className="attr" id={'draggable'+String(attr_i)+attr}>
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
                            transform={`rotate(${showFlag?0:-1*this.rotate}) translate(${labelX}, ${labelY})`} 
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
            <g className='attrs' transform={`translate(${this.props.offsetX}, ${this.attr_margin * 2})`}>
                {attrCharts}
                {//<path d={boarder(keyAttrBoarder)||''}style={{fill:'none',stroke:'#bbb',strokeWidth:'1px'}} />
                }
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