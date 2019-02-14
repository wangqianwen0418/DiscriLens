import * as React from 'react';
import "./Overview.css"
import * as d3 from 'd3'
import {curveData} from 'components/AppMiddle/Attributes'
import {Rule} from 'types';
import Draggable from 'react-draggable';
import {Icon} from 'antd'

export interface Props{
    rules: Rule[],
    key_attrs:string[],
    thr_rules: number[],
    onChange : (thr_rules:[number, number])=>void
}
export interface State{

}
export interface rules{
    rule: string[],
    risk_dif: number
}
export default class Overview extends React.Component<Props,State>{
    private ref: React.RefObject<SVGGElement>;
    constructor(props:Props){
        super(props)
        this.ref = React.createRef()
        this.state={
        }
        this.stopLeft = this.stopLeft.bind(this)
        this.stopRight = this.stopRight.bind(this)
    }
    public componentDidMount() { 
        this.renderAxis();
    }
    
    public componentDidUpdate() {
        this.renderAxis();
    }

    stopRight(x:any){
        this.props.onChange([this.props.thr_rules[0],x])
    }

    stopLeft(x:any){
        this.props.onChange([x,this.props.thr_rules[1]])
    }

    ruleProcessing(){
        let {rules,key_attrs} = this.props
        // process rules
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

        // draw area
        let xScale = d3.scaleLinear().domain([Math.min(...curveX),Math.max(...curveX)]).range([10,window.innerWidth*0.1])
        let yScale = d3.scaleLinear().domain([Math.min(...curveY),Math.max(...curveY)]).range([0,100])
        let curveAllAttrs = d3.area<curveData>().x(d=>xScale(d.x)).y1(d=>120).y0(d=>120-yScale(d.y)).curve(d3.curveMonotoneX)
        
        // select rule filtering thresholds
        let selectThr = () =>{
            let rangeX:number[] = curveX
            let xMin = xScale(Math.min(...rangeX))
            let xMax = xScale(Math.max(...rangeX))
            let curveBound = d3.line<curveData>().x(d=>d.x).y(d=>d.y)
            let bounderLeft:curveData[] = [{x:6.5,y:12,z:0},{x:6.5,y:115,z:0}]
            let bounderRight:curveData[] = [{x:6.5,y:12,z:0},{x:6.5,y:115,z:0}]

            let xScaleThr = d3.scaleLinear().domain([10 + 6.5,window.innerWidth*0.1 + 6.5]).range([Math.min(...curveX),Math.max(...curveX)])
            // the size of the arrow 
            let markSize = 14

            let stopRight = (e:any) =>{
                this.stopRight(xScaleThr(e.x))
            }

            let stopLeft = (e:any) =>{
                this.stopLeft(xScaleThr(e.x))
            }
            return <g transform={`translate(-6.5,0)`} cursor='pointer'>
                    <Draggable axis='x' key={'cursorLeft'}
                    bounds={{left:xMin,right:xMax,top:0,bottom:0}}
                    defaultPosition={{x:xMin,y:5}} 
                    grid={[0.1,0]}
                    onDrag={stopLeft}>
                    <g>
                        <foreignObject width={'1em'} height={'1em'}>
                            <Icon type='caret-down'/>
                        </foreignObject>
                        <path d={curveBound(bounderLeft)} style={{fill:'none',stroke:'#bbb',strokeWidth:'1px'}}/>
                    </g>
                </Draggable>
                
                <Draggable axis='x' key={'cursorRight'}
                    bounds={{left:xMin,right:xMax,top:0,bottom:0}}
                    defaultPosition={{x:xMax,y:5}} 
                    grid={[0.1,0]}
                    onDrag={stopRight}>
                    <g>
                        <foreignObject width={'1em'} height={'1em'} >
                            <Icon type='caret-down' style={{fontSize:markSize}} className={'curseRightIcon'}/>
                        </foreignObject>
                        <path d={curveBound(bounderRight)} style={{fill:'none',stroke:'#bbb',strokeWidth:'1px'}}/>
                    </g>
                    
                </Draggable>
                </g>
        }
        
        return {path:<g>
                {selectThr()}
                <path d={curveAllAttrs(dataAllAttr_new)} style={{fill:'#bbb'}}/>
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
        let axis = d3.axisBottom(this.ruleProcessing().scale).tickFormat(d3.format('.0'))
        .tickValues(this.ruleProcessing().scale.ticks(1).concat(this.ruleProcessing().scale.domain()))
        d3.selectAll('.axis').remove()
        d3.select(this.ref.current).append('g').attr('class','axis').attr('transform','translate(0,120)').call(axis)
    }
}