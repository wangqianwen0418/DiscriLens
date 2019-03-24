import * as React from 'react';
import "./Overview.css"
import * as d3 from 'd3'
import {curveData} from 'components/AppMiddle/Attributes'
import {Rule} from 'types';
import {GOOD_COLOR,BAD_COLOR, filterRulesNoThreshold} from 'Helpers'
import './Overview.css'

export interface Props{
    allRules: Rule[],
    compAllRules: Rule[],
    keyAttrs: string[],
    ruleThreshold: number[],
    protectedVal: string,
    xScaleMax: number,
    offset:number,
    divideNum:number,
    onChangeRuleThreshold : (ruleThreshold:[number, number])=>void
}
export interface State{
    transformXLeft: number,
    transformXRight: number,
    zeroAxis: number,
    xScaleReverse: d3.ScaleLinear<number, number>
    xScale: d3.ScaleLinear<number, number>
    inputLeft: boolean,
    inputRight: boolean,
    xScaleMax:number,
}
export interface rules{
    rule: string[],
    risk_dif: number,
}

export default class Overview extends React.Component<Props,State>{
    // left start position of svg elements
    public leftStart = 20 ; 
    // right end position
    rightEnd = window.innerWidth * 0.15; 
    // bottom end position
    bottomEnd = 120; 
    // top start position 
    topStart = 40 ;
    // a standard reference length
    markSize = 14; 
    // interval of different models' view
    intervalHeight = 90;
    // line's color
    lineColor = 'rgb(204, 204, 204)';
    // color of unselected area (BAD_COLOR is the color of selected area)
    areaColor = 'rgb(232, 232, 232)';
    posColor = 'rgb(253, 211, 161)';
    negColor = 'rgb(198, 232, 191)'
    // counters for dragging
    xLeft = 0; 
    xRight = 0;
    yScale:any;
    yMax:number;
    offsetX = window.innerWidth / 6 + this.props.offset / 5 - this.leftStart / 4 * 3
    fontSize=12;
    private ref: React.RefObject<SVGGElement>;
    constructor(props:Props){
        super(props)
        this.ref = React.createRef()
        this.state={
            transformXLeft: null,
            transformXRight: null,
            zeroAxis:null,
            xScaleReverse:null,
            xScale:null,
            inputLeft: false,
            inputRight: false,
            xScaleMax:-1
        }
        this.mouseDownLeft = this.mouseDownLeft.bind(this)
        this.mouseMoveLeft = this.mouseMoveLeft.bind(this)
        this.mouseUpLeft = this.mouseUpLeft.bind(this)
        this.mouseDownRight = this.mouseDownRight.bind(this)
        this.mouseMoveRight = this.mouseMoveRight.bind(this)
        this.mouseUpRight = this.mouseUpRight.bind(this)
        this.initTransformX = this.initTransformX.bind(this)
        this.inputLeft = this.inputLeft.bind(this)
        this.inputRight = this.inputRight.bind(this)
    }
    public componentDidMount() { 
        this.renderAxis();
    }
    
    public componentDidUpdate() {
        this.renderAxis();
    }

    // initialize states
    initTransformX(transformXLeft:number,transformXRight:number,zeroAxis:number,xScale:d3.ScaleLinear<number, number>,xScaleReverse:d3.ScaleLinear<number, number>){
        this.setState({transformXLeft,transformXRight,zeroAxis,xScale,xScaleReverse})
        this.props.onChangeRuleThreshold([xScaleReverse(transformXLeft),xScaleReverse(transformXRight)])
        this.xLeft = transformXLeft; 
        this.xRight = transformXRight;
    }
    // update axis scales
    update(xScale:d3.ScaleLinear<number, number>,xScaleReverse:d3.ScaleLinear<number, number>){
        this.setState({xScale,xScaleReverse})
        this.setState({xScaleMax:this.props.xScaleMax})
    }
    // left dragging
    mouseDownLeft(e: React.MouseEvent){
        if(!this.state.inputLeft){
            e.preventDefault()
            e.stopPropagation()
            window.addEventListener('mousemove', this.mouseMoveLeft)
            // put the selected left dragging bar to the most front layer
            d3.selectAll('.selectThr').sort(()=>{
                if(d3.selectAll('.selectThr')['_groups'][0][0].id!='rectLeft'){
                    return 1
                }
                return -1
            })
        }
    }
    mouseMoveLeft(e: any){
        let { transformXLeft,zeroAxis,xScaleReverse } = this.state
        // the dragging range is restricted to [leftend,0] (in risk_dif space)
        transformXLeft += (Math.min(Math.max(e.clientX-this.offsetX,this.leftStart),zeroAxis) - this.xLeft)
        this.xLeft = Math.min(Math.max(e.clientX-this.offsetX,this.leftStart),zeroAxis)
        this.setState({ transformXLeft })
        this.props.onChangeRuleThreshold([xScaleReverse(transformXLeft),this.props.ruleThreshold[1]])
        // if button is up
        if(e.buttons==0){
            this.mouseUpLeft(e)
        }
    }
    mouseUpLeft(e: React.MouseEvent){
        e.preventDefault()
        e.stopPropagation()
        window.removeEventListener('mousemove', this.mouseMoveLeft)
    }
    
    inputLeft(e:any){
        let {inputLeft,xScale,zeroAxis,xScaleReverse} = this.state
        let {ruleThreshold} = this.props
        
        if(inputLeft==false){
            this.setState({inputLeft:true})
            this.mouseUpLeft
        }else{
            if(e.key=='Enter'){
                let leftValue = Math.max(Math.min(xScale(parseFloat(e.target.value)),zeroAxis),this.leftStart)
                this.setState({inputLeft:false})
                this.props.onChangeRuleThreshold([xScaleReverse(leftValue),ruleThreshold[1]])
                this.xLeft = leftValue
                this.setState({transformXLeft:this.xLeft})
                this.mouseDownLeft
            }else if(e.key=='q'){
                this.setState({inputLeft:false})
            }
        }
    }


    // right dragging
    mouseDownRight(e: React.MouseEvent){
        if(!this.state.inputRight){
            e.preventDefault()
            e.stopPropagation()
            window.addEventListener('mousemove', this.mouseMoveRight)

            // put the selected right dragging bar to the most front layer
            d3.selectAll('.selectThr').sort(()=>{
                if(d3.selectAll('.selectThr')['_groups'][0][0].id!='rectRight'){
                    return 1
                }
                return -1
            })
        }
        
    }
    mouseMoveRight(e: any){
        let {transformXRight,zeroAxis,xScaleReverse } = this.state
         // the dragging range is restricted to [0,rightend] (in risk_dif space)
        transformXRight += (Math.max(Math.min(e.clientX-this.offsetX,this.rightEnd),zeroAxis) - this.xRight)
        this.xRight = Math.max(Math.min(e.clientX-this.offsetX,this.rightEnd),zeroAxis)
        this.setState({ transformXRight })
        this.props.onChangeRuleThreshold([this.props.ruleThreshold[0],xScaleReverse(transformXRight)])
        // if button is up
        if(e.buttons==0){
            this.mouseUpRight(e)
        }
    }
    mouseUpRight(e: React.MouseEvent){
        e.preventDefault()
        e.stopPropagation()
        window.removeEventListener('mousemove', this.mouseMoveRight)
    }
    inputRight(e:any){
        let {inputRight,xScale,zeroAxis,xScaleReverse} = this.state
        let {ruleThreshold} = this.props
        if(inputRight==false){
            this.setState({inputRight:true})
            this.mouseUpRight
        }else{
            if(e.key=='Enter'){
                let rightValue = Math.min(Math.max(xScale(parseFloat(e.target.value)),zeroAxis),this.rightEnd)
                this.setState({inputRight:false})
                this.props.onChangeRuleThreshold([ruleThreshold[0],xScaleReverse(rightValue)])
                this.xRight = rightValue
                this.setState({transformXRight:this.xRight})
                this.mouseDownRight
            }else if(e.key=='q'){
                this.setState({inputRight:false})
            }
        }
    }
    
    ruleProcessing(allRules:Rule[],keyAttrs:string[]){
        /**
         * Processing rules by key attrs
         *  */ 
        let rules = filterRulesNoThreshold(allRules, keyAttrs)
        // console.info('filter rules', rules)
        let curveX:number[] = []
        let dataKeyAttr: curveData[] = []
        rules.forEach((rule,rule_i)=>{
            // if(!curveX.includes(rule['favorPD'])){
            //     curveX.push(rule['favorPD'])
            //     dataKeyAttr.push({x:rule['favorPD'],y:rule.items.length,z:0})
            // }else{
            //     dataKeyAttr[curveX.indexOf(rule['favorPD'])].y = rule.items.length
            // }
            curveX.push(rule['favorPD'])
                dataKeyAttr.push({x:rule['favorPD'],y:rule.items.length,z:0})
        })

        // sort sample points by risk_dif
        dataKeyAttr = dataKeyAttr.sort((a,b)=>{
            return a.x - b.x
        })

        // let xMax = dataKeyAttr[dataKeyAttr.length-1].x,
        // xMin = dataKeyAttr[0].x
        // down sampling to smooth curve
        let curveY:number[] = []
        curveX = []
        // let divideNum = this.props.divideNum
        // let step = (xMax-xMin)/divideNum
        // let stepCount = 0
        // let dataCount = 0
        // let dataKeyAttr_new:curveData[] = []
        dataKeyAttr.forEach((data,i)=>{
        // for(var j=0;j<divideNum;j++){
        //     let xLower = xMin + step*j,
        //     xHigher = Math.min(xMin + step*(j+1),xMax),
        //     startX = dataKeyAttr[dataCount].x
        //     while((dataKeyAttr[dataCount].x>=xLower)&&(dataKeyAttr[dataCount].x<=xHigher)&&(dataCount<dataKeyAttr.length-1))
        //     {   
        //         stepCount += dataKeyAttr[dataCount].y
        //         if(dataCount<dataKeyAttr.length-1){dataCount += 1}
        //     }
        //     let data:curveData={x:startX,y:stepCount,z:0}
        //     stepCount = 0
        //     dataKeyAttr_new.push(data)
            curveY.push(data.y)
            curveX.push(data.x)
        })
        return {data:dataKeyAttr,x:curveX,y:curveY}
    }

    drawArea(){
        let {ruleThreshold, allRules,compAllRules, keyAttrs, xScaleMax} = this.props
        let {inputLeft, inputRight} = this.state
        
        let dataPro = this.ruleProcessing(allRules,keyAttrs),
        compDataPro = null, compDataKeyAttr = null,compCurveX = null,compCurveY = null
        if(compAllRules){
            compDataPro = this.ruleProcessing(compAllRules,keyAttrs)
            compDataKeyAttr = compDataPro.data
            compCurveX = compDataPro.x
            compCurveY = compDataPro.y
        }
        
        let dataKeyAttr = dataPro.data, curveX:number[] = dataPro.x, curveY = dataPro.y
        
        let xMax = Math.max(Math.max.apply(null,curveX.map(Math.abs)),compCurveX?Math.max.apply(null,compCurveX.map(Math.abs)):0),
            yMax = Math.max(Math.max(...curveY),Math.max(...compCurveY))
        /**
         * Draw area
         * */ 
        // some parameters for drawing
        // bottom end position
        let bottomEnd = this.bottomEnd;
        // left start postition
        let leftStart = this.leftStart;
        // right end position
        let rightEnd = this.rightEnd
        // top start position 
        let topStart = this.topStart
        // line's color
        let lineColor = this.lineColor;
        // color of unselected area (BAD_COLOR is the color of selected area)
        // let areaColor = this.areaColor


        // define scales
        let maxAbsoluteX = xScaleMax==-1?(dataKeyAttr.length>0?xMax:0.5):xScaleMax
        // xScale maps risk_dif to actual svg pixel length along x-axis
        let xScale = d3.scaleLinear().domain([-maxAbsoluteX,maxAbsoluteX]).range([leftStart,rightEnd])
        // yScale maps risk_dif to actual svg pixel length along x-axis
        let yScale = d3.scaleLinear().domain([0,yMax]).range([0,-bottomEnd+topStart])
        // xScaleReverse maps actual svg pixel length to risk_dif, reserve of xScale
        let xScaleReverse = d3.scaleLinear().domain([leftStart,rightEnd]).range([-maxAbsoluteX,maxAbsoluteX])
        // area of rules filtered by key_attrs
        let curveKeyAttrs = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>bottomEnd).y0(d=>bottomEnd+yScale(d.y)).curve(d3.curveMonotoneX)
        // curve
        let curve = d3.line<curveData>().x(d=>d.x).y(d=>d.y)

        this.yScale = yScale
        this.yMax = yMax
        // initialization state
        let leftInit = Math.max(xScale(ruleThreshold[0]),leftStart)
        let rightInit = Math.min(xScale(ruleThreshold[1]),rightEnd)
        if(this.state.transformXLeft==null){this.initTransformX(leftInit,rightInit,xScale(0),xScale,xScaleReverse)}
        if(xScaleMax!=this.state.xScaleMax){this.update(xScale,xScaleReverse)}
        // select rule filtering thresholds
        let selectThr = () =>{

            //let xMin = xScale(Math.min(...rangeX))
            //let xMax = xScale(Math.max(...rangeX))
            // let startYLeft = 0.65*topStart -12,startYRight = 0.65*topStart
            let startYLeft = bottomEnd-2 ,startYRight = bottomEnd-2
            let bounderLeft:curveData[] = [{x:0.5,y:startYLeft,z:0},{x:0.5,y:bottomEnd,z:0}]
            let bounderRight:curveData[] = [{x:0.5,y:startYRight,z:0},{x:0.5,y:bottomEnd,z:0}]
            // let selectMask:curveData[] = [{x:0.5,y:markSize/2,z:0},{x:0.5,y:bottomEnd,z:0}]

            let rightArrow = `M 0,${startYRight - 12} h 24 l 6,6 l -6,6 h -24 v -12 `
            let leftArrow = `M 0,${startYLeft - 12} h -24 l -6,6 l 6,6 h 24 v -12 `
            return <g>
                 <g id={'rectLeft'} className={'selectThr'}
                 transform={`translate(${this.state.transformXLeft}, 0)`}>
                        {/* <rect rx={2} x={-12} y={startY - 12} width={24} height={12} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}}/> */}
                        
                        <g onMouseDown={this.mouseDownLeft}  cursor='e-resize'>
                            <path d={leftArrow} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}}/>
                            <path d={leftArrow} style={{fill:'transparent'}}/>
                            <path d={curve(bounderLeft)} style={{fill:'none',stroke:lineColor,strokeWidth:'1.5px'}}/>
                        </g>
                        
                        {inputLeft?
                        <foreignObject width={24} height={this.fontSize*1.5} fontSize={this.fontSize} x={-24} y={startYLeft - 14} className='inoutBoxLeft'>
                            <input type='number' 
                            // defaultValue={this.props.ruleThreshold[0].toFixed(2)}
                            autoFocus={true} onKeyPress={this.inputLeft} id='inputBoxLeft'/>
                        </foreignObject>
                        :
                        <text x={-24} y={startYLeft - 3} className={'rect_text'} fontSize={this.fontSize} onClick={this.inputLeft} cursor='text'>
                            {xScaleReverse(this.state.transformXLeft).toFixed(2)}
                        </text>
                        }
                    </g>
                
                <g id={'rectRight'} className={'selectThr'} 
                 transform={`translate(${this.state.transformXRight}, 0)`} >
                        {/* <rect rx={2} x={-12} y={startY - 12} width={24} height={12} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}} z-index={-100}/> */}
                        <g onMouseDown={this.mouseDownRight} cursor={'e-resize'}>
                            <path d={rightArrow} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}}/>
                            <path d={rightArrow} style={{fill:'transparent'}}/>
                            <path d={curve(bounderRight)} style={{fill:'none',stroke:lineColor,strokeWidth:'1.5px'}}/>
                        </g>
                        {inputRight?
                        <foreignObject width={24} height={this.fontSize*1.5} fontSize={this.fontSize} x={0} y={startYRight - 14} className='inputBoxRight'>
                            <input type='number' 
                            defaultValue={this.props.ruleThreshold[1].toFixed(2)}
                            autoFocus={true} onKeyPress={this.inputRight} id='inputBoxRight'/>
                        </foreignObject>
                        :
                        <text x={2} y={startYRight - 3} className={'rect_text'} fontSize={this.fontSize} onClick={this.inputRight} cursor='text'>
                            {xScaleReverse(this.state.transformXRight).toFixed(2)}
                        </text>
                        }
                    </g>
                    
                </g>
        }
        return <g>
                <g>
                    <clipPath id={'overview_path'}>
                        <path d={curveKeyAttrs(dataKeyAttr)} style={{fill:lineColor}} className='overview'/>
                    </clipPath>
                    <rect id='middle' width={this.state.transformXRight-this.state.transformXLeft} height={bottomEnd-topStart} x={this.state.transformXLeft} y={topStart} fill={'#bbb'} clipPath={'url(#overview_path)'}/>
                    <rect id='right' width={rightEnd - this.state.transformXRight} height={bottomEnd-topStart} x={this.state.transformXRight} y={topStart} fill={BAD_COLOR} clipPath={'url(#overview_path)'}/>
                    <rect id='left' width={this.state.transformXLeft-leftStart} height={bottomEnd-topStart} x={leftStart} y={topStart} fill={BAD_COLOR} clipPath={'url(#overview_path)'}/>
                </g>
                {compDataKeyAttr?<g>
                    <clipPath id={'comp_middle'}>
                        <rect id='middle' width={this.state.transformXRight-this.state.transformXLeft} height={bottomEnd-topStart} x={this.state.transformXLeft} y={topStart} fill={'#999'} clipPath={'url(#comp_overview_path)'}/>
                    </clipPath>
                    <clipPath id={'comp_side'}>
                    <rect id='right' width={rightEnd - this.state.transformXRight} height={bottomEnd-topStart} x={this.state.transformXRight} y={topStart} fill={BAD_COLOR} stroke='black' clipPath={'url(#comp_overview_path)'}/>
                    <rect id='left' width={this.state.transformXLeft-leftStart} height={bottomEnd-topStart} x={leftStart} y={topStart} fill={GOOD_COLOR} />
                    </clipPath>
                    <path d={curveKeyAttrs(compDataKeyAttr)} style={{fill:'none',stroke:'#999',strokeWidth:1}} className='overview' clipPath='url(#comp_middle)'/>
                    <path d={curveKeyAttrs(compDataKeyAttr)} style={{fill:'none',stroke:GOOD_COLOR,strokeWidth:1}} className='overview' clipPath='url(#comp_side)'/>
                    </g>:null}
                {selectThr()}
            </g>
    
    }
    drawScatter(){
        let {ruleThreshold, allRules,compAllRules, keyAttrs, xScaleMax} = this.props
        let {inputLeft, inputRight} = this.state
        
        let dataPro = this.ruleProcessing(allRules,keyAttrs),
        compDataPro = null, compDataKeyAttr = null,compCurveX = null,compCurveY = null
        if(compAllRules){
            compDataPro = this.ruleProcessing(compAllRules,keyAttrs)
            compDataKeyAttr = compDataPro.data
            compCurveX = compDataPro.x
            compCurveY = compDataPro.y
        }
        
        let dataKeyAttr = dataPro.data, curveX:number[] = dataPro.x, curveY = dataPro.y
        
        let xMax = Math.max(Math.max.apply(null,curveX.map(Math.abs)),compCurveX?Math.max.apply(null,compCurveX.map(Math.abs)):0),
            yMax = Math.max(Math.max(...curveY),Math.max(...compCurveY))
        
        /**
         * Draw scatter plot
         * */ 
        // some parameters for drawing
        // bottom end position
        let bottomEnd = this.bottomEnd;
        // left start postition
        let leftStart = this.leftStart;
        // right end position
        let rightEnd = this.rightEnd
        // top start position 
        let topStart = this.topStart
        // line's color
        let lineColor = this.lineColor;
        
        // define scales
        let maxAbsoluteX = xScaleMax==-1?(dataKeyAttr.length>0?xMax:0.5):xScaleMax
        // xScale maps risk_dif to actual svg pixel length along x-axis
        let xScale = d3.scaleLinear().domain([-maxAbsoluteX,maxAbsoluteX]).range([leftStart,rightEnd])
        // yScale maps risk_dif to actual svg pixel length along x-axis
        let yScale = d3.scaleLinear().domain([0,yMax]).range([0,-bottomEnd+topStart])
        // xScaleReverse maps actual svg pixel length to risk_dif, reserve of xScale
        let xScaleReverse = d3.scaleLinear().domain([leftStart,rightEnd]).range([-maxAbsoluteX,maxAbsoluteX])
        // area of rules filtered by key_attrs
        // let curveKeyAttrs = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>bottomEnd).y0(d=>bottomEnd+yScale(d.y)).curve(d3.curveMonotoneX)
        // curve
        let curve = d3.line<curveData>().x(d=>d.x).y(d=>d.y)

        this.yScale = yScale
        this.yMax = yMax
        // initialization state
        let leftInit = Math.max(xScale(ruleThreshold[0]),leftStart)
        let rightInit = Math.min(xScale(ruleThreshold[1]),rightEnd)
        if(this.state.transformXLeft==null){this.initTransformX(leftInit,rightInit,xScale(0),xScale,xScaleReverse)}
        if(xScaleMax!=this.state.xScaleMax){this.update(xScale,xScaleReverse)}
        // select rule filtering thresholds
        let selectThr = () =>{

            //let xMin = xScale(Math.min(...rangeX))
            //let xMax = xScale(Math.max(...rangeX))
            // let startYLeft = 0.65*topStart -12,startYRight = 0.65*topStart
            let startYLeft = bottomEnd+14 ,startYRight = bottomEnd+14
            let bounderLeft:curveData[] = [{x:0.5,y:startYLeft,z:0},{x:0.5,y:bottomEnd+3,z:0}]
            let bounderRight:curveData[] = [{x:0.5,y:startYRight,z:0},{x:0.5,y:bottomEnd+3,z:0}]
            // let selectMask:curveData[] = [{x:0.5,y:markSize/2,z:0},{x:0.5,y:bottomEnd,z:0}]

            let rightArrow = `M 0,${startYRight - 11} h ${this.fontSize*2.5} l ${this.fontSize*0.75}, ${this.fontSize*0.55} l ${-this.fontSize*0.75}, ${this.fontSize*0.55} h ${-this.fontSize*2.5} v ${-this.fontSize*1.1} `
            let leftArrow = `M 0,${startYRight - 11} h ${-this.fontSize*2.5} l ${-this.fontSize*0.75}, ${this.fontSize*0.55} l ${this.fontSize*0.75}, ${this.fontSize*0.55} h ${this.fontSize*2.5} v ${-this.fontSize*1.1} `
            
            // let leftArrow = `M 0,${startYLeft - 12} h -24 l -6,6 l 6,6 h 24 v -12 `
            return <g>
                 <g id={'rectLeft'} className={'selectThr'}
                 transform={`translate(${this.state.transformXLeft}, 0)`}>
                        {/* <rect rx={2} x={-12} y={startY - 12} width={24} height={12} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}}/> */}
                        
                        <g onMouseDown={this.mouseDownLeft}  cursor='e-resize'>
                            <path d={leftArrow} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}}/>
                            <path d={leftArrow} style={{fill:'transparent'}}/>
                            <path d={curve(bounderLeft)} style={{fill:'none',stroke:'#999',strokeWidth:'1.5px'}}/>
                        </g>
                        
                        {inputLeft?
                        <foreignObject width={this.fontSize*3.5} height={this.fontSize*1.5} fontSize={this.fontSize} x={-this.fontSize*3} y={startYLeft - 14} className='inoutBoxLeft'>
                            <input type='number' 
                            defaultValue={this.props.ruleThreshold[0].toFixed(2)}
                            autoFocus={true} onKeyPress={this.inputLeft} id='inputBoxLeft'/>
                        </foreignObject>
                        :
                        <text y={startYLeft} x={-2} className={'rect_text'} fontSize={this.fontSize} onClick={this.inputLeft} cursor='text' textAnchor='end'>
                            {xScaleReverse(this.state.transformXLeft).toFixed(2)}
                        </text>
                        }
                    </g>
                
                <g id={'rectRight'} className={'selectThr'} 
                 transform={`translate(${this.state.transformXRight}, 0)`} >
                        {/* <rect rx={2} x={-12} y={startY - 12} width={24} height={12} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}} z-index={-100}/> */}
                        <g onMouseDown={this.mouseDownRight} cursor={'e-resize'}>
                            <path d={rightArrow} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}}/>
                            <path d={rightArrow} style={{fill:'transparent'}}/>
                            <path d={curve(bounderRight)} style={{fill:'none',stroke:'#999',strokeWidth:'1.5px'}}/>
                        </g>
                        {inputRight?
                        <foreignObject width={24} height={this.fontSize*1.5} fontSize={this.fontSize} x={0} y={startYRight - 14} className='inputBoxRight'>
                            <input type='number' 
                            defaultValue={this.props.ruleThreshold[1].toFixed(2)}
                            autoFocus={true} onKeyPress={this.inputRight} id='inputBoxRight'/>
                        </foreignObject>
                        :
                        <text x={2} y={startYRight} className={'rect_text'} fontSize={this.fontSize} onClick={this.inputRight} cursor='text'>
                            {xScaleReverse(this.state.transformXRight).toFixed(2)}
                        </text>
                        }
                    </g>
                    
                </g>
        }
        return <g>
                <g>
                    {dataKeyAttr.map((data,i)=>{
                            let color = '#bbb'
                            let opacity = 0.3
                            if(data.x<xScaleReverse(this.state.transformXLeft)){
                                opacity = 1
                                color = this.negColor
                            }else if((data.x>xScaleReverse(this.state.transformXRight))){
                                opacity = 1
                                color = this.posColor
                            }
                            return <circle cx={xScale(data.x)} cy={bottomEnd+yScale(data.y)} r={3} 
                            style={{fill:'white',opacity:opacity,stroke:color,strokeWidth:2}} className='overview'>
                            <title>{`[${data.x.toFixed(2)}, ${data.y}]`}</title>
                            </circle>
                        })}
                </g>
                {compDataKeyAttr?<g>
                    {compDataKeyAttr.map((data,i)=>{
                            let color = '#bbb'
                            let opacity = 0.3
                            if(data.x<xScaleReverse(this.state.transformXLeft)){
                                opacity = 1
                                color = this.negColor
                            }else if((data.x>xScaleReverse(this.state.transformXRight))){
                                opacity = 1
                                color = this.posColor
                            }
                            let centerX = xScale(data.x), centerY = bottomEnd+yScale(data.y), crossLength = 6
                            return <g>
                                <path d={`M${centerX+crossLength/2},${centerY-crossLength/2} l${-crossLength},${crossLength}`}style={{fill:'none',opacity:opacity,stroke:color,strokeWidth:1.5}} className='overview'></path>
                                <path d={`M${centerX-crossLength/2},${centerY-crossLength/2} l${crossLength},${crossLength}`}style={{fill:'none',opacity:opacity,stroke:color,strokeWidth:1.5}} className='overview'></path>
                               </g> 
                        })}
                </g>:null}
                {selectThr()}
            </g>

    }
    render(){
        return <g key={'overviewOut'} ref={this.ref} transform={`translate(${this.props.offset/5-this.leftStart/4*3},0)`} className='overview'>
                {this.drawScatter()}
        </g>
        // return <g>
        //     {this.ruleProcessing().dataKeyAttr.length>1?<g ref={this.ref}>
        //         {this.ruleProcessing().path}
        //     </g>:<text transform={`translate(0,${this.bottomEnd})`} fontSize={12}>Try different itemsets!</text>}
        // </g>
    }

    private renderAxis=()=>{
        if(this.state.xScale){
            let axis = d3.axisBottom(this.state.xScale).tickFormat(d3.format('.2f'))
            .tickValues(this.state.xScale.ticks(1).concat(this.state.xScale.domain()))

            d3.selectAll('.axis').remove()

            d3.select(this.ref.current)
            .append('g').attr('class','axis')
            .attr('id','axisOver')
            .attr('transform',`translate(0,${this.bottomEnd})`)
            .attr('stroke-width','1.5px').call(axis)
            .style('font-size', this.fontSize+'px')

            let axisLabel = d3.select('.axis')
                .append('g')
                .attr('class', 'axisName')
                .style('font-size', this.fontSize+'px')

            axisLabel.append('text')
            .attr('x', this.rightEnd - this.leftStart*1.5)
            .attr('y', 39)
            .text(`favor ${this.props.protectedVal}`)
            .style('fill', 'gray')

            axisLabel.append('text')
            .attr('x', 0)
            .attr('y', 39)
            .text(`against ${this.props.protectedVal}`)
            .style('fill', 'gray')
            .style('text-anchor', 'start')

            d3.selectAll('#axisOver .tick text').attr('transform','translate(0,9)')

            d3.selectAll('.axisSelectionY').remove()

            let yAxis = d3.axisRight(this.yScale)
            .tickValues([this.yMax])
            

            d3.select(this.ref.current).append('g').attr('class','axisSelectionY').attr('id','axisY').attr('transform',`translate(${(this.rightEnd+this.leftStart)/2},${this.bottomEnd})`)
            .attr('stroke-width','1.5px').call(yAxis)

            d3.selectAll('#axisY .tick text')
            .attr('transform',`translate(-15, ${-this.fontSize})`)
            .style('font-size', this.fontSize+'px')
            
            d3.selectAll('#axisY .tick line').attr('x2','12').attr('transform','translate(-6,0)')
        }
    }
}