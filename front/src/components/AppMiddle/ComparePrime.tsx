import * as React from 'react';
import { DataItem, Status, Rule } from 'types';
import { Icon } from 'antd';
import { ruleAggregate, getAttrRanges, RuleAgg, RuleNode, } from 'Helpers';
import * as d3 from 'd3';

// import Euler from 'components/AppMiddle/Euler';
// import Bubble from 'components/AppMiddle/Bubble';
// import Bubble from 'components/AppMiddle/BubbleForce';
import Bubble from 'components/AppMiddle/BubblePack';

import "./Itemsets.css";
const PIN = <g transform={`scale(0.015) `}>
    <path
        stroke='gray'
        opacity={0.6}
        d="M878.3 392.1L631.9 145.7c-6.5-6.5-15-9.7-23.5-9.7s-17 3.2-23.5 9.7L423.8 306.9c-12.2-1.4-24.5-2-36.8-2-73.2 0-146.4 24.1-206.5 72.3a33.23 33.23 0 0 0-2.7 49.4l181.7 181.7-215.4 215.2a15.8 15.8 0 0 0-4.6 9.8l-3.4 37.2c-.9 9.4 6.6 17.4 15.9 17.4.5 0 1 0 1.5-.1l37.2-3.4c3.7-.3 7.2-2 9.8-4.6l215.4-215.4 181.7 181.7c6.5 6.5 15 9.7 23.5 9.7 9.7 0 19.3-4.2 25.9-12.4 56.3-70.3 79.7-158.3 70.2-243.4l161.1-161.1c12.9-12.8 12.9-33.8 0-46.8zM666.2 549.3l-24.5 24.5 3.8 34.4a259.92 259.92 0 0 1-30.4 153.9L262 408.8c12.9-7.1 26.3-13.1 40.3-17.9 27.2-9.4 55.7-14.1 84.7-14.1 9.6 0 19.3.5 28.9 1.6l34.4 3.8 24.5-24.5L608.5 224 800 415.5 666.2 549.3z" />
</g>

// const PIN = <g transform={`scale(0.015) `}>
//     <path 
//     stroke='gray'
//     fill='none'
//     strokeWidth='4'
//     d="M2542.3-243.9l-246.4-246.4c-6.5-6.5-15-9.7-23.5-9.7s-17,3.2-23.5,9.7l-161.1,161.2c-12.2-1.4-24.5-2-36.8-2
//     c-73.2,0-146.4,24.1-206.5,72.3c-14.3,11.5-16.6,32.4-5.1,46.7c0.8,0.9,1.6,1.8,2.4,2.7l181.7,181.7l-215.4,215.2
//     c-2.6,2.6-4.3,6.1-4.6,9.8l-3.4,37.2c-0.9,9.4,6.6,17.4,15.9,17.4c0.5,0,1,0,1.5-0.1l37.2-3.4c3.7-0.3,7.2-2,9.8-4.6l215.4-215.4
//     l181.7,181.7c6.5,6.5,15,9.7,23.5,9.7c9.7,0,19.3-4.2,25.9-12.4c56.3-70.3,79.7-158.3,70.2-243.4l161.1-161.1
//     C2555.2-209.9,2555.2-230.9,2542.3-243.9z"/>
// </g>



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
    offset: number,
    unMatchedRules:{pos:[RuleAgg,number][],neg:[RuleAgg,number][]},
    compareList:{b2:rect[],r:{y:number,r:string[]}[],p:number,yMax:any},
    compareOffset:{y:number[],index:number[]}
    onChangeShowAttr: (showAttrs: string[]) => void
    onChangeSelectedBar: (selected_bar: string[]) => void
    onTransCompareList:(compareList:{b2:rect[],r:{y:number,r:string[]}[],p:number,yMax:any}) =>void
    onTransExpandRule:(expandRule:{id: number, newAttrs: string[], children: string[]})=>void
    onChangeOffsetLength:(offsetLength:number)=>void
}
export interface State {
    expandRules: { [id: string]: ExpandRule } // store the new show attributes of the rules that have been expaned
    hoverRule: string,
    highlightRules: { [id: string]: string[] }; // the highlight rules in each ruleAGG
    // record all the bubble position when button is true
    bubblePosition: rect[],
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
export interface axis {
    x: number,
    y: number
}
export interface rect {
    x: number,
    y: number,
    w: number,
    h: number,
}

export default class ComparePrime extends React.Component<Props, State>{
    public height = 40; bar_margin = 1; attr_margin = 8; viewSwitch = -1; lineInterval = 15; fontSize=10
    margin = 65;
    headWidth = 45;
    indent: 5;
    bubbleSize: rect[] = [];
    positiveRuleAgg: RuleAgg[] = [];
    negativeRuleAgg: RuleAgg[] = [];
    // the selected bubble's offsite
    yOffset:number = 0
    // the offset of bubbles under the selected one
    yDown:{i:number,offset:number}={i:0,offset:0};
    // the offset of bubbles upper of the selected one
    yUp:{i:number,offset:number}={i:0,offset:0}

    // the list recording all rule rect position (left up point)
    yList:{y:number,h:number,r:string[]}[] = []; 
    compYList :{y:number,h:number,r:string[]}[] = []; 
    // inital value for rect
    ySumList:number[] = [];

    // record the max y-value
    yMaxValue = 0;
    // record the max x-value
    xMaxValue = 0;
    borderHeight:any;
    // length of pos 
    pLenght = 0;
    rulesLength:number = 0;
    maxOffset:number=0;
    bubblePosition:rect[] =[];
    scoreColor = (score: number) => {
        let [minScore, maxScore] = d3.extent(this.props.rules.map(rule => rule.risk_dif))
        if (score < 0) {
            return d3.interpolateGreens(
                d3.scaleLinear()
                    .domain([minScore, 0])
                    .range([0.8, 0.3])(score)
            )
        } else {
            return d3.interpolateOranges(
                d3.scaleLinear()
                    .domain([0, maxScore])
                    .range([0.3, 0.65])(score)
            )
        }

    }

    constructor(props: Props) {
        super(props)
        this.state = {
            expandRules: {},
            hoverRule: undefined,
            highlightRules: {},
            bubblePosition:[],
        }
        this.toggleExpand = this.toggleExpand.bind(this)
        this.drawRuleAgg = this.drawRuleAgg.bind(this)
        this.drawRuleNode = this.drawRuleNode.bind(this)
        this.drawBubbles = this.drawBubbles.bind(this)
        this.toggleHighlight = this.toggleHighlight.bind(this)
    }

    toggleExpand(numberID:number,id: string, newAttrs: string[], children: string[]) {
        // this.props.onTransExpandRule({id: numberID, newAttrs: newAttrs, children: children})
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
    }
    toggleHighlight(ruleAggID: string, ruleID: string) {
        let { highlightRules } = this.state
        if (!highlightRules[ruleAggID]) {
            highlightRules[ruleAggID] = [ruleID]
        } else {
            let idx = highlightRules[ruleAggID].indexOf(ruleID)
            if (idx == -1) {
                highlightRules[ruleAggID].push(ruleID)
            } else {
                highlightRules[ruleAggID].splice(idx, 1)
            }
        }

        this.setState({ highlightRules })
    }
    drawRuleNode(ruleNode: RuleNode, offsetX: number, offsetY: number, switchOffset:number, favorPD: boolean, itemScale: d3.ScaleLinear<number, number>, ruleAggID: string, listNum: number = 0): { content: JSX.Element[], offsetY: number,switchOffset:number } {
        let { rule, children } = ruleNode
        let { antecedent, items, id } = rule
        let { barWidth, step, keyAttrNum, showAttrNum, dragArray } = this.props
        let { highlightRules } = this.state

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
            (e: React.SyntheticEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.toggleExpand(
                    listNum,
                    id.toString(),
                    newAttrs,
                    children.map(child => child.rule.id.toString())
                )
            }
        let isExpand = this.state.expandRules.hasOwnProperty(id)

        let indent = -this.headWidth + this.headWidth * 0.2 * offsetX
        // let outCircleRadius = this.lineInterval * 0.8
        // let progressBarWidth = 5
        // let inCircleRadius = this.lineInterval * 0.8 - progressBarWidth*1.5

        let inConf = Math.min(rule.conf_pd, rule.conf_pnd)

        let progressBarWidth = this.lineInterval * 0.2
        let outRadius = itemScale(items.length)
        let inRadius = outRadius - progressBarWidth * 1.1
        let innerArc: any = d3.arc()
            .innerRadius(inRadius)
            .outerRadius(inRadius + progressBarWidth)
            .cornerRadius(progressBarWidth / 2)

        let outerArc: any = d3.arc()
            .innerRadius(outRadius)
            .outerRadius(outRadius + progressBarWidth)
            .cornerRadius(progressBarWidth / 2)


        let parent = <g className={`${ruleNode.rule.id} rule`}
            transform={`translate(${this.maxOffset}, ${switchOffset})`}

            // tslint:disable-next-line:jsx-no-lambda
            onMouseEnter={() => {
                this.setState({ hoverRule: rule.id.toString() })
            }
            }
            // tslint:disable-next-line:jsx-no-lambda
            onMouseLeave={() => {
                this.setState({ hoverRule: undefined })
            }
            }
            // tslint:disable-next-line:jsx-no-lambda
            onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                let ruleID = rule.id.toString()
                let { highlightRules } = this.state, idx = highlightRules[ruleAggID].indexOf(ruleID)
                if (idx == -1) {
                    highlightRules[ruleAggID] = [...highlightRules[ruleAggID], ruleID]
                } else {
                    highlightRules[ruleAggID].splice(idx, 1)
                }
                this.setState({ highlightRules })
            }
            }
        >
            <g
                className="score"
                transform={`translate(${-itemScale.range()[1] + indent - this.headWidth * 0.1}, ${this.lineInterval * 0.5})`}
            >

                <path
                    className="background in"
                    d={innerArc({
                        startAngle: 0,
                        endAngle: Math.PI * 2
                    })}
                    fill="#eee"
                />

                <path
                    className="in bar"
                    d={innerArc({
                        startAngle: 0,
                        endAngle: Math.PI * 2 * rule.conf_pd
                    })}
                    fill={this.scoreColor(Math.pow(10, -5))}
                />
                <g className='in gradientArc'>
                    {d3.range(Math.floor((rule.conf_pd - inConf) * 50))
                        .map(i => {
                            return <path key={i} className="out bar"
                                d={innerArc({
                                    startAngle: Math.PI * 2 * (inConf + i / 50),
                                    endAngle: Math.PI * 2 * (inConf + (i + 1) / 50),
                                })}
                                fill={this.scoreColor((i + 1) / 50)}
                            />
                        })}
                </g>
                <path
                    className="background out"
                    fill='#eee'
                    d={outerArc({
                        startAngle: 0,
                        endAngle: Math.PI * 2
                    })}
                />
                {/* <path
                    className="in conf bar"
                    fill="#98E090"
                    d = {innerArc({
                        startAngle:Math.PI*2*inConf,
                        endAngle: Math.PI*2*rule.conf_pnd
                    })}
                /> */}
                <path
                    className="out conf bar"
                    // fill={d3.interpolateGreens(0.2)}
                    fill={this.scoreColor(-Math.pow(10, -6))}
                    d={outerArc({
                        startAngle: 0,
                        endAngle: Math.PI * 2 * rule.conf_pnd
                    })}
                />
                <g className='out gradientArc'>
                    {d3.range(Math.floor((rule.conf_pnd - inConf) * 360))
                        .map(i => {
                            return <path key={i} className="out bar"
                                d={outerArc({
                                    startAngle: Math.PI * 2 * (inConf + i / 360),
                                    endAngle: Math.PI * 2 * (inConf + (i + 1) / 360),
                                })}
                                fill={this.scoreColor(-(i + 1) / 360)}
                            />
                        })}
                </g>
                {/* <g className='pin icon' transform={`translate(${0}, ${-itemScale.range()[1]})`} opacity={0}>{PIN}</g> */}

                {/* <text textAnchor='middle' fontSize={this.lineInterval-progressBarWidth} y={ (this.lineInterval-progressBarWidth)/2 }>
                    {rule.risk_dif.toFixed(2).replace('0.', '.')}
                </text> */}
            </g>
            <text fontSize={this.fontSize} y={this.lineInterval} textAnchor="end" x={-this.headWidth - 2 * outRadius}>
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
                    opacity={highlightRules[ruleAggID] ? (highlightRules[ruleAggID].includes(rule.id.toString()) ? 1 : 0) : 0}
                    // // tslint:disable-next-line:jsx-no-lambda
                    // onClick={(e: React.MouseEvent) => {
                    //     e.stopPropagation()
                    //     e.preventDefault()
                    //     this.toggleHighlight(ruleAggID, rule.id.toString())
                    // }
                    // }
                    cursor='pointer'>
                    <rect width={-indent} height={2 * this.lineInterval} y={-this.lineInterval} x={0} fill='transparent' />
                    {PIN}
                </g>
                {/* <line 
            x1={-this.headWidth} y1={0} 
            x2={0} y2={0} 
            stroke="#444" 
            /> */}
            </g>
            <g transform={`translate(${-15}, ${this.lineInterval})`} cursor='pointer' className='single rule'>
                <line className="ruleBoundary"
                    x1={indent} y1={this.lineInterval * 0.5}
                    x2={window.innerWidth} y2={this.lineInterval * 0.5}
                    stroke="#f0f0f0"
                />
                <g className="expand icon" transform={`translate(${0}, ${-this.lineInterval / 4})`} onClick={toggleExpand}>
                    {/* <foreignObject>
                        <Icon type="pushpin" style={{fontSize:this.lineInterval*0.6}}/>
                    </foreignObject> */}
                    {ruleNode.children.length == 0 ?
                        //             <text className="icon" > o
                        // </text> :
                        //             <text className="icon"
                        //                 transform={`rotate(${isExpand ? 90 : 0} ${this.lineInterval / 4} ${-this.lineInterval / 4})`}>
                        //                 >
                        // </text>
                        <circle className="icon"
                            // fill='none' stroke='#c3c3c3' strokeWidth={2}
                            fill='#c3c3c3' strokeWidth={1} stroke='#c3c3c3'
                            r={this.lineInterval * 0.1}
                            cx={this.lineInterval * 0.3}
                            cy={-this.lineInterval * 0.3}
                        />
                        : <polygon className="icon"
                            fill='#c3c3c3' strokeWidth={1} stroke='#c3c3c3'
                            strokeLinejoin="round"
                            transform={`rotate(${isExpand ? 90 : 0} ${this.lineInterval / 4} ${-this.lineInterval / 4})`}
                            points={`
                                ${0},${this.lineInterval * 0.1} 
                                ${0},${-this.lineInterval * 0.7} 
                                ${this.lineInterval * 0.4},${this.lineInterval * (-0.3)}
                                `}
                        />
                    }
                </g>
            </g>
            {
                antecedent.map((attrVal) => {
                    let [attr, val] = attrVal.split('=')
                    let ranges = getAttrRanges(this.props.samples, attr).filter(r => typeof (r) == 'string'),
                        rangeIdx = ranges.indexOf(val)
                    this.xMaxValue = Math.max(this.xMaxValue,step * showAttrs.indexOf(attr)+barWidth)

                    let barWidthTep = barWidth / ranges.length
                    let startX = barWidth / ranges.length * rangeIdx
                    let rangeLabel:string[]= ['', '']

                    if(val.includes('<')||val.includes('>')){
                        let range = val
                        let rangeLeft:number,rangeRight:number
        
                        let maxTemp:any = -Infinity
                                this.props.samples.forEach(s =>{
                                    if(s[attr]>maxTemp){
                                        maxTemp = s[attr]
                                    }
                                })
                        let minTemp:any = Infinity
                        this.props.samples.forEach((s) =>{
                                    if(s[attr]<minTemp){
                                        minTemp = s[attr]
                                    }
                                })
                        if(range.includes('<x<')){
                                let split = range.split('<x<')
                                rangeLeft = parseInt(split[0])
                                rangeRight = parseInt(split[1])
                                rangeLabel = split
                        }else if(range.includes('x<')){
                                let split = range.split('x<')
                                rangeLeft = minTemp
                                rangeRight = parseInt(split[1]) 
                                rangeLabel[1] = split[1]
                        }else if(range.includes('x>')){
                                let split = range.split('x>')
                                rangeLeft = parseInt(split[1])
                                rangeRight = maxTemp
                                rangeLabel[0] = split[1]
                        }
                        
                        barWidthTep = (rangeRight - rangeLeft)*barWidth/(maxTemp-minTemp)
                        startX = (rangeLeft-minTemp)*barWidth/(maxTemp-minTemp)
                    }
                    return <g key={attrVal}>
                        {/* <rect className='ruleBox' 
            stroke='#666' fill='none' 
            strokeWidth='1px'
            x={-20} y={-0.25*this.lineInterval}
            height={this.lineInterval*1.5} width={step*showAttrs.length + 20}/> */}

                        <rect className='background'
                            width={barWidth} height={this.lineInterval}
                            x={step * showAttrs.indexOf(attr)}
                            fill='#fff'
                            // fill='none'
                            // stroke={favorPD ? "#98E090" : "#FF772D"}
                            stroke={this.scoreColor(ruleNode.rule.risk_dif)}
                            strokeWidth={2}
                        />
                        
                        <rect className='font'
                                width={barWidthTep} height={this.lineInterval}
                                x={step * showAttrs.indexOf(attr) + startX}
                                // fill={favorPD ? "#98E090" : "#FF772D"}
                                fill={this.scoreColor(ruleNode.rule.risk_dif)}
                                onMouseEnter={() => {
                                    this.props.onChangeSelectedBar([attr, val])
                                }}
                                onMouseLeave={() => {
                                    this.props.onChangeSelectedBar(['', ''])
                                }}
                        />
                        <g className='range_label' 
                        style={{fontSize:11, fill: '#555'}}
                        transform={`translate(${step * dragArray.indexOf(attr) + startX}, ${this.lineInterval})`}
                        >
                        <text x={0}
                            textAnchor='end'
                            y={-3}
                        >
                            {rangeLabel[0]}
                        </text>

                        <text x={barWidthTep}
                            textAnchor='start'
                            y={-3}
                        >
                            {rangeLabel[1]}
                        </text>
                        </g>
                    </g>
                }
                )}
        </g>
        offsetY = offsetY + 2 * this.lineInterval
        switchOffset = switchOffset + 2 * this.lineInterval
        offsetX += 1

        let content = [parent]
        if (isExpand) {
            let children: JSX.Element[] = []
            for (let childNode of ruleNode.children) {
                let { content: child, offsetY: newY, switchOffset: switchNewY } = this.drawRuleNode(childNode, offsetX, offsetY, switchOffset, favorPD, itemScale, ruleAggID, listNum)
                children = children.concat(child)
                offsetY = newY
                switchOffset = switchNewY
            }
            content = content.concat(children)
        }
        return { content, offsetY, switchOffset }
    }

    drawRuleAgg(ruleAgg: RuleAgg, favorPD: boolean,numberID:number) {
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

        let toggleExpand = (e: React.SyntheticEvent) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleExpand(numberID,id.toString(), newAttrs, nodes.map(child => child.rule.id.toString()))
        }

        let isExpand = this.state.expandRules.hasOwnProperty(id)
        let itemSizeLabel = <text fontSize={this.fontSize} key='itemSize' y={this.lineInterval} textAnchor="end" x={-this.headWidth }>
            {items.length}
        </text>
        let attrValContent = antecedent.map((attrVal => {
            let [attr, val] = attrVal.split('=')
            let ranges = getAttrRanges(this.props.samples, attr).filter(r => typeof (r) == 'string'),
                rangeIdx = ranges.indexOf(val)

            let rangeLabel:string[]= ['', '']

            let barWidthTep = barWidth / ranges.length
            let startX = barWidth / ranges.length * rangeIdx
            if(val.includes('<')||val.includes('>')){
                let range = val
                let rangeLeft:number,rangeRight:number

                let maxTemp:any = -Infinity
                        this.props.samples.forEach(s =>{
                            if(s[attr]>maxTemp){
                                maxTemp = s[attr]
                            }
                        })
                let minTemp:any = Infinity
                this.props.samples.forEach((s) =>{
                            if(s[attr]<minTemp){
                                minTemp = s[attr]
                            }
                        })
                let falg = 0
                if(range.includes('<x<')){
                        let split = range.split('<x<')
                        rangeLeft = parseInt(split[0])
                        rangeRight = parseInt(split[1])
                        rangeLabel = split
                }else if(range.includes('x<')){
                        let split = range.split('x<')
                        rangeLeft = minTemp
                        rangeRight = parseInt(split[1]) 
                        rangeLabel[1] = split[1]
                }else if(range.includes('x>')){
                        let split = range.split('x>')
                        rangeLeft = parseInt(split[1])
                        rangeRight = maxTemp
                        rangeLabel[0] = split[1]
                        falg=1
                }
                
                barWidthTep = (rangeRight - rangeLeft)*barWidth/(maxTemp-minTemp)
                startX = (rangeLeft-minTemp)*barWidth/(maxTemp-minTemp)
                if(falg==1){
                    console.log('2',step * dragArray.indexOf(attr) + startX)
                }
            }
            return <g key={attrVal} className='ruleagg attrvals'>
                <rect className='background'
                    width={barWidth} height={this.lineInterval}
                    x={step * dragArray.indexOf(attr)}
                    // fill='#eee'
                    fill='none'
                    // stroke={favorPD ? "#98E090" : "#FF772D"}
                    stroke={this.scoreColor(favorPD ? Math.pow(10, -6) : -Math.pow(10, -6))}
                    strokeWidth={2}
                />
                <rect className='font'
                    width={barWidthTep} height={this.lineInterval}
                    x={step * dragArray.indexOf(attr) + startX}
                    // fill={favorPD ? "#98E090" : "#FF772D"} 
                    fill={this.scoreColor(favorPD ? Math.pow(10, -6) : -Math.pow(10, -6))}
                />
                <g className='range_label' 
                style={{fontSize:11, fill: '#555'}}
                transform={`translate(${step * dragArray.indexOf(attr) + startX}, ${this.lineInterval})`}
                >
                <text x={0}
                    textAnchor='end'
                    y={-3}
                >
                    {rangeLabel[0]}
                </text>

                <text x={barWidthTep}
                    textAnchor='start'
                    y={-3}
                >
                    {rangeLabel[1]}
                </text>
                </g>
            </g>
        }
        ))

        this.xMaxValue=Math.max(this.xMaxValue,step * keyAttrNum + this.headWidth + 2*this.fontSize-this.headWidth-2*this.fontSize)

        let content = <g className='ruleagg'>
            {/* <Bubble ruleAgg={ruleAgg}/> */}
            <rect className='ruleBox'
                stroke='#c3c3c3' fill='#fff'
                strokeWidth='2px'
                rx={2} ry={2}
                x={-this.headWidth-2*this.fontSize} y={-0.5 * this.lineInterval}
                height={this.lineInterval * 2} width={step * keyAttrNum + this.headWidth + 2*this.fontSize} />
            {itemSizeLabel}
            <g className="icon" transform={`translate(${-15}, ${this.lineInterval * 0.75})`} cursor='pointer' onClick={toggleExpand}>

                <polygon className="icon"
                    fill='#c3c3c3' strokeWidth={1} stroke='#c3c3c3'
                    strokeLinejoin="round"
                    transform={`rotate(${isExpand ? 90 : 0} ${this.lineInterval / 4} ${-this.lineInterval / 4})`}
                    points={`
                    ${0},${this.lineInterval * 0.1} 
                    ${0},${-this.lineInterval * 0.7} 
                    ${this.lineInterval * 0.4},${this.lineInterval * (-0.3)}
                    `}
                />
            </g>
            {attrValContent}
        </g>

        return content
    }
    drawBubbles(ruleAggs: RuleAgg[], scoreDomain: [number, number], posFlag: boolean) {
        // let { compFlag} = this.props
        let { expandRules, bubblePosition } = this.state
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
        showIDs = showIDs.filter(id => !id.includes('agg'))

        let initI = posFlag?0:bubblePosition.length - ruleAggs.length
        return <g className='bubbles' transform={`translate(${0}, ${0})`}>
            {
                ruleAggs
                    .map((ruleAgg, i) => {
                        i += initI
                        let transX = 5
                        let transY = 0
                        // calculate translate distance
                        if (bubblePosition.length == this.rulesLength) {
                                transY = bubblePosition[i].y
                        }
                        // first state bubble ot obtain the bubbleSize to calculate translate
                        let bubble = <Bubble
                            ref={(ref: any) => {
                                if (ref) {
                                    this.bubbleSize.push({ x: 0, y: 0, w: ref.getSize()[0], h: ref.getSize()[1] })
                                }
                            }

                            }
                            ruleAgg={ruleAgg}
                            scoreColor={this.scoreColor}
                            showIDs={showIDs}
                            hoverRule={this.state.hoverRule}
                            highlightRules={this.state.highlightRules[ruleAgg.id] || []}
                            samples={this.props.samples}
                            protectedVal={this.props.protectedVal}
                        />
                        let bubbleLine:any
                        if(bubblePosition.length == this.rulesLength){
                            bubbleLine = <path d={`M${bubblePosition[i].x+bubblePosition[i].w/2},${bubblePosition[i].h/2-2}
                             h${window.innerWidth*0.2-bubblePosition[i].x},${0}`} style={{fill:'none',stroke:'#bbb',strokeWidth:3}}/>
                        }
                        return <g key={'bubble_' + ruleAgg.id} className='bubblesAgg'
                            transform={`translate(${transX},${transY})`}
                        >
                            {bubbleLine}
                            {bubble}
                        </g>
                    }
                    )
            }
        </g>
    }
    compareString(array1:any[],array2:any[]){
        let is_same = true
        if (array1.length == array2.length) {
            array1.map((element, index) => {
                is_same = is_same && (element == array2[index]) && (element == array2[index]);
            })
        } else {
            is_same = false
        }
        return is_same
    }

    compareTransY(i:number,ante:string[]){
        let compList = this.props.compareList
        let outputBubble = -1,
        outputRect = -1
        if(compList.b2.length!=0){
            compList.b2.forEach((bubble,i)=>{
                if((this.compareString(ante,compList.r[i].r))&&(i<compList.p)){
                    outputBubble = bubble.y
                    outputRect = compList.r[i].y
                }
            }) 
        }
        return {bubble:outputBubble,rect:outputRect}
    }

    draw() {
        
        let { rules, samples, keyAttrNum, dragArray} = this.props
        let { expandRules } = this.state
        // let samples_numerical = samples.slice(0,1000)
        samples = samples.slice(Math.floor(samples.length / 2), samples.length)

        let keyAttrs = dragArray.slice(0, keyAttrNum)

        let itemMax = Math.max(...rules.map(d => d.items.length)), itemMin = Math.min(...rules.map(d => d.items.length)),
            itemScale = d3.scaleLinear()
                .domain([itemMin, itemMax])
                .range([this.lineInterval * 0.4, this.lineInterval * 0.85])

        // aggregate based on key attributes
        let results = ruleAggregate(rules, dragArray.filter(attr => keyAttrs.includes(attr)), samples)


        let { positiveRuleAgg, negativeRuleAgg } = results
        this.positiveRuleAgg = positiveRuleAgg
        this.negativeRuleAgg = negativeRuleAgg
        // recording the rect postion for bubble positioning
        let offsetY = 0
        // recording the rect position based on bubble position
        let switchOffset = 0
        let posRules: JSX.Element[] = []
        this.yList = []
        this.compYList = []

        let arrayLength = positiveRuleAgg.length + negativeRuleAgg.length

        let comparedCounter = 0
        // positive, orange
        positiveRuleAgg.forEach((ruleAgg, i) => {
            
            let ySum = 0
            let compY = 0
            if(this.ySumList.length!=0){
                ySum = this.ySumList[i]
            }
            if(i!=0){
                offsetY += 0.3 * this.lineInterval
                switchOffset += 0.3 * this.lineInterval
            }
            // choose rect display mode
            if(this.bubblePosition.length==arrayLength){
                let comparedY = 0
                // suject1:compared model's corresponding y-axis value
                if(this.props.compareOffset.index.includes(i)){
                    comparedY = this.lineInterval + this.props.compareOffset.y[comparedCounter]
                    comparedCounter += 1
                }
                // subject2: whether the former rect is expanded
                let formerRectY = 0
                if(i!=0){
                    formerRectY = this.yList[i-1].y+this.yList[i-1].h*2 + this.lineInterval
                }
                // subject3: whether the former bubble overlap
                let bubbleY = 0
                if(i!=0){
                    bubbleY = this.bubblePosition[i-1].h + this.bubblePosition[i-1].y+this.bubblePosition[i].h/2
                }
                switchOffset = Math.max(ySum,comparedY,formerRectY,bubbleY)-this.lineInterval
                compY = i==0?switchOffset+this.lineInterval:Math.max(bubbleY,formerRectY)
            }

            // calculate average y-value of an itemset
            let posAveY = switchOffset
            posRules.push(
                <g key={ruleAgg.id} id={`${ruleAgg.id}`} transform={`translate(${this.maxOffset}, ${switchOffset})`} className="rule" >
                    {
                        this.drawRuleAgg(ruleAgg, true,i)
                    }
                </g>
            )
            offsetY = offsetY + 2 * this.lineInterval
            switchOffset += 2 * this.lineInterval
            if (expandRules.hasOwnProperty(ruleAgg.id)) {
                for (let ruleNode of ruleAgg.nodes) {
                    let { content, offsetY: newY, switchOffset:switchNew } = this.drawRuleNode(ruleNode, 1, offsetY,switchOffset, true, itemScale, ruleAgg.id.toString(), i)
                    offsetY = newY
                    posRules = posRules.concat(content)
                    switchOffset = switchNew 
                }
            }
            let hPos = (switchOffset - posAveY )/ 2
            // posAveY = (posAveY + switchOffset) / 2
            posAveY += this.lineInterval
            this.yMaxValue = Math.max(this.yMaxValue,offsetY)
            
            this.compYList.push({y:compY,h:hPos,r:ruleAgg.antecedent})
            this.yList.push({y:posAveY,h:hPos,r:ruleAgg.antecedent})

        })  
        this.pLenght = positiveRuleAgg.length
        
        // negtive, green
        let negaRules: JSX.Element[] = [] 
        negativeRuleAgg.forEach((ruleAgg,i)=> {
            i += positiveRuleAgg.length
            let ySum = 0
            let compY = 0
            if(this.ySumList.length!=0){
                ySum = this.ySumList[i]
            }
            if(i!=0){
                offsetY += 0.3 * this.lineInterval
                switchOffset += 0.3 * this.lineInterval
            }
            // choose rect display mode
            if(this.bubblePosition.length==arrayLength){
                let comparedY = 0
                // suject1:compared model's corresponding y-axis value
                if(this.props.compareOffset.index.includes(i)){
                    comparedY = this.lineInterval + this.props.compareOffset.y[comparedCounter]
                    comparedCounter += 1
                }
                // subject2: whether the former rect is expanded
                let formerRectY = 0
                if(i!=0){
                    formerRectY = this.yList[i-1].y+this.yList[i-1].h*2 + this.lineInterval
                }
                // subject3: whether the former bubble overlap
                let bubbleY = 0
                if(i!=0){
                    bubbleY = this.bubblePosition[i-1].h + this.bubblePosition[i-1].y+this.bubblePosition[i].h/2
                }
                switchOffset = Math.max(ySum,comparedY,formerRectY,bubbleY)-this.lineInterval
                compY = i==0?switchOffset+this.lineInterval:Math.max(bubbleY,formerRectY)
            }
            
            // calculate average y-value of an itemset
            let negAveY = switchOffset

            negaRules.push(
                <g key={ruleAgg.id} id={`${ruleAgg.id}`} transform={`translate(${this.maxOffset}, ${switchOffset})`} className="rule">
                    {
                        this.drawRuleAgg(ruleAgg, false,i)
                    }
                </g>
            )
            offsetY = offsetY + 2 * this.lineInterval
            switchOffset += 2*this.lineInterval
            if (expandRules.hasOwnProperty(ruleAgg.id)) {
                for (let ruleNode of ruleAgg.nodes) {
                    let { content, offsetY: newY, switchOffset:swtichNew } = this.drawRuleNode(ruleNode, 1, offsetY,switchOffset, false, itemScale, ruleAgg.id.toString(), i)
                    offsetY = newY
                    switchOffset = swtichNew
                    negaRules = negaRules.concat(content)
                }
            }
            let hNeg = (switchOffset - negAveY) / 2  
            negAveY += this.lineInterval
            // negAveY = (negAveY + switchOffset) / 2
            this.yMaxValue = Math.max(this.yMaxValue,offsetY)

            this.compYList.push({y:compY,h:hNeg,r:ruleAgg.antecedent})
            this.yList.push({y:negAveY,h:hNeg,r:ruleAgg.antecedent})
        })

        /**
         *  Not matched ruleaggs to see distribution
         */
        // positive, orange
        let {unMatchedRules} = this.props
        let posRulesUnMatched: JSX.Element[] = []
        unMatchedRules.pos.forEach((ruleAgg, i) => {
            
            if(!isNaN(ruleAgg[1])){
                posRulesUnMatched.push(
                    <g key={ruleAgg[0].id} id={`${ruleAgg[0].id}`} transform={`translate(${this.maxOffset}, ${ruleAgg[1]-this.lineInterval})`} className="rule" >
                        {
                            this.drawRuleAgg(ruleAgg[0], true,i)
                        }
                        <path d={`M${-this.headWidth-2*this.fontSize},${this.lineInterval} h${-this.maxOffset/3}`} style={{stroke:'#bbb',strokeWidth:3}}></path>
                        <circle cx={-this.headWidth-2*this.fontSize-this.maxOffset/3-5} cy = {this.lineInterval} r={5} style={{fill:'none',stroke:'#bbb',strokeWidth:3}}></circle>
                    </g>
                )
                this.yMaxValue = Math.max(this.yMaxValue,ruleAgg[1])
            }
        })  
        
        // negtive, green
        let negaRulesUnMatched: JSX.Element[] = [] 
        unMatchedRules.neg.forEach((ruleAgg,i)=> {
            i += unMatchedRules.pos.length 
            if(!isNaN(ruleAgg[1])){
               negaRulesUnMatched.push(
                <g key={ruleAgg[0].id} id={`${ruleAgg[0].id}`} transform={`translate(${this.maxOffset}, ${ruleAgg[1]-this.lineInterval})`} className="rule">
                    {
                        this.drawRuleAgg(ruleAgg[0], false,i)
                    }
                    <path d={`M${-this.headWidth-2*this.fontSize},${this.lineInterval} h${-this.maxOffset/3}`} style={{stroke:'#bbb',strokeWidth:3}}></path>
                    <circle cx={-this.headWidth-2*this.fontSize-this.maxOffset/3-5} cy = {this.lineInterval} r={5} style={{fill:'none',stroke:'#bbb',strokeWidth:3}}></circle>
                </g>
                ) 
                this.yMaxValue = Math.max(this.yMaxValue,ruleAgg[1])
            }            
        })
        this.rulesLength = negativeRuleAgg.length + positiveRuleAgg.length

        let scoreDomain = d3.extent(rules.map(rule => rule.risk_dif))
        let bubbles = [this.drawBubbles(positiveRuleAgg, scoreDomain, true), this.drawBubbles(negativeRuleAgg, scoreDomain, false)]

        return <g key='rules' transform={`translate(${0}, ${this.margin})`}>   
                        
            <g className='bubbles'>
                {bubbles}
            </g>
            <g className='positive rules'>
                {posRules}
            </g>
            <g className='negative rules'>
                {negaRules}
            </g>
            <g className='positive rules unMatched'>
                {posRulesUnMatched}
            </g>
            <g className='negative rules unMatched'>
                {negaRulesUnMatched}
            </g>
        </g>
    }
    componentDidMount() {
        // if (
        //     prevProp.ruleThreshold[0] != this.props.ruleThreshold[0]
        //     || prevProp.ruleThreshold[1] != this.props.ruleThreshold[1]
        //     || prevProp.rules[0].pd != this.props.rules[0].pd
        // ) {
        //     this.setState({ expandRules: {} })
        // }
        // let { highlightRules } = this.state
        // let { negativeRuleAgg, positiveRuleAgg } = this
        // negativeRuleAgg.forEach(ruleAgg => {
        //     if (!highlightRules[ruleAgg.id.toString()]) {
        //         highlightRules[ruleAgg.id.toString()] = ruleAgg.nodes.map(node => node.rule.id.toString()).slice(0, 2)
        //     }
        // })
        // positiveRuleAgg.forEach(ruleAgg => {
        //     if (!highlightRules[ruleAgg.id.toString()]) {
        //         highlightRules[ruleAgg.id.toString()] = ruleAgg.nodes.map(node => node.rule.id.toString()).slice(0, 2)
        //     }
        // })
        // this.setState({ highlightRules })
    }
    componentWillReceiveProps(nextProps:Props){
        //  don't know why i cannot call getDerivedStateFromProps, debug later
        // rule aggregate
        let { rules, samples, keyAttrNum, dragArray } = nextProps
        // let samples_numerical = samples.slice(0,1000)
        samples = samples.slice(Math.floor(samples.length / 2), samples.length)
        let keyAttrs = dragArray.slice(0, keyAttrNum)

        let { positiveRuleAgg, negativeRuleAgg } = ruleAggregate(rules, keyAttrs, samples)
        this.positiveRuleAgg = positiveRuleAgg
        this.negativeRuleAgg = negativeRuleAgg

        // initial default highlight rules
        let { highlightRules } = this.state
        negativeRuleAgg.forEach(ruleAgg => {
            if (!highlightRules[ruleAgg.id.toString()]) {
                highlightRules[ruleAgg.id.toString()] = []
                // highlightRules[ruleAgg.id.toString()] = ruleAgg.nodes.map(node => node.rule.id.toString()).slice(0, 2)
            }
        })
        positiveRuleAgg.forEach(ruleAgg => {
            if (!highlightRules[ruleAgg.id.toString()]) {
                highlightRules[ruleAgg.id.toString()] = []
                // highlightRules[ruleAgg.id.toString()] = ruleAgg.nodes.map(node => node.rule.id.toString()).slice(0, 2)
            }
        })
        this.setState({ highlightRules })
    }
    findMaxRect(bubblePosition: rect[], num: number) {
        let maxBubble: rect
        let maxHeight = -Infinity
        for (var i = 0; i < num; i++) {
            if (bubblePosition[i].h + bubblePosition[i].y > maxHeight) {
                maxHeight = bubblePosition[i].h + bubblePosition[i].y
                maxBubble = bubblePosition[i]
            }
        }
        return maxBubble
    }

    findDirectAxis(bubblePosition:rect[],i:number){
        let pos = bubblePosition

        return pos[i-1].y + pos[i-1].h
    }

    compareArray(array1:any[],array2:any[]){
        let is_same = true
        if (array1.length == array2.length) {
            array1.map((element, index) => {
                is_same = is_same && ((Math.abs(element.x - array2[index].x)<1) && (Math.abs(element.y - array2[index].y)<1));
            })
        } else {
            is_same = false
        }
        return is_same
    }
    compareYList(array1:any[],array2:any[]){
        let is_same = true
        if (array1.length == array2.length) {
            array1.map((element, index) => {
                is_same = is_same && ((Math.abs(element.y - array2[index].y)<1) && (Math.abs(element.h - array2[index].h)<1));
            })
        } else {
            is_same = false
        }
        return is_same
    }
    componentDidUpdate(prevProp: Props) {
        let {compareList} = this.props
        let bubblePosition: rect[] = []
        let maxOffset:number = 0
        // let {compFlag} = this.props
        // use this value to control interval length
        let interval = 1
        this.bubbleSize.forEach((bubble, i) => {
            maxOffset = Math.max(maxOffset,bubble.w+20+this.headWidth+2*this.fontSize)
            let transX = 0,
                transY = 0
            if (i == 0) {
                transY = this.yList[0].y - bubble.h/2
            } else {
                    let directPos:number = this.findDirectAxis(bubblePosition,i)
                    directPos = Math.max(directPos ,this.yList[i].y -bubble.h/2)
                    transY = directPos
            }
            bubblePosition.push({ x: transX, y: transY, w: bubble.w + interval, h: bubble.h + interval })
        })
        this.maxOffset = maxOffset 
        this.props.onChangeOffsetLength(maxOffset)
        // check whether update is needed
        let posIsSame = this.compareArray(this.state.bubblePosition,bubblePosition)
        // update state
        if (!posIsSame) { 
            this.setState({ bubblePosition }) 
            this.bubblePosition = bubblePosition
        }

        let bSum = 0
        this.ySumList = []
        this.bubbleSize.forEach((bubble,i)=>{
            if(i==0){
               bSum += 1/2 * bubble.h 
            }else{
                bSum += 1/2 *(bubble.h+this.bubbleSize[i-1].h)
            }
            this.ySumList.push(bSum)
        })

        // compare model mode
        // for the prime model
        if(compareList.b2){
            let compareIsSame = this.compareYList(this.compYList,compareList.r)
            if(!compareIsSame){
                this.props.onTransCompareList({b2:bubblePosition,r:this.compYList,p:this.pLenght,yMax:this.borderHeight})
            }
        }
    }

    render() {
        let { fetchKeyStatus } = this.props
        let content: JSX.Element = <g />
        this.bubbleSize = []
        
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
        let maxBubble = this.findMaxRect(this.state.bubblePosition,this.state.bubblePosition.length)
        let svgHeight:number = 0
        if(maxBubble){
            svgHeight= Math.max(maxBubble.y + maxBubble.h,this.yMaxValue) + this.margin * 1.5
        }
        if(this.yList.length!=0&&this.bubblePosition.length!=0){
            this.borderHeight = this.yList[this.yList.length-1].y + this.bubblePosition[this.bubblePosition.length-1].h/2
        }

        let borderHeight = document.getElementsByClassName('itemsetPrime').length?Math.max(document.getElementsByClassName('itemsetPrime')[0].clientHeight,svgHeight):'100%'
        // this.borderHeight = borderHeight
        let borderWidth:any = this.xMaxValue + this.maxOffset + 10
        if(borderWidth<window.innerWidth*5/8){
            borderWidth='100%'
        }
        return (<svg className='itemsetPrime' style={{ width: borderWidth, height: borderHeight}}>
            <g className='rules' >
                {content}
            </g>
        </svg>
        )
    }
}