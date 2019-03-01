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
    protectedVal: string,
    xScaleMax: number,
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
    rightEnd = window.innerWidth * 0.1; 
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
    areaColor = 'rgb(232, 232, 232)'
    // counters for dragging
    xLeft = 0; 
    xRight = 0;
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
    ruleProcessing(){
        let {ruleThreshold, allRules,keyAttrs, xScaleMax} = this.props
        let {inputLeft, inputRight} = this.state
        /**
         * Processing rules by key attrs
         *  */ 
        let rules = filterRulesNoThreshold(allRules, keyAttrs)
        // console.info('filter rules', rules)
        let curveX:number[] = []
        let dataKeyAttr: curveData[] = []
        rules.forEach((rule,rule_i)=>{
            if(!curveX.includes(rule['favorPD'])){
                curveX.push(rule['favorPD'])
                dataKeyAttr.push({x:rule['favorPD'],y:rule['sup_pnd'],z:0})
            }else{
                dataKeyAttr[curveX.indexOf(rule['favorPD'])].y += rule['sup_pnd']
            }
        })

        // console.info(curveX, dataKeyAttr)

        let curveY:number[] = []
        curveX = []
        let step = Math.ceil(dataKeyAttr.length / 5)
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
        let maxAbsoluteX = xScaleMax==-1?(rules.length>0?Math.max.apply(null,curveX.map(Math.abs)):0.5):xScaleMax
        // xScale maps risk_dif to actual svg pixel length along x-axis
        let xScale = d3.scaleLinear().domain([-maxAbsoluteX,maxAbsoluteX]).range([leftStart,window.innerWidth*0.1])
        // yScale maps risk_dif to actual svg pixel length along x-axis
        let yScale = d3.scaleLinear().domain([0,Math.max(...curveY)]).range([0,bottomEnd-topStart])
        // xScaleReverse maps actual svg pixel length to risk_dif, reserve of xScale
        let xScaleReverse = d3.scaleLinear().domain([leftStart,window.innerWidth*0.1]).range([-maxAbsoluteX,maxAbsoluteX])
        // area of rules filtered by key_attrs
        let curveKeyAttrs = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>bottomEnd).y0(d=>bottomEnd-yScale(d.y)).curve(d3.curveMonotoneX)
        // curve
        let curve = d3.line<curveData>().x(d=>d.x).y(d=>d.y)


        // initialization state
        let leftInit = Math.max(xScale(ruleThreshold[0]),leftStart)
        let rightInit = Math.min(xScale(ruleThreshold[1]),rightEnd)
        if(this.state.transformXLeft==null){this.initTransformX(leftInit,rightInit,xScale(0),xScale,xScaleReverse)}
        if(xScaleMax!=this.state.xScaleMax){this.update(xScale,xScaleReverse)}
        // select rule filtering thresholds
        let selectThr = () =>{

            //let xMin = xScale(Math.min(...rangeX))
            //let xMax = xScale(Math.max(...rangeX))
            
            let bounderLeft:curveData[] = [{x:0.5,y:0.9*topStart,z:0},{x:0.5,y:bottomEnd,z:0}]
            let bounderRight:curveData[] = [{x:0.5,y:0.9*topStart,z:0},{x:0.5,y:bottomEnd,z:0}]
            let selectMask:curveData[] = [{x:0.5,y:markSize/2,z:0},{x:0.5,y:bottomEnd,z:0}]

            return <g  cursor='e-resize'>
                 <g id={'rectLeft'} className={'selectThr'} onMouseDown={this.mouseDownLeft}
                 transform={`translate(${this.state.transformXLeft}, 0)`}>
                        <rect rx={2} x={-12} y={0.9*topStart - 12} width={24} height={12} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}}/>
                        <path d={curve(selectMask)} style={{stroke:'transparent',strokeWidth:markSize}}/>
                        <path d={curve(bounderLeft)} style={{fill:'none',stroke:lineColor,strokeWidth:'1.5px'}}/>
                        {inputLeft?
                        <foreignObject width={24} height={12} fontSize={9} x={-12} y={0.9*topStart - 12} className='inoutBoxLeft'>
                            <input type='number' 
                            defaultValue={this.props.ruleThreshold[1].toFixed(2)}
                            autoFocus={true} onKeyPress={this.inputLeft} id='inputBoxLeft'/>
                        </foreignObject>
                        :
                        <text x={-10} y={0.9*topStart - 3} className={'rect_text'} fontSize={9} onClick={this.inputLeft} cursor='text'>
                            {xScaleReverse(this.state.transformXLeft).toFixed(2)}
                        </text>
                        }
                    </g>
                
                <g id={'rectRight'} className={'selectThr'} onMouseDown={this.mouseDownRight}
                 transform={`translate(${this.state.transformXRight}, 0)`} >
                        <rect rx={2} x={-12} y={0.9*topStart - 12} width={24} height={12} style={{fill:'white', stroke:lineColor, strokeWidth:1.5}} z-index={-100}/>
                        <path d={curve(selectMask)} style={{stroke:'transparent',strokeWidth:markSize}}/>
                        <path d={curve(bounderRight)} style={{fill:'none',stroke:lineColor,strokeWidth:'1.5px'}}/>
                        {inputRight?
                        <foreignObject width={24} height={12} fontSize={9} x={-12} y={0.9*topStart - 12} className='inputBoxRight'>
                            <input type='number' 
                            defaultValue={this.props.ruleThreshold[1].toFixed(2)}
                            autoFocus={true} onKeyPress={this.inputRight} id='inputBoxRight'/>
                        </foreignObject>
                        :
                        <text x={-10} y={0.9*topStart - 3} className={'rect_text'} fontSize={9} onClick={this.inputRight} cursor='text'>
                            {xScaleReverse(this.state.transformXRight).toFixed(2)}
                        </text>
                        }
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
        return <g key={'overviewOut'} ref={this.ref}>
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

        let axisLabel = d3.select('.axis')
            .append('g')
            .attr('class', 'axisName')

        axisLabel.append('text')
        .attr('x', window.innerWidth*0.1)
        .attr('y', 30)
        .text(`against ${this.props.protectedVal}`)
        .style('fill', 'gray')

        axisLabel.append('text')
        .attr('x', 0)
        .attr('y', 30)
        .text(`favor ${this.props.protectedVal}`)
        .style('fill', 'gray')
        .style('text-anchor', 'start')
    }
}