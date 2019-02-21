import * as React from 'react';
import "./Overview.css"
import * as d3 from 'd3'
import {curveData} from 'components/AppMiddle/Attributes'
import {Rule} from 'types';
import {BAD_COLOR, filterRulesNoThreshold} from 'Helpers'

export interface Props{
    allRules: Rule[],
    keyAttrs: string[],
    ruleThreshold: number[],
    onChangeRuleThreshold : (ruleThreshold:[number, number])=>void
}
export interface State{
    transformXLeft: number,
    transformXRight: number,
    zeroAxis: number,
    xScaleReverse: d3.ScaleLinear<number, number>
}
export interface rules{
    rule: string[],
    risk_dif: number
}

export default class Overview extends React.Component<Props,State>{
    // left start position of svg elements
    public leftStart = 20 ; 
    // right end position
    rightEnd = window.innerWidth * 0.1; 
    // bottom end position
    bottomEnd = 120; 
    // top start position 
    topStart = 40 ;
    // a standard reference length
    markSize = 14; 
    // line's color
    lineColor = 'rgb(204, 204, 204)';
    // color of unselected area (BAD_COLOR is the color of selected area)
    areaColor = 'rgb(232, 232, 232)'
    // counters for dragging
    xLeft = this.leftStart; xRight = this.rightEnd
    private ref: React.RefObject<SVGGElement>;
    constructor(props:Props){
        super(props)
        this.ref = React.createRef()
        this.state={
            transformXLeft: null,
            transformXRight: null,
            zeroAxis:null,
            xScaleReverse:null,
        }
        this.mouseDownLeft = this.mouseDownLeft.bind(this)
        this.mouseMoveLeft = this.mouseMoveLeft.bind(this)
        this.mouseUpLeft = this.mouseUpLeft.bind(this)
        this.mouseDownRight = this.mouseDownRight.bind(this)
        this.mouseMoveRight = this.mouseMoveRight.bind(this)
        this.mouseUpRight = this.mouseUpRight.bind(this)
        this.initTransformX = this.initTransformX.bind(this)
    }
    public componentDidMount() { 
        this.renderAxis();
    }
    
    public componentDidUpdate() {
        this.renderAxis();
    }

    initTransformX(transformXLeft:number,transformXRight:number,zeroAxis:number,xScaleReverse:d3.ScaleLinear<number, number>){
        this.setState({transformXLeft,transformXRight,zeroAxis,xScaleReverse})
    }

    // update state
    update(xScaleReverse:d3.ScaleLinear<number, number>,zeroAxis:number){
        this.setState({xScaleReverse})
        this.setState({zeroAxis})
    }

    // left dragging
    mouseDownLeft(e: React.MouseEvent){
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
    mouseMoveLeft(e: any){
        let { transformXLeft,zeroAxis,xScaleReverse } = this.state
        // the dragging range is restricted to [leftend,0] (in risk_dif space)
        transformXLeft += (Math.min(Math.max(e.clientX,this.leftStart),zeroAxis) - this.xLeft)
        this.xLeft = Math.min(Math.max(e.clientX,this.leftStart),zeroAxis)
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

    // right dragging
    mouseDownRight(e: React.MouseEvent){
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
    mouseMoveRight(e: any){
        let {transformXRight,zeroAxis,xScaleReverse } = this.state
         // the dragging range is restricted to [0,rightend] (in risk_dif space)
        transformXRight += (Math.max(Math.min(e.clientX,this.rightEnd),zeroAxis) - this.xRight)
        this.xRight = Math.max(Math.min(e.clientX,this.rightEnd),zeroAxis)
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
    ruleProcessing(){
        let {allRules,keyAttrs} = this.props
        
        let curveX:number[] = []
        let dataKeyAttr: curveData[] = []
        //let dataKeyAttr: curveData[] = []
        let rules = filterRulesNoThreshold(allRules, keyAttrs)
        rules.forEach((rule,rule_i)=>{
            if(!curveX.includes(rule['favorPD'])){
                curveX.push(rule['favorPD'])
                dataKeyAttr.push({x:rule['favorPD'],y:rule['sup_pnd'],z:0})
            }else{
                dataKeyAttr[curveX.indexOf(rule['favorPD'])].y += rule['sup_pnd']
            }
        })
        console.info(allRules, keyAttrs, rules, dataKeyAttr)

        let curveY:number[] = []
        curveX = []
        let step = Math.ceil(dataKeyAttr.length / 5)
        // console.log(dataKeyAttr.length,step)
        let stepCount = 0
        let dataKeyAttr_new:curveData[] = []
        dataKeyAttr.forEach((data,i)=>{
            stepCount += data.y
            if(((i%step==0))||(i==dataKeyAttr.length-1)){
                data.y = stepCount
                stepCount = 0
                dataKeyAttr_new.push(data)
                curveY.push(data.y)
                curveX.push(data.x)
            }
        })

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
        // a standard reference length
        let markSize = this.markSize;
        // top start position 
        let topStart = this.topStart
        // line's color
        let lineColor = this.lineColor;
        // color of unselected area (BAD_COLOR is the color of selected area)
        let areaColor = this.areaColor


        // define scales
        let maxAbsoluteX = Math.max.apply(null,curveX.map(Math.abs))
        // xScale maps risk_dif to actual svg pixel length along x-axis
        let xScale = d3.scaleLinear().domain([-maxAbsoluteX,maxAbsoluteX]).range([leftStart,window.innerWidth*0.1])
        // yScale maps risk_dif to actual svg pixel length along x-axis
        let yScale = d3.scaleLinear().domain([Math.min(...curveY),Math.max(...curveY)]).range([0,bottomEnd-topStart])
        // xScaleReverse maps actual svg pixel length to risk_dif, reserve of xScale
        let xScaleReverse = d3.scaleLinear().domain([leftStart,window.innerWidth*0.1]).range([-maxAbsoluteX,maxAbsoluteX])
        // area of rules filtered by key_attrs
        let curveKeyAttrs = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>bottomEnd).y0(d=>bottomEnd-yScale(d.y)).curve(d3.curveMonotoneX)
        // curve
        let curve = d3.line<curveData>().x(d=>d.x).y(d=>d.y)


        // initialization state
        if(this.state.transformXLeft==null){this.initTransformX(leftStart,rightEnd,xScale(0),xScaleReverse)}

        // select rule filtering thresholds
        let selectThr = () =>{

            //let xMin = xScale(Math.min(...rangeX))
            //let xMax = xScale(Math.max(...rangeX))
            
            let bounderLeft:curveData[] = [{x:0.5,y:0.9*topStart,z:0},{x:0.5,y:bottomEnd,z:0}]
            let bounderRight:curveData[] = [{x:0.5,y:0.9*topStart,z:0},{x:0.5,y:bottomEnd,z:0}]
            let selectMask:curveData[] = [{x:0.5,y:markSize/2,z:0},{x:0.5,y:bottomEnd,z:0}]
            return <g  cursor='e-resize' >
                 <g id={'rectLeft'} className={'selectThr'} onMouseDown={this.mouseDownLeft}
                 transform={`translate(${this.state.transformXLeft}, 0)`}>
                        <rect rx={2} x={-12} y={0.9*topStart - 12} width={24} height={12} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}}/>
                        <text x={-10} y={0.9*topStart - 3} fontSize={9}>
                            {xScaleReverse(this.state.transformXLeft).toFixed(2)}
                        </text>
                        <path d={curve(selectMask)} style={{stroke:'transparent',strokeWidth:markSize}}/>
                        <path d={curve(bounderLeft)} style={{fill:'none',stroke:lineColor,strokeWidth:'1.5px'}}/>
                    </g>
                
                <g id={'rectRight'} className={'selectThr'} onMouseDown={this.mouseDownRight}
                 transform={`translate(${this.state.transformXRight}, 0)`} >
                        <rect rx={2} x={-12} y={0.9*topStart - 12} width={24} height={12} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}} z-index={-100}/>
                        <text x={-10} y={0.9*topStart - 3} className={'rect_text'} fontSize={9}>
                            {xScaleReverse(this.state.transformXRight).toFixed(2)}
                        </text>
                        <path d={curve(selectMask)} style={{stroke:'transparent',strokeWidth:markSize}}/>
                        <path d={curve(bounderRight)} style={{fill:'none',stroke:lineColor,strokeWidth:'1.5px'}}/>
                    </g>
                    
                </g>
        }
        return {path:<g>
                <clipPath id={'overview_path'}>
                    <path d={curveKeyAttrs(dataKeyAttr_new)} style={{fill:lineColor}} className='overview'/>
                </clipPath>
                <rect id='middle' width={this.state.transformXRight-this.state.transformXLeft} height={bottomEnd-topStart} x={this.state.transformXLeft} y={topStart} fill={areaColor} clipPath={'url(#overview_path)'}/>
                <rect id='right' width={rightEnd - this.state.transformXRight} height={bottomEnd-topStart} x={this.state.transformXRight} y={topStart} fill={BAD_COLOR} clipPath={'url(#overview_path)'}/>
                <rect id='left' width={this.state.transformXLeft-leftStart} height={bottomEnd-topStart} x={leftStart} y={topStart} fill={BAD_COLOR} clipPath={'url(#overview_path)'}/>
                {selectThr()}
            </g>,
            scale:xScale,
            dataKeyAttr:dataKeyAttr_new}
    
    }
    render(){
        //let curveKeyAttrs = d3.line<curveData>().x(d=>d.x).y(d=>d.z)
        return <g ref={this.ref}>
            {this.ruleProcessing().path}
        </g>
        // return <g>
        //     {this.ruleProcessing().dataKeyAttr.length>1?<g ref={this.ref}>
        //         {this.ruleProcessing().path}
        //     </g>:<text transform={`translate(0,${this.bottomEnd})`} fontSize={12}>Try different itemsets!</text>}
        // </g>
    }

    private renderAxis=()=>{
        let axis = d3.axisBottom(this.ruleProcessing().scale).tickFormat(d3.format('.2f'))
        .tickValues(this.ruleProcessing().scale.ticks(1).concat(this.ruleProcessing().scale.domain()))
        d3.selectAll('.axis').remove()
        d3.select(this.ref.current).append('g').attr('class','axis').attr('transform',`translate(0,${this.bottomEnd})`)
        .attr('stroke-width','1.5px').call(axis)
    }
}