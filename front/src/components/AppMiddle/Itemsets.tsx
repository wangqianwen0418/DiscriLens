import * as React from 'react';
import { DataItem, Status, Rule } from 'types';
import { Icon } from 'antd';
import { ruleAggregate, getAttrRanges, RuleAgg, RuleNode } from 'Helpers';
import * as d3 from 'd3';

// import Euler from 'components/AppMiddle/Euler';
// import Bubble from 'components/AppMiddle/Bubble';
import Bubble from 'components/AppMiddle/BubblePack';

import "./Itemsets.css";

const PIN = <g transform={`scale(0.015) `}>
    <path 
    stroke='gray'
    opacity={0.6}
    d="M878.3 392.1L631.9 145.7c-6.5-6.5-15-9.7-23.5-9.7s-17 3.2-23.5 9.7L423.8 306.9c-12.2-1.4-24.5-2-36.8-2-73.2 0-146.4 24.1-206.5 72.3a33.23 33.23 0 0 0-2.7 49.4l181.7 181.7-215.4 215.2a15.8 15.8 0 0 0-4.6 9.8l-3.4 37.2c-.9 9.4 6.6 17.4 15.9 17.4.5 0 1 0 1.5-.1l37.2-3.4c3.7-.3 7.2-2 9.8-4.6l215.4-215.4 181.7 181.7c6.5 6.5 15 9.7 23.5 9.7 9.7 0 19.3-4.2 25.9-12.4 56.3-70.3 79.7-158.3 70.2-243.4l161.1-161.1c12.9-12.8 12.9-33.8 0-46.8zM666.2 549.3l-24.5 24.5 3.8 34.4a259.92 259.92 0 0 1-30.4 153.9L262 408.8c12.9-7.1 26.3-13.1 40.3-17.9 27.2-9.4 55.7-14.1 84.7-14.1 9.6 0 19.3.5 28.9 1.6l34.4 3.8 24.5-24.5L608.5 224 800 415.5 666.2 549.3z"/>
</g>

export interface Props {
    rules: Rule[],
    samples: DataItem[],
    ruleThreshold: [number, number],
    keyAttrNum: number,
    showAttrNum: number,
    dragArray: string[],
    protectedVal: string,
    fetchKeyStatus: Status,
    step: number,
    barWidth: number,
    offsetX: number,
    onChangeShowAttr: (showAttrs: string[]) => void
}
export interface State {
    expandRules: { [id: string]: ExpandRule } // store the new show attributes of the rules that have been expaned
    hoverRule: string,
    highlightRules: string[];
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
    bubbleSize: [number, number][] = []

    constructor(props: Props) {
        super(props)
        this.state = {
            expandRules: {},
            hoverRule: undefined,
            highlightRules: []
        }
        this.toggleExpand = this.toggleExpand.bind(this)
        this.drawRuleAgg = this.drawRuleAgg.bind(this)
        this.drawRuleNode = this.drawRuleNode.bind(this)
        this.drawBubbles = this.drawBubbles.bind(this)
        this.toggleHighlight = this.toggleHighlight.bind(this)
    }

    toggleExpand(id: string, newAttrs: string[], children: string[]) {
        let { expandRules } = this.state
        let { showAttrNum, dragArray, keyAttrNum } = this.props

        let showAttrs = dragArray.slice(0, showAttrNum)

        const collapseRule = (id: string) => {
            for (let childID of expandRules[id].children) {
                if (expandRules[childID]) {
                    collapseRule(childID)
                }
            }
            delete expandRules[id]
        }

        if (expandRules[id]) {
            // collapse a rule
            collapseRule(id)

            let remainShowAttrs = [].concat.apply([], Object.values(expandRules).map(d => d.newAttrs))
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
        // console.info(showAttrs, expandRules)
    }
    toggleHighlight(ruleID: string){
        let {highlightRules} =this.state
        let idx = highlightRules.indexOf(ruleID)
        if (idx==-1){
            highlightRules.push(ruleID)
        }else{
            highlightRules.splice(idx, 1)
        }
        this.setState({highlightRules})
    }
    drawRuleNode(ruleNode: RuleNode, offsetX: number, offsetY: number, favorPD: boolean, itemScale: d3.ScaleLinear<number, number>): { content: JSX.Element[], offsetY: number } {
        let { rule, children } = ruleNode
        let { antecedent, items, id } = rule
        let { barWidth, step, keyAttrNum, showAttrNum, dragArray } = this.props
        let {highlightRules} = this.state

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

        let inConf = Math.min(rule.conf_pd, rule.conf_pnd)
        
        let progressBarWidth = this.lineInterval*0.2
        let outRadius = itemScale(items.length) + progressBarWidth/2
        let inRadius = outRadius -  progressBarWidth*1.1
        let parent = <g className={`${ruleNode.rule.id} rule`}
            transform={`translate(${this.props.offsetX}, ${offsetY})`}
            // tslint:disable-next-line:jsx-no-lambda
            onMouseEnter={()=>this.setState({hoverRule: rule.id.toString()})}
            // tslint:disable-next-line:jsx-no-lambda
            onMouseLeave={()=> this.setState({hoverRule:undefined})}
            >
            <g 
                className="score" 
                transform={`translate(${-itemScale.range()[1] + indent - this.headWidth * 0.1}, ${this.lineInterval * 0.5})`}
                // //tslint:disable-next-line:jsx-no-lambda
                // onMouseEnter={()=>this.setState({highlightRule: rule.id.toString()})}
                // // tslint:disable-next-line:jsx-no-lambda
                // onMouseLeave={()=> this.setState({highlightRule:''})}
            >
                
                <circle
                    className="background out"
                    r={outRadius}
                    fill='none'
                    stroke="#eee"
                    strokeLinecap="round"
                    strokeWidth={progressBarWidth}
                    strokeDasharray={outRadius * 2 * Math.PI}
                    strokeDashoffset="0" />
                <circle
                    className="out bar"
                    stroke="#FF9F1E"
                    strokeWidth={progressBarWidth}
                    strokeLinecap="round"
                    r={outRadius}
                    fill='none'
                    strokeDasharray={outRadius * 2 * Math.PI}
                    strokeDashoffset={outRadius * 2 * Math.PI * (1 - rule.conf_pd)} />
                <circle
                    className="out bar"
                    // stroke="#98E090"
                    stroke="#f4d6ba"
                    strokeWidth={progressBarWidth}
                    strokeLinecap="round"
                    r={outRadius}
                    fill='none'
                    strokeDasharray={outRadius * 2 * Math.PI}
                    // strokeDashoffset={inCircleRadius * 2 * Math.PI * (1-rule.conf_pd)} 
                    strokeDashoffset={outRadius * 2 * Math.PI * (1 - inConf)}
                />
                <circle
                    className="background in"
                    r={inRadius}
                    fill='none'
                    stroke="#eee"
                    strokeLinecap="round"
                    strokeWidth={progressBarWidth}
                    strokeDasharray={inRadius * 2 * Math.PI}
                    strokeDashoffset="0" />
                <circle
                    className="in conf bar"
                    stroke="#98E090"
                    strokeWidth={progressBarWidth}
                    strokeLinecap="round"
                    r={inRadius}
                    fill='none'
                    strokeDasharray={inRadius * 2 * Math.PI}
                    // strokeDashoffset={inCircleRadius * 2 * Math.PI * (1-rule.conf_pd)} 
                    strokeDashoffset={inRadius * 2 * Math.PI * (1 - rule.conf_pnd)}
                />
                <circle
                    className="in conf bar"
                    // stroke="#98E090"
                    stroke="#abdda6"
                    strokeWidth={progressBarWidth}
                    strokeLinecap="round"
                    r={inRadius}
                    fill='none'
                    strokeDasharray={inRadius * 2 * Math.PI}
                    // strokeDashoffset={inCircleRadius * 2 * Math.PI * (1-rule.conf_pd)} 
                    strokeDashoffset={inRadius * 2 * Math.PI * (1 - inConf)}
                />
                <g className='pin icon' transform={`translate(${0}, ${-itemScale.range()[1]})`} opacity={0}>{PIN}</g>

                {/* <text textAnchor='middle' fontSize={this.lineInterval-progressBarWidth} y={ (this.lineInterval-progressBarWidth)/2 }>
                    {rule.risk_dif.toFixed(2).replace('0.', '.')}
                </text> */}
            </g>
            <text fontSize={10} y={this.lineInterval} textAnchor="end" x={-this.headWidth - 2 * outRadius}>
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
                <g className='pin icon' 
                transform={`translate(${indent}, ${this.lineInterval * .5}) rotate(${0})`} 
                opacity={highlightRules.includes(rule.id.toString())?1:0}
                // tslint:disable-next-line:jsx-no-lambda
                onClick={()=>this.toggleHighlight(rule.id.toString())}
                cursor='pointer'>
                <rect width={-indent} height={2*this.lineInterval} y={-this.lineInterval } x={0} fill='transparent'/>
                    {PIN}
                </g>
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
                    {/* <foreignObject>
                        <Icon type="pushpin" style={{fontSize:this.lineInterval*0.6}}/>
                    </foreignObject> */}
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
                let { content: child, offsetY: newY } = this.drawRuleNode(childNode, offsetX, offsetY, favorPD, itemScale)
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
    drawBubbles(ruleAggs: RuleAgg[], scoreDomain: [number, number]) {
        let { showAttrNum, step } = this.props
        let { expandRules } = this.state
        // rules that are showing
        let showIDs: string[] = Array.from(
            new Set(
                [].concat.apply([], Object.values(expandRules).map(d => d.children))
            )
        )
        showIDs = showIDs.concat(
            Object.keys(expandRules)
                .filter(id => !showIDs.includes(id))
        )
        showIDs = showIDs.filter(id=>!id.includes('agg'))
        // console.info('show ids', showIDs)
        return <g className='bubbles' transform={`translate(${showAttrNum * step + this.margin}, ${0})`}>
            {
                ruleAggs
                    .map((ruleAgg, i) =>
                        <g key={'bubble_' + ruleAgg.id} transform={`translate(100, ${80 * i})`} >
                            <Bubble 
                            ref={(ref:any)=>{
                                if (ref){
                                    this.bubbleSize.push(ref.getSize())}
                                }
                                
                            }
                                ruleAgg={ruleAgg} 
                                scoreDomain={scoreDomain} 
                                showIDs={showIDs} 
                                hoverRule={this.state.hoverRule}
                                highlightRules={this.state.highlightRules}
                                samples = {this.props.samples}
                                protectedVal={this.props.protectedVal}
                            />
                        </g>
                    )

            }
        </g>
    }
    draw() {
        let { rules, samples, keyAttrNum, dragArray } = this.props
        let { expandRules } = this.state
        // let samples_numerical = samples.slice(0,1000)
        samples = samples.slice(Math.floor(samples.length/2), samples.length )

        let keyAttrs = dragArray.slice(0, keyAttrNum)

        let itemMax = Math.max(...rules.map(d => d.items.length)), itemMin = Math.min(...rules.map(d => d.items.length)),
            itemScale = d3.scaleLinear()
            .domain([itemMin, itemMax])
            .range([this.lineInterval*0.4, this.lineInterval*0.85])

        // aggregate based on key attributes
        let results = ruleAggregate(rules, dragArray.filter(attr => keyAttrs.includes(attr)), samples)
        // console.info(results)

        let { positiveRuleAgg, negativeRuleAgg } = results
        let offsetY = 0
        let posRules: JSX.Element[] = []
        for (let ruleAgg of positiveRuleAgg) {
            offsetY += 0.3 * this.lineInterval
            posRules.push(
                <g key={ruleAgg.id} id={`${ruleAgg.id}`} transform={`translate(${this.props.offsetX}, ${offsetY})`} className="rule">
                    {
                        this.drawRuleAgg(ruleAgg, true)
                    }
                </g>
            )
            offsetY = offsetY + 2 * this.lineInterval
            if (expandRules.hasOwnProperty(ruleAgg.id)) {
                for (let ruleNode of ruleAgg.nodes) {
                    let { content, offsetY: newY } = this.drawRuleNode(ruleNode, 1, offsetY, true, itemScale)
                    offsetY = newY
                    posRules = posRules.concat(content)
                }
            }
        }
        let negaRules: JSX.Element[] = []
        for (let ruleAgg of negativeRuleAgg) {
            offsetY += 0.3 * this.lineInterval
            negaRules.push(
                <g key={ruleAgg.id} id={`${ruleAgg.id}`} transform={`translate(${this.props.offsetX}, ${offsetY})`} className="rule">
                    {
                        this.drawRuleAgg(ruleAgg, false)
                    }
                </g>
            )
            offsetY = offsetY + 2 * this.lineInterval
            if (expandRules.hasOwnProperty(ruleAgg.id)) {
                for (let ruleNode of ruleAgg.nodes) {
                    let { content, offsetY: newY } = this.drawRuleNode(ruleNode, 1, offsetY, false, itemScale)
                    offsetY = newY
                    negaRules = negaRules.concat(content)
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
        let bubbles = [this.drawBubbles(positiveRuleAgg, scoreDomain), this.drawBubbles(negativeRuleAgg, scoreDomain)]

        return <g key='rules' transform={`translate(${0}, ${this.margin})`}>
            {/* <foreignObject><Euler ruleAgg={positiveRuleAgg[1]}/></foreignObject> */}
            <g className='positive rules'>
                {posRules}
            </g>
            <g className='negative rules'>
                {negaRules}
            </g>
            <g className='bubbles'>
            {bubbles}
            </g>
        </g>
    }
    componentDidUpdate(prevProp: Props) {
        // if (
        //     prevProp.ruleThreshold[0] != this.props.ruleThreshold[0]
        //     || prevProp.ruleThreshold[1] != this.props.ruleThreshold[1]
        //     || prevProp.rules[0].pd != this.props.rules[0].pd
        // ) {
        //     this.setState({ expandRules: {} })
        // }
        // console.info(this.bubbles.map(bubble=>bubble.getBoundingClientRect()))
        // console.info(this.bubbleSize)
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
        return (<svg className='itemset' style={{ width: "100%", height: "100%" }}>
            <g className='rules' >
                {content}
            </g>
        </svg>
        )
    }
}