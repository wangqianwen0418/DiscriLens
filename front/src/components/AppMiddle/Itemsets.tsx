import * as React from 'react';
import { DataItem, Status, Rule } from 'types';
import { Icon } from 'antd';
import { ruleAggregate, getAttrRanges, containsAttr, RuleAgg, RuleNode } from 'Helpers';
import * as d3 from 'd3';

// import Euler from 'components/AppMiddle/Euler';
import Bubble from 'components/AppMiddle/Bubble';

import "./Itemsets.css";

export interface Props {
    rules: Rule[],
    samples: DataItem[],
    ruleThreshold: [number, number],
    keyAttrNum: number,
    showAttrNum: number,
    dragArray: string[],
    protectedAttr: string,
    fetchKeyStatus: Status,
    step: number,
    barWidth: number,
    offsetX: number,
    onChangeShowAttr: (showAttrs: string[]) => void
}
export interface State {
    expandRules: { [id: string]: ExpandRule } // store the new show attributes of the rules that have been expaned
}
export interface ExpandRule {
    id: string,
    newAttrs: string[] // not include key attributes
    children: string[] // id of the child rule
}
export interface curveData {
    x: number,
    y: number
}
export interface rules {
    rule: string[],
    risk_dif: number
}

export default class Itemset extends React.Component<Props, State>{
    public height = 40; bar_margin = 1; attr_margin = 8; viewSwitch = -1; lineInterval = 15;
    margin = 65;
    headWidth = this.props.offsetX - this.margin;
    indent: 5;

    constructor(props: Props) {
        super(props)
        this.state = {
            expandRules: {}
        }
        this.toggleExpand = this.toggleExpand.bind(this)
        this.drawRuleAgg = this.drawRuleAgg.bind(this)
        this.drawRuleNode = this.drawRuleNode.bind(this)
    }
    toggleExpand(id: string, newAttrs: string[], children: string[]) {
        let { expandRules } = this.state
        let { showAttrNum, dragArray, keyAttrNum } = this.props

        let showAttrs = dragArray.slice(0, showAttrNum)

        if (expandRules[id]) {
            // collapse a rule
            delete expandRules[id]

            let remainShowAttrs = [].concat.apply([], Object.values(expandRules))
            showAttrs = showAttrs
                .filter(
                    (attr, i) => {
                        // is key attribute or is in other expanded rules
                        return i < keyAttrNum || remainShowAttrs.includes(attr)
                    }
                )
        } else {
            // expand a rule
            expandRules[id] = {
                id,
                newAttrs,
                children 
            }
            showAttrs = showAttrs
                .concat(
                    newAttrs
                        .filter(attr => !showAttrs.includes(attr))
                )
        }
        this.props.onChangeShowAttr(showAttrs)
        this.setState({ expandRules })
    }
    drawRuleNode(ruleNode: RuleNode, offsetX: number, offsetY: number, favorPD: boolean, itemMax: number): { content: JSX.Element[], offsetY: number } {
        let { rule, children } = ruleNode
        let { antecedent, items, id } = rule
        let { barWidth, step, keyAttrNum, showAttrNum, dragArray } = this.props

        let keyAttrs = dragArray.slice(0, keyAttrNum), showAttrs = dragArray.slice(0, showAttrNum)


        let newAttrs: string[] = []
        for (var node of children) {
            newAttrs = newAttrs.concat(
                node.rule.antecedent
                    .map(attrVal => attrVal.split('=')[0])
                    .filter(attr =>
                        (!keyAttrs.includes(attr))
                        && (!newAttrs.includes(attr))
                    )
            )
        }

        let toggleExpand =
            (e: React.SyntheticEvent) => this.toggleExpand(
                    id.toString(),
                    newAttrs,
                    children.map(child => child.rule.id.toString())
                )
        let isExpand = this.state.expandRules.hasOwnProperty(id)

        let indent = -this.headWidth + this.headWidth * 0.2 * offsetX
        // let outCircleRadius = this.lineInterval * 0.8
        // let progressBarWidth = 5
        // let inCircleRadius = this.lineInterval * 0.8 - progressBarWidth*1.5
        let outRadius = this.lineInterval * 0.9 * items.length / itemMax
        let inRadius = this.lineInterval * 0.9 * (items.length - rule.sup_pd / rule.conf_pd) / itemMax
        let circleRadius = (outRadius + inRadius) / 2, progressBarWidth = outRadius - inRadius
        let parent = <g className={`${ruleNode.rule.id.toString()} rule`}
            transform={`translate(${this.props.offsetX}, ${offsetY})`}>
            <g className="score" transform={`translate(${-circleRadius + indent - this.headWidth * 0.1}, ${this.lineInterval * 0.5})`}>
                <circle
                    className="background"
                    r={circleRadius}
                    fill='none'
                    stroke="#ccc"
                    strokeWidth={progressBarWidth}
                    strokeDasharray={circleRadius * 2 * Math.PI}
                    strokeDashoffset="0" />
                <circle
                    className="conf_pnd bar"
                    stroke="#FF9F1E"
                    strokeWidth={progressBarWidth}
                    r={circleRadius}
                    fill='none'
                    strokeDasharray={circleRadius * 2 * Math.PI}
                    strokeDashoffset={circleRadius * 2 * Math.PI * (1 - rule.conf_pnd)} />
                <circle
                    className="conf_pd bar"
                    stroke="#98E090"
                    strokeWidth={progressBarWidth}
                    r={circleRadius}
                    fill='none'
                    strokeDasharray={circleRadius * 2 * Math.PI}
                    // strokeDashoffset={inCircleRadius * 2 * Math.PI * (1-rule.conf_pd)} 
                    strokeDashoffset={circleRadius * 2 * Math.PI * (1 - (rule.sup_pnd - rule.sup_pd) / (rule.sup_pnd / rule.conf_pnd - rule.sup_pd / rule.conf_pd))}
                />
                {/* <text textAnchor='middle' fontSize={this.lineInterval-progressBarWidth} y={ (this.lineInterval-progressBarWidth)/2 }>
                    {rule.risk_dif.toFixed(2).replace('0.', '.')}
                </text> */}
            </g>
            {/* <g className="score" transform={`translate(${-outCircleRadius + indent - this.headWidth*0.1}, ${this.lineInterval*0.3})`}>
                <g className='conf_pnd' >
                    <circle
                        className="background"
                        r={outCircleRadius} 
                        fill='none'
                        stroke="#ccc"
                        strokeWidth={progressBarWidth}
                        strokeDasharray={outCircleRadius * 2 * Math.PI}
                        strokeDashoffset="0" />
                    <circle 
                        className="bar"
                        stroke="#FF9F1E"
                        strokeWidth={progressBarWidth}
                        r={outCircleRadius} 
                        fill='none'
                        strokeDasharray={outCircleRadius * 2 * Math.PI}
                        strokeDashoffset={outCircleRadius * 2 * Math.PI * (1-rule.conf_pnd)} />
                </g>
                <g className='conf_pd'>
                    <circle
                        className="background"
                        r={inCircleRadius} 
                        fill='none'
                        stroke="#ccc"
                        strokeWidth={progressBarWidth}
                        strokeDasharray={inCircleRadius * 2 * Math.PI}
                        strokeDashoffset="0" />
                    <circle 
                        className="bar"
                        stroke="#FF9F1E"
                        strokeWidth={progressBarWidth}
                        r={inCircleRadius} 
                        fill='none'
                        strokeDasharray={inCircleRadius * 2 * Math.PI}
                        // strokeDashoffset={inCircleRadius * 2 * Math.PI * (1-rule.conf_pd)} 
                        strokeDashoffset={inCircleRadius * 2 * Math.PI * (1- (rule.sup_pnd-rule.sup_pd)/(rule.sup_pnd/rule.conf_pnd-rule.sup_pd/rule.conf_pd) )} 
                        />
                </g>
            </g> */}
            <text fontSize={10} y={this.lineInterval} textAnchor="end" x={-this.headWidth - 2 * circleRadius}>
                {/* {items.length} */}
                {/* -
                    {rule.risk_dif.toFixed(2)} */}
            </text>
            <g className="tree">
                <line
                    x1={indent} y1={-this.lineInterval * 0.5}
                    x2={indent} y2={this.lineInterval * 1.5}
                    stroke="#c3c3c3"
                    strokeWidth='2'
                />
                {/* <line 
            x1={-this.headWidth} y1={0} 
            x2={0} y2={0} 
            stroke="#444" 
            /> */}
            </g>
            <g transform={`translate(${-15}, ${this.lineInterval})`} cursor='pointer' onClick={toggleExpand}>
                <line className="ruleBoundary"
                    x1={indent} y1={this.lineInterval * 0.5}
                    x2={window.innerWidth} y2={this.lineInterval * 0.5}
                    stroke="#f0f0f0"
                />
                <g className="icon" transform={`translate(${0}, ${-this.lineInterval / 4})`}>
                    {ruleNode.children.length == 0 ?
                        <text className="icon" >
                            o
            </text> :
                        <text className="icon"
                            transform={`rotate(${isExpand ? 90 : 0} ${this.lineInterval / 4} ${-this.lineInterval / 4})`}>
                            >
            </text>
                    }
                </g>
            </g>
            {
                antecedent.map((attrVal) => {
                    let [attr, val] = attrVal.split('=')
                    let ranges = getAttrRanges(this.props.samples, attr).filter(r => typeof (r) == 'string'),
                        rangeIdx = ranges.indexOf(val)
                    return <g key={attrVal}>
                        {/* <rect className='ruleBox' 
            stroke='#666' fill='none' 
            strokeWidth='1px'
            x={-20} y={-0.25*this.lineInterval}
            height={this.lineInterval*1.5} width={step*showAttrs.length + 20}/> */}

                        <rect className='background'
                            width={barWidth} height={this.lineInterval}
                            x={step * showAttrs.indexOf(attr)}
                            // fill='#eee'
                            fill='none'
                            stroke={favorPD ? "#98E090" : "#FF772D"}
                            strokeWidth={2}
                        />
                        <rect className='font'
                            width={barWidth / ranges.length} height={this.lineInterval}
                            x={step * showAttrs.indexOf(attr) + barWidth / ranges.length * rangeIdx}
                            fill={favorPD ? "#98E090" : "#FF772D"}
                        />
                    </g>
                }
                )}
        </g>
        offsetY = offsetY + 2 * this.lineInterval
        offsetX += 1

        let content = [parent]
        if (isExpand) {
            let children: JSX.Element[] = []
            for (let childNode of ruleNode.children) {
                let { content: child, offsetY: newY } = this.drawRuleNode(childNode, offsetX, offsetY, favorPD, itemMax)
                children = children.concat(child)
                offsetY = newY
            }
            content = content.concat(children)
        }

        return { content, offsetY }
    }
    drawRuleAgg(ruleAgg: RuleAgg, favorPD: boolean) {
        let { antecedent, items, id, nodes } = ruleAgg
        let { barWidth, step, keyAttrNum, dragArray } = this.props
        let keyAttrs = dragArray.slice(0, keyAttrNum)
        let newAttrs: string[] = []
        for (var node of nodes) {
            newAttrs = newAttrs.concat(
                node.rule.antecedent
                    .map(attrVal => attrVal.split('=')[0])
                    .filter(attr =>
                        (!keyAttrs.includes(attr))
                        && (!newAttrs.includes(attr))
                    )
            )
        }
        let toggleExpand = (e: React.SyntheticEvent) => this.toggleExpand(id.toString(), newAttrs, nodes.map(child => child.rule.id.toString()))
        let isExpand = this.state.expandRules.hasOwnProperty(id)
        let itemSizeLabel = <text fontSize={10} key='itemSize' y={this.lineInterval} textAnchor="end" x={-this.headWidth - 5}>
            {items.length}
        </text>

        let attrValContent = antecedent.map((attrVal => {
            let [attr, val] = attrVal.split('=')
            let ranges = getAttrRanges(this.props.samples, attr).filter(r => typeof (r) == 'string'),
                rangeIdx = ranges.indexOf(val)
            return <g key={attrVal}>
                {/* <Bubble ruleAgg={ruleAgg}/> */}
                <rect className='ruleBox'
                    stroke='#c3c3c3' fill='none'
                    strokeWidth='1px'
                    rx={2} ry={2}
                    x={-this.headWidth} y={-0.5 * this.lineInterval}
                    height={this.lineInterval * 2} width={step * keyAttrNum + this.headWidth} />
                <g className="icon" transform={`translate(${-15}, ${this.lineInterval * 0.75})`} cursor='pointer' onClick={toggleExpand}>
                    <text className="icon"
                        transform={`rotate(${isExpand ? 90 : 0} ${this.lineInterval / 4} ${-this.lineInterval / 4})`}
                    >
                        >
                </text>
                </g>
                <rect className='background'
                    width={barWidth} height={this.lineInterval}
                    x={step * dragArray.indexOf(attr)}
                    // fill='#eee'
                    fill='none'
                    stroke={favorPD ? "#98E090" : "#FF772D"}
                    strokeWidth={2}
                />
                <rect className='font'
                    width={barWidth / ranges.length} height={this.lineInterval}
                    x={step * dragArray.indexOf(attr) + barWidth / ranges.length * rangeIdx}
                    fill={favorPD ? "#98E090" : "#FF772D"}
                />
            </g>
        }))
        attrValContent.unshift(itemSizeLabel)
        return attrValContent
    }
    draw() {
        let { rules, samples, ruleThreshold, keyAttrNum, dragArray } = this.props
        let { expandRules } = this.state
        // let samples_numerical = samples.slice(0,1000)
        samples = samples.slice(1000, 2000)

        let keyAttrs = dragArray.slice(0, keyAttrNum)

        rules = rules
            // risk threshold
            .filter(rule => rule.risk_dif >= ruleThreshold[1] || rule.risk_dif <= ruleThreshold[0])
            .filter(rule => rule.cls == 'class=H')
            // normalize risk diff => favor PD
            .map(rule => {
                return { ...rule, favorPD: rule.cls == 'class=H' ? rule.risk_dif : -1 * rule.risk_dif }
            })
            .filter(rule => containsAttr(rule.antecedent, keyAttrs).length >= keyAttrs.length)

        let itemMax = Math.max(...rules.map(d => d.items.length))

        // aggregate based on key attributes
        let results = ruleAggregate(rules, dragArray.filter(attr => keyAttrs.includes(attr)), samples)


        let { positiveRuleAgg } = results
        let offsetY = 0
        let posRules: JSX.Element[] = []
        for (let ruleAgg of positiveRuleAgg) {
            offsetY += 0.3 * this.lineInterval
            posRules.push(
                <g key={ruleAgg.id} id={ruleAgg.id.toString()} transform={`translate(${this.props.offsetX}, ${offsetY})`} className="rule">
                    {
                        this.drawRuleAgg(ruleAgg, true)
                    }
                </g>
            )
            offsetY = offsetY + 2 * this.lineInterval
            if (expandRules.hasOwnProperty(ruleAgg.id)) {
                for (let ruleNode of ruleAgg.nodes) {
                    let { content, offsetY: newY } = this.drawRuleNode(ruleNode, 1, offsetY, true, itemMax)
                    offsetY = newY
                    posRules = posRules.concat(content)
                }
            }
        }

        // let negaRules = negativeRuleAgg.map((ruleAgg,rule_i)=>{
        //     return <g key={rule_i+'rules'} 
        //         transform={`translate(${window.innerWidth*0.1}, ${5 + 2*this.lineInterval* rule_i+ offsetY})`}>
        //         {
        //             this.drawRuleAggs(ruleAgg.antecedent, ruleAgg.items, attrs, false)
        //         }
        //     </g>         

        // })
        let scoreDomain = d3.extent(rules.map(rule => rule.risk_dif))
        return <g key='rules' transform={`translate(${0}, ${this.margin})`}>
            {/* <foreignObject><Euler ruleAgg={positiveRuleAgg[1]}/></foreignObject> */}
            {posRules}
            {/* {negaRules} */}
            <g className='bubbles'>
                {
                    positiveRuleAgg
                        .map((ruleAgg, i) =>
                            <g key={'bubble_' + ruleAgg.id} transform={`translate(${100 + 200 * i}, 300)`} >
                                <Bubble ruleAgg={ruleAgg} scoreDomain={scoreDomain} />
                            </g>
                        )

                }
            </g>
        </g>
    }
    render() {
        let { fetchKeyStatus } = this.props
        let content: JSX.Element = <g />
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
        return (<svg className='itemset' style={{ width: "100%", height: "800px" }}>
            <g className='rules' >
                {content}
            </g>
        </svg>
        )
    }
}
