import * as React from 'react';
import "./Overview.css"
import * as d3 from 'd3'
import {curveData} from 'components/AppMiddle/Attributes'
import {Rule} from 'types';

export interface Props{
    rules: Rule[],
    key_attrs:string[],
    thr_rules: number[],
    drag_status: boolean,
    onChange : (thr_rules:[number, number])=>void
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
    public leftStart = 20 ; rightEnd = window.innerWidth * 0.1; xLeft = this.leftStart; xRight = this.rightEnd
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
        this.setState({transformXLeft})
        this.setState({transformXRight})
        this.setState({zeroAxis})
        this.setState({xScaleReverse})
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
    }
    mouseMoveLeft(e: any){
        let { transformXLeft,zeroAxis,xScaleReverse } = this.state
        // the dragging range is restricted to [leftend,0] (in risk_dif space)
        transformXLeft += (Math.min(Math.max(e.clientX,this.leftStart),zeroAxis) - this.xLeft)
        this.xLeft = Math.min(Math.max(e.clientX,this.leftStart),zeroAxis)
        this.setState({ transformXLeft })
        this.props.onChange([xScaleReverse(transformXLeft),this.props.thr_rules[1]])
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
    }
    mouseMoveRight(e: any){
        let {transformXRight,zeroAxis,xScaleReverse } = this.state
         // the dragging range is restricted to [0,rightend] (in risk_dif space)
        transformXRight += (Math.max(Math.min(e.clientX,this.rightEnd),zeroAxis) - this.xRight)
        this.xRight = Math.max(Math.min(e.clientX,this.rightEnd),zeroAxis)
        this.setState({ transformXRight })
        this.props.onChange([this.props.thr_rules[0],xScaleReverse(transformXRight)])
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
        let {rules,key_attrs,drag_status} = this.props
        //let {thr_rules} = this.state
        /**
         * Processing rules by key attrs
         *  */ 
        let rules_new:Rule[] = []
        rules.forEach((rule)=>{
                let rule_ante = rule.antecedent 
                
                //rules in array format. [[attribute, value],[attr2,value2],....]
                let rule_attrs: string[] = []
                for (var rule_attr in rule_ante){ 
                    let rule_out = rule_ante[rule_attr].split("=")
                    rule_attrs.push(rule_out[0])
                }
                
                let rule_counter = 0
                rule_attrs.forEach((rule_attr,i)=>{
                    if(key_attrs.includes(rule_attr)){
                        rule_counter += 1
                    }
                })
                // remove rules containing non-key attrs
                if((rule_counter>=key_attrs.length)&&(key_attrs.length>0)){
                    rules_new.push(rule)
                }
        })
        rules = rules_new
        let curveX:number[] = []
        let dataAllAttr: curveData[] = []
        //let dataKeyAttr: curveData[] = []
        rules.forEach((rule,rule_i)=>{
            if(!curveX.includes(rule['risk_dif'])){
                curveX.push(rule['risk_dif'])
                dataAllAttr.push({x:rule['risk_dif'],y:rule['sup_pnd'],z:0})
            }else{
                dataAllAttr[curveX.indexOf(rule['risk_dif'])].y += rule['sup_pnd']
            }
        })

        let curveY:number[] = []
        curveX = []
        let step = Math.ceil(dataAllAttr.length / 5)
        let stepCount = 0
        let dataAllAttr_new:curveData[] = []
        dataAllAttr.forEach((data,i)=>{
            stepCount += data.y
            if(((i%step==0))||(i==dataAllAttr.length-1)){
                data.y = stepCount
                stepCount = 0
                dataAllAttr_new.push(data)
                curveY.push(data.y)
                curveX.push(data.x)
            }
        })

        /**
         * Draw area
         * */ 
        // some parameters for drawing
        // bottom end position
        let bottomEnd = 120;
        // left start postition
        let leftStart = this.leftStart;
        // right end position
        let rightEnd = this.rightEnd
        // a standard reference length
        let markSize = 14;

        // define scales
        // xScale maps risk_dif to actual svg pixel length along x-axis
        let xScale = d3.scaleLinear().domain([Math.min(...curveX),Math.max(...curveX)]).range([leftStart,window.innerWidth*0.1])
        // yScale maps risk_dif to actual svg pixel length along x-axis
        let yScale = d3.scaleLinear().domain([Math.min(...curveY),Math.max(...curveY)]).range([0,bottomEnd-20])
        // xScaleReverse maps actual svg pixel length to risk_dif, reserve of xScale
        let xScaleReverse = d3.scaleLinear().domain([leftStart,window.innerWidth*0.1]).range([Math.min(...curveX),Math.max(...curveX)])
        // area of rules filtered by key_attrs
        let curveKeyAttrs = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>bottomEnd).y0(d=>bottomEnd-yScale(d.y)).curve(d3.curveMonotoneX)
        // curve
        let curve = d3.line<curveData>().x(d=>d.x).y(d=>d.y)

        
        // initialization state
        if(this.state.transformXLeft==null){this.initTransformX(leftStart,rightEnd,xScale(0),xScaleReverse)}

        // update xScaleReverse when dragging is going
        if(drag_status){this.update(xScaleReverse,xScale(0))}

        // select rule filtering thresholds
        let selectThr = () =>{

            //let xMin = xScale(Math.min(...rangeX))
            //let xMax = xScale(Math.max(...rangeX))
            
            let bounderLeft:curveData[] = [{x:0,y:markSize,z:0},{x:0,y:bottomEnd,z:0}]
            let bounderRight:curveData[] = [{x:0,y:markSize,z:0},{x:0,y:bottomEnd,z:0}]
            let triangleData:curveData[]=[{x:-markSize/2,y:markSize/2,z:0},{x:0,y:markSize,z:0},{x:markSize/2,y:markSize/2,z:0}]
            let selectMask:curveData[] = [{x:0,y:markSize/2,z:0},{x:0,y:bottomEnd,z:0}]

            return <g  cursor='e-resize'>
                 <g id={'triangleLeft'} onMouseDown={this.mouseDownLeft}
                 transform={`translate(${this.state.transformXLeft}, 0)`}>
                        <path d={curve(triangleData)} style={{fill:'#bbb'}} />
                        <path d={curve(selectMask)} style={{stroke:'transparent',strokeWidth:markSize}}/>
                        <path d={curve(bounderLeft)} style={{fill:'none',stroke:'#bbb',strokeWidth:'1px'}}/>
                    </g>
                
                <g id={'triangleRight'} onMouseDown={this.mouseDownRight}
                 transform={`translate(${this.state.transformXRight}, 0)`}>
                        <path d={curve(triangleData)} style={{fill:'#bbb'}}/>
                        <path d={curve(selectMask)} style={{stroke:'transparent',strokeWidth:markSize}}/>
                        <path d={curve(bounderRight)} style={{fill:'none',stroke:'#bbb',strokeWidth:'1px'}}/>
                    </g>
                    
                </g>
        }
        return {path:<g>
                <clipPath id={'overview_path'}>
                    <path d={curveKeyAttrs(dataAllAttr_new)} style={{fill:'#bbb'}} className='overview'/>
                </clipPath>
                <rect id='middle' width={this.state.transformXRight-this.state.transformXLeft} height={bottomEnd-markSize} x={this.state.transformXLeft} y={markSize} fill='#bbb' clipPath={'url(#overview_path)'}/>
                <rect id='right' width={rightEnd - this.state.transformXRight} height={bottomEnd-markSize} x={this.state.transformXRight} y={markSize} fill='pink' clipPath={'url(#overview_path)'}/>
                <rect id='left' width={this.state.transformXLeft-leftStart} height={bottomEnd-markSize} x={leftStart} y={markSize} fill='pink' clipPath={'url(#overview_path)'}/>
                {selectThr()}
            </g>,
            scale:xScale,
            dataAllAttr:dataAllAttr_new,curveX:curveX}
    
    }
    render(){
        //let curveKeyAttrs = d3.line<curveData>().x(d=>d.x).y(d=>d.z)
        return <g>
            {this.ruleProcessing().dataAllAttr.length>1?<g ref={this.ref}>
                {this.ruleProcessing().path}
            </g>:<text transform={'translate(0,120)'} font-size={12}>Try different itemsets!</text>}
        </g>
    }

    private renderAxis=()=>{
        let axis = d3.axisBottom(this.ruleProcessing().scale).tickFormat(d3.format('.2f'))
        .tickValues(this.ruleProcessing().scale.ticks(1).concat(this.ruleProcessing().scale.domain()))
        d3.selectAll('.axis').remove()
        d3.select(this.ref.current).append('g').attr('class','axis').attr('transform','translate(0,120)').call(axis)
    }
}