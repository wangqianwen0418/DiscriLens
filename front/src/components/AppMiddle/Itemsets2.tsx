import * as React from 'react';
import {DataItem, Status, Rule} from 'types';
import {Icon} from 'antd';
import {ruleAggregate, getAttrRanges, containsAttr, RuleAgg, RuleNode} from 'Helpers';

import "./Itemsets.css"

export interface Props{
    rules: Rule[],
    samples: DataItem[],
    thr_rules:number[],
    key_attrs: string[],
    drag_array: string[],
    drag_status: boolean,
    protected_attr: string,
    fetch_groups_status: Status,
    step:number,
    bar_w: number,
    changeDragStatus: (drag_status: boolean)=>void,
} 
export interface State{
    // used to record buttons record and corresponding attr. string[]
    // element: [attr,boolean]. Boolean=false means shown rules don't contain this attr; similarly boolean=true 
    attrs_button: [string,boolean][],
    expandRules: Rule['id'][] // store the antecedent of the rules that have been expaned
} 
export interface curveData{
    x: number,
    y: number
}
export interface rules{
    rule: string[],
    risk_dif: number
}

export default class Itemset extends React.Component<Props, State>{
public height= 40; bar_margin=1;attr_margin=8;viewSwitch=-1; line_interval = 15;
        margin=10; offsetX = window.innerWidth*0.1; indent: 5;
        headWidth = 50;
constructor(props:Props){
    super(props)
    this.state={
        attrs_button: null,
        expandRules: []
    }
    // this.changeRule = this.changeRule.bind(this)
    // this.initAttrs = this.initAttrs.bind(this)
    this.changeDragStatus = this.changeDragStatus.bind(this)
    this.drawRuleAgg = this.drawRuleAgg.bind(this)
    this.drawRuleNode = this.drawRuleNode.bind(this)
}
changeDragStatus = (e:boolean) =>{
    this.props.changeDragStatus(e)
}
toggleExpand(id: Rule['id']){
    let {expandRules} = this.state
    let idx = expandRules.indexOf(id)
    if(idx==-1){
        expandRules.push(id)
    }else{
        expandRules.splice(idx, 1)
    }
    this.setState({expandRules})
}
drawRuleNode(ruleNode: RuleNode,attrs: string[], offsetX:number, offsetY:number, favorPD: boolean):{content: JSX.Element[], offsetY:number}{
    let {antecedent, items, id} = ruleNode.rule
    let {bar_w, step } = this.props
    let toggleExpand = (e: React.SyntheticEvent)=>this.toggleExpand(id)
    let isExpand = this.state.expandRules.includes(id)

    let indent = -this.headWidth + this.headWidth*0.15*offsetX
    let parent = <g className={`${ruleNode.rule.id.toString()} rule` }
        transform={`translate(${this.offsetX}, ${offsetY})`}>
        <text fontSize={10} y={this.line_interval} textAnchor="end" x={-this.headWidth}>
                    {items.length }
                    -
                    { ruleNode.rule.risk_dif.toFixed(2)}
        </text>
        <g className="tree">
            <line 
            x1={indent} y1={-this.line_interval*0.7} 
            x2={indent} y2={this.line_interval*1.3} 
            stroke="#444" 
            />
             {/* <line 
            x1={-this.headWidth} y1={0} 
            x2={0} y2={0} 
            stroke="#444" 
            /> */}
        </g>
        <g transform={`translate(${-15}, ${this.line_interval})`} cursor='pointer' onClick={toggleExpand}> 
            <line className="ruleBoundary" 
                x1={indent} y1={this.line_interval*0.3} 
                x2={window.innerWidth} y2={this.line_interval*0.3} 
                stroke="#f0f0f0" 
            />
            <g className="icon" transform={`translate(${0}, ${-this.line_interval/4})`}>
            {ruleNode.child.length==0?
            <text className="icon" > 
                o 
            </text> :
            <text className="icon" 
            transform={`rotate(${isExpand?90:0} ${this.line_interval/4} ${-this.line_interval/4})`}>
                > 
            </text> 
            }
            </g>
        </g>
    {
        antecedent.map((attrVal)=>{
        let [attr, val] = attrVal.split('=')
        let ranges = getAttrRanges(this.props.samples, attr).filter(r=>typeof(r)=='string'),
            rangeIdx = ranges.indexOf(val)
        return <g key={attrVal}>
            {/* <rect className='ruleBox' 
            stroke='#666' fill='none' 
            strokeWidth='1px'
            x={-20} y={-0.25*this.line_interval}
            height={this.line_interval*1.5} width={step*key_attrs.length + 20}/> */}
                
                <rect className='background' 
                    width={bar_w} height = {this.line_interval}
                    x={step*attrs.indexOf(attr)}
                    // fill='#eee'
                    fill="transparent"
                    stroke={favorPD?"#98E090":"#FF772D"}
                    strokeWidth={2}
                />
                <rect className='font' 
                    width={bar_w/ranges.length} height = {this.line_interval}
                    x={step*attrs.indexOf(attr) + bar_w/ranges.length*rangeIdx}
                    fill={favorPD?"#98E090":"#FF772D"}
                />
                </g>
        }
    )}
    </g>
    offsetY = offsetY + 2* this.line_interval
    offsetX += 1
    
    let content = [parent]
    if(isExpand){
        let children: JSX.Element[] = []
        for (let childNode of ruleNode.child){
            let {content:child, offsetY:newY} = this.drawRuleNode(childNode, attrs, offsetX, offsetY, favorPD)
            children = children.concat(child)
            offsetY = newY
        }
        content = content.concat(children)
    }
    
    return {content, offsetY}
}
drawRuleAgg(ruleAgg: RuleAgg,attrs: string[], favorPD: boolean){
    let {antecedent, items, id} = ruleAgg
    let {bar_w, step, key_attrs } = this.props
    let toggleExpand = (e: React.SyntheticEvent)=>this.toggleExpand(id)
    let isExpand = this.state.expandRules.includes(id)
    let itemSizeLabel = <text fontSize={10} key='itemSize' y={this.line_interval} textAnchor="end" x={-this.headWidth-5}>
                {items.length}
            </text>
 
    let attrValContent = antecedent.map((attrVal=>{
        let [attr, val] = attrVal.split('=')
        let ranges = getAttrRanges(this.props.samples, attr).filter(r=>typeof(r)=='string'),
            rangeIdx = ranges.indexOf(val)
        return <g key={attrVal}>
            <rect className='ruleBox' 
            stroke='#c3c3c3' fill='none' 
            strokeWidth='1px'
            rx={2} ry={2}
            x={-this.headWidth} y={-0.25*this.line_interval}
            height={this.line_interval*1.5} width={step*key_attrs.length + this.headWidth}/>
            <g className="icon"  transform={`translate(${-15}, ${this.line_interval*0.75})`} cursor='pointer' onClick={toggleExpand}> 
                <text className="icon" 
                transform={`rotate(${isExpand?90:0} ${this.line_interval/4} ${-this.line_interval/4})`}
                > 
                    > 
                </text> 
            </g>
            <rect className='background' 
                width={bar_w} height = {this.line_interval}
                x={step*attrs.indexOf(attr)}
                // fill='#eee'
                fill="transparent"
                stroke={favorPD?"#98E090":"#FF772D"}
                strokeWidth={2}
            />
            <rect className='font' 
                width={bar_w/ranges.length} height = {this.line_interval}
                x={step*attrs.indexOf(attr) + bar_w/ranges.length*rangeIdx}
                fill={favorPD?"#98E090":"#FF772D"}
            />
            </g>
    }))
    attrValContent.unshift(itemSizeLabel)
    return attrValContent
}
draw(){
    let {rules, samples, thr_rules, key_attrs, protected_attr} = this.props
    let {expandRules} = this.state
    // let samples_numerical = samples.slice(0,1000)
    samples = samples.slice(1000,2000)

    rules = rules
        // risk threshold
        .filter(rule=> rule.risk_dif>=thr_rules[1] || rule.risk_dif<=thr_rules[0] ) 
        .filter(rule=>rule.cls=='class=H')
        // normalize risk diff => favor PD
        .map(rule=>{
            return {...rule, favorPD: rule.cls=='class=H'?rule.risk_dif: -1*rule.risk_dif}
        }) 
        .filter(rule=>containsAttr(rule.antecedent, key_attrs).length>=key_attrs.length)
    

    let results = ruleAggregate(rules, key_attrs, samples)
    console.info(results)

    let attrs = [...Object.keys(samples[0])]
    // remove the attribute 'id' and 'class'
    if(attrs.includes('id')){
        attrs.splice(attrs.indexOf('id'), 1)
    }
    if(attrs.includes(protected_attr)){
        attrs.splice(attrs.indexOf(protected_attr), 1)
    }
    
    attrs.splice(attrs.indexOf('class'), 1)
    
    attrs.sort((a,b)=>{
        if(key_attrs.indexOf(a)!=-1){
            return -1
        }else if(key_attrs.indexOf(b)!=-1){
            return 1
        }
        return 0
    })

    
    let {positiveRuleAgg} = results
    let offsetY = 5
    let posRules:JSX.Element[] = []
    for (let ruleAgg of positiveRuleAgg){
        posRules.push(
            <g key={ruleAgg.id} id={ruleAgg.id.toString()} transform={`translate(${this.offsetX}, ${offsetY})`} className="rule">    
            {
                this.drawRuleAgg(ruleAgg, attrs, true)
            }
        </g>   
        )
        offsetY = offsetY + 2*this.line_interval
        if (expandRules.includes(ruleAgg.id)){
            for (let ruleNode of ruleAgg.nodes){
                let {content, offsetY: newY} = this.drawRuleNode(ruleNode, attrs, 1, offsetY, true)
                offsetY = newY
                posRules = posRules.concat(content)
            }
        }
    }

    // let negaRules = negativeRuleAgg.map((ruleAgg,rule_i)=>{
    //     return <g key={rule_i+'rules'} 
    //         transform={`translate(${window.innerWidth*0.1}, ${5 + 2*this.line_interval* rule_i+ offsetY})`}>
    //         {
    //             this.drawRuleAggs(ruleAgg.antecedent, ruleAgg.items, attrs, false)
    //         }
    //     </g>         

    // })
    return <g key='rules'>
        {posRules}
        {/* {negaRules} */}
    </g>
}
render(){
    let {fetch_groups_status} = this.props
    let content:JSX.Element = <g/>
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
            if(this.props.drag_status){this.changeDragStatus(false);}
            break
        default:
            break

    }
    return (<svg className='itemset' style={{width:"100%", height: "800px"}}>
        <g className='rules' >
            {content}
        </g> 
    </svg>       
)}
}
