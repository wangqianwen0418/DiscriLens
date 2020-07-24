import * as React from 'react';
import { DataItem, Status, Rule } from 'types';
import { Icon, Tooltip} from 'antd';
import { ruleAggregate, getAttrRanges, RuleAgg, RuleNode, boundaryColor} from 'Helpers';
import * as d3 from 'd3';

// import Euler from 'components/AppMiddle/Euler';
// import Bubble from 'components/AppMiddle/Bubble';
// import Bubble from 'components/AppMiddle/BubbleForce';
import Bubble from 'components/AppMiddle/BubblePack';

import "./Itemsets.css";

const PIN = <g transform={`scale(0.015) `}>
    <path
        d="M878.3 392.1L631.9 145.7c-6.5-6.5-15-9.7-23.5-9.7s-17 3.2-23.5 9.7L423.8 306.9c-12.2-1.4-24.5-2-36.8-2-73.2 0-146.4 24.1-206.5 72.3a33.23 33.23 0 0 0-2.7 49.4l181.7 181.7-215.4 215.2a15.8 15.8 0 0 0-4.6 9.8l-3.4 37.2c-.9 9.4 6.6 17.4 15.9 17.4.5 0 1 0 1.5-.1l37.2-3.4c3.7-.3 7.2-2 9.8-4.6l215.4-215.4 181.7 181.7c6.5 6.5 15 9.7 23.5 9.7 9.7 0 19.3-4.2 25.9-12.4 56.3-70.3 79.7-158.3 70.2-243.4l161.1-161.1c12.9-12.8 12.9-33.8 0-46.8z"/>
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
    buttonSwitch: boolean,
    dataset:string,
    model:string,
    instanceAggregate: boolean
    onChangeShowAttr: (showAttrs: string[]) => void
    onChangeSelectedBar: (selected_bar: string[]) => void
}
export interface State {
    expandRules: { [id: string]: ExpandRule } // store the new show attributes of the rules that have been expaned
    hoverRule: [string, string], // [ruleID, ruleAggID]
    highlightRules: { [id: string]: string[] }; // the highlight rules in each ruleAGG
    // record all the bubble position when button is true
    bubblePosition: rect[],
    hoveredBubble:string[],
    pressButton:[string,number],
    dataset:string,
    model:string,
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

export default class Itemset extends React.Component<Props, State>{
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
    yDown:{i:number,offset:number}={i:-1,offset:0};
    // the offset of bubbles upper of the selected one
    yUp:{i:number,offset:number}={i:-1,offset:0}

    // the list recording all rule rect position (left up point)
    yList:{y:number,h:number,r:string[]}[] = []; 
    // inital value for rect
    ySumList:number[] = [];
    // origin yList without offset for lineConnection drawing
    yListOrigin:{y:number,h:number,r:string[]}[] = []; 
    // record the max y-value
    yMaxValue = 0;
    // record the max x-value
    xMaxValue = 0;
    // length of pos 
    pLenght = 0;
    expandRulesIndex:number[] = [];
    rulesLength:number = 0;
    bubblePosition:rect[] =[];
    bubblePositionOrigin:rect[]=[];
    expandedFlag:boolean=false;
    expandedNum:number=-1;
    pdColor = [d3.hsl(115, 0.45, 0.72)+'', d3.interpolateOrRd(0.35)]
    scoreColor = (score: number) => {
        let [minScore, maxScore] = d3.extent(this.props.rules.map(rule => rule.risk_dif))
        let maxAbs = Math.max(Math.abs(minScore), Math.abs(maxScore))
        if (score < 0) {
            // // plan 1
            // let t= d3.scaleLinear()
            //         .domain([minScore, 0])
            //         .range([0.75, 0.35])(score)
            // return d3.interpolateGreens(t)

            // // plan 2
            // let t= d3.scaleLinear()
            //         .domain([minScore, 0])
            //         .range([0.7, 0.3])(score)
            // return d3.interpolateGnBu(t)

            // // plan 4
            // let t= d3.scaleLinear()
            //         .domain([minScore, 0])
            //         .range([1, 0])(score)
            // return d3.hsl(186, 0.5-0.2*t, 0.8-0.4*t)+''
            // // return hsvToRgb(160+20*t, 0.44, 0.85-0.2*t);

            // // plan 3
            let t= d3.scaleLinear()
                    .domain([-maxAbs, 0])
                    .range([1, 0])(score)
            return d3.hsl(139, 0.5-0.2*t, 0.9-0.6*t)+''
        } else {
            return d3.interpolateOrRd(
                d3.scaleLinear()
                    .domain([0, maxAbs])
                    .range([0.15, 0.55])(score)
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
            hoveredBubble:[],
            pressButton:['',-1],
            dataset:'',
            model:''
        }
        this.toggleExpand = this.toggleExpand.bind(this)
        this.toggleHighlight = this.toggleHighlight.bind(this)
        this.drawRuleAgg = this.drawRuleAgg.bind(this)
        this.drawRuleNode = this.drawRuleNode.bind(this)
        this.drawBubbles = this.drawBubbles.bind(this)
        this.enterRect = this.enterRect.bind(this)
        this.leaveRect = this.leaveRect.bind(this)
    }
    toggleHighlight(ruleAggID:string, ruleID:string){
        let { highlightRules } = this.state, idx = highlightRules[ruleAggID].indexOf(ruleID)
        if (idx == -1) {
            highlightRules[ruleAggID] = [...highlightRules[ruleAggID], ruleID]
        } else {
            highlightRules[ruleAggID].splice(idx, 1)
        }
        this.setState({ highlightRules })
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
    }

    hoverColor(id: string,enterFlag:boolean) {
        let { expandRules,hoveredBubble } = this.state

        const pushID = (id:string) =>{
            hoveredBubble.push(id)
            if(expandRules[id]){
                for (let childID of expandRules[id].children) {
                    if(!hoveredBubble.includes(childID)){
                        pushID(childID)
                    }
                }  
            }
        }

        if (!enterFlag) {
            hoveredBubble = []
        } else {
            // expand a rule
            pushID(id)
        }

        this.setState({ hoveredBubble })
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

        // let inConf = Math.min(rule.conf_pd, rule.conf_pnd)

        let progressBarWidth = this.lineInterval * 0.25
        let outRadius = itemScale(items.length)
        let inRadius = outRadius - progressBarWidth-1
        let innerArc: any = d3.arc()
            .innerRadius(inRadius)
            .outerRadius(inRadius + progressBarWidth)
            .cornerRadius(progressBarWidth / 2)

        let outerArc: any = d3.arc()
            .innerRadius(outRadius)
            .outerRadius(outRadius + progressBarWidth)
            .cornerRadius(progressBarWidth / 2)

        var highlightIdx = highlightRules[ruleAggID].indexOf(rule.id.toString())
        // console.info(highlightRules[ruleAggID], rule.id, highlightIdx, boundaryColor)


        let parent = <g className={`${ruleNode.rule.id} rule`}
            transform={`translate(${this.props.offset}, ${switchOffset})`}

            // tslint:disable-next-line:jsx-no-lambda
            onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                this.toggleHighlight(ruleAggID, rule.id.toString())
            }
            }
        >
            <Tooltip title={`${rule.conf_pd.toFixed(2)}-${rule.conf_pnd.toFixed(2)}=${rule.risk_dif.toFixed(2)}`}>
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
                        // stroke="transparent"
                    />

                    <path
                        className="in bar"
                        d={innerArc({
                            startAngle: 0,
                            endAngle: Math.PI * 2 * (Math.min(rule.conf_pd, 0.999))
                        })}
                        // fill={this.pdColor[1]}
                        fill={this.scoreColor(this.props.ruleThreshold[1]||0.001)}
                        // stroke="white"
                    />
                
                    <path
                        className="background out"
                        fill='#eee'
                        // stroke="transparent"
                        d={outerArc({
                            startAngle: 0,
                            endAngle: Math.PI * 2
                        })}
                    />
                    <path
                        className="out conf bar"
                        // fill={d3.interpolateGreens(0.2)}
                        // fill={this.pdColor[0]}
                        fill={this.scoreColor(this.props.ruleThreshold[0]||-0.001)}
                        d={outerArc({
                            startAngle: 0,
                            // endAngle: Math.PI * 2 * rule.conf_pnd
                            endAngle: Math.PI * 2 *(Math.min(rule.conf_pnd, 0.999))
                        })}
                        // stroke="white"
                    />
                </g>

            </Tooltip>
            <text fontSize={this.fontSize} y={this.lineInterval-2} textAnchor="end" x={-this.headWidth - 2 * outRadius}>
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
                    fill={highlightIdx==-1?"grey":boundaryColor[highlightIdx]} 
                    stroke={highlightIdx==-1?"grey":boundaryColor[highlightIdx]}
                    transform={`translate(${indent}, ${this.lineInterval * .5}) rotate(${0})`}
                    opacity={highlightRules[ruleAggID] ? (highlightRules[ruleAggID].includes(rule.id.toString()) ? 1 : 0) : 0}
                    cursor='pointer'>
                    {PIN}
                </g>
            </g>
            <g transform={`translate(${-this.lineInterval}, ${this.lineInterval})`} cursor='pointer' className='single rule'>
                <line className="ruleBoundary"
                    x1={indent+ 0.6*this.lineInterval} y1={this.lineInterval * 0.5}
                    x2={step*showAttrs.length+indent+this.lineInterval*2} y2={this.lineInterval * 0.5}
                    stroke={highlightIdx==-1?"#f0f0f0":boundaryColor[highlightIdx]}
                    strokeWidth={2}
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
                        // console.info(ranges)
                    this.xMaxValue = Math.max(this.xMaxValue,step * showAttrs.indexOf(attr)+barWidth)
                    let opacity = 1
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
                    }else{
                        if (rangeIdx>=ranges.length/2){
                            rangeLabel[0] = val
                        }else{
                            rangeLabel[1] = val
                        }
                    }

                    if(keyAttrs.includes(attr)){rangeLabel=['','']}

                    if((this.state.hoveredBubble.length!=0)&&(!this.state.hoveredBubble.includes(String(id)))){opacity=0.3}

                    return <g key={attrVal} >

                        <rect className='background'
                            width={barWidth} height={this.lineInterval}
                            x={step * showAttrs.indexOf(attr)}
                            fill='#fff'
                            // fill='none'
                            // stroke={favorPD ? "#98E090" : "#FF772D"}
                            stroke={this.scoreColor(ruleNode.rule.risk_dif)}
                            strokeWidth={3}
                            opacity={opacity}
                        />
                        
                        <rect className='font'
                                width={barWidthTep} height={this.lineInterval}
                                x={step * dragArray.indexOf(attr) + startX}
                                // width={barWidth / ranges.length} height={this.lineInterval}
                                // x={step * showAttrs.indexOf(attr) + barWidth / ranges.length * rangeIdx}
                                // fill={favorPD ? "#98E090" : "#FF772D"}
                                fill={this.scoreColor(ruleNode.rule.risk_dif)}
                                opacity={opacity}
                                // tslint:disable-next-line:jsx-no-lambda
                                onMouseEnter={() => {
                                    this.setState({ hoverRule: [rule.id.toString(), ruleAggID] })
                                    // this.props.onChangeSelectedBar([attr, val])
                                }}
                                // tslint:disable-next-line:jsx-no-lambda
                                onMouseLeave={() => {
                                    this.setState({ hoverRule: undefined })
                                    // this.props.onChangeSelectedBar(['', ''])
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

    enterRect(i: number) {
        let bubblePosition = this.bubblePosition
        if((bubblePosition.length!=0)){
            let initPos = bubblePosition[i].y,
            maxRect = this.findMaxRect(bubblePosition,i),
            minRect = this.findMinRect(bubblePosition,i)
            // the offset of selected bubble. Equal to bar's central y-value
            this.yOffset = (this.yList[i].y -bubblePosition[i].h/2 - initPos)
            // if there is overlap between the selected bubble and down bubbles, move all of the down bubbles downstairs
            if(minRect&&(this.yList[i].y+this.bubbleSize[i].h>minRect.y)){
                this.yDown = {i:i,offset:this.yList[i].y  + this.bubbleSize[i].h/2-minRect.y}
            }
            // if there is overlap between the selected bubble and up bubbles, move all the up bubbles up
            if(maxRect){
                this.yUp = {i:i,offset: Math.min(-this.state.bubblePosition[i].h/2  + this.yList[i].y - maxRect.y - maxRect.h,0)}
            }
            this.setState({})
        }
    }

    // expandRect(i: number,expandLength:number,flag:boolean=false) {
    //     let bubblePosition = this.bubblePositionOrigin
    //     this.yDown = {offset:0,i:i}
    //     this.yUp = {offset:0,i:i}
    //     this.yOffset = 0
    //     if((bubblePosition.length!=0)&&this.yList.length!=0){
    //         let initPos = bubblePosition[i].y,
    //         maxRect = this.findMaxRect(bubblePosition,i),
    //         // minRect = this.findMinRect(bubblePosition,i),
    //         expandH = this.yList[i].h + expandLength *1.3* this.lineInterval 
    //         // the offset of selected bubble. Equal to bar's central y-value
    //         this.yOffset = (this.yList[i].y +expandH - this.bubbleSize[i].h/2 - initPos) -  this.lineInterval
    //         // if there is overlap between the selected bubble and down bubbles, move all of the down bubbles downstairs
    //         // if(minRect&&(>)){
    //         //     this.yDown = {i:i,offset:}
    //         // }
    //         // if there is overlap between the selected bubble and up bubbles, move all the up bubbles up
    //         if(maxRect&&(maxRect.y+maxRect.h>this.yList[i].y+expandH - this.bubbleSize[i].h/2-this.lineInterval)){
    //             this.yUp = {i:i,offset:this.yList[i].y+expandH - this.bubbleSize[i].h/2-0.7*this.lineInterval-(maxRect.y+maxRect.h)}
    //         }
    //         this.setState({})
    //     }
    // }

    leaveRect() {
        let bubblePosition = this.state.bubblePosition
        if(bubblePosition.length!=0){
            this.yDown = {offset:0,i:-1}
            this.yUp = {offset:0,i:-1}
            this.yOffset = 0
            this.setState({})
        }
    }
    expandRule(listNum:number,expandLength:number){
        // no rules are expanded, expanding a rule now will focus on this rule
        if(this.expandRulesIndex.length==0){
            this.expandedFlag = true
            this.expandRulesIndex.push(listNum)
            this.expandedNum = listNum
            // this.expandRect(listNum,expandLength)
        }
        // some rules are expanded, and the clicked one are the focused one
        else if(this.expandRulesIndex.length!=0&&(this.expandedNum==listNum)){
            // if the focused one is the only element expanded, reset everything
            this.expandRulesIndex.splice(this.expandRulesIndex.indexOf(this.expandedNum),1)
            if(this.expandRulesIndex.length==0){
                this.leaveRect()
                this.expandedFlag = false
                this.expandedNum = -1  
                // console.log(1)
            }
            // if the focused one is not the only element, put the last element in list to focus
            else{
                this.expandedNum = this.expandRulesIndex[this.expandRulesIndex.length-1]
                // this.leaveRect()
                // this.expandRect(this.expandRulesIndex[this.expandRulesIndex.length-1],0,true)
                // console.log(2)
            }
        }
        // some rules are expanded, and the clicked one is not the focused one
        else if(this.expandRulesIndex.length!=0&&(this.expandedNum!=listNum)){
            // if the clicked one is in the list, simply remove it
            if(this.expandRulesIndex.includes(listNum)){
                this.expandRulesIndex.splice(this.expandRulesIndex.indexOf(listNum),1)
                // console.log(3)
            }
            // if the clicked one is not in the list, add this new element into the list and replace the focus one with it
            else{
                this.expandRulesIndex.push(listNum)
                this.expandedNum = listNum
                // this.leaveRect()
                // this.expandRect(listNum,expandLength)
                // console.log(4)
            }
            
        }
        // console.log(this.expandRulesIndex,this.expandedNum)
    }
    drawRuleAgg(ruleAgg: RuleAgg, favorPD: boolean,listNum:number) {
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
            this.toggleExpand(id.toString(), newAttrs, nodes.map(child => child.rule.id.toString()))
            this.expandRule(listNum,nodes.map(child => child.rule.id.toString()).length)
            // if(this.expandRulesIndex.includes(listNum)){
            //     this.expandRulesIndex.splice(this.expandRulesIndex.indexOf(listNum),1)
            // }else{this.expandRulesIndex.push(listNum)}
            
        }
        if(this.state.pressButton[0]){
            if(this.state.pressButton[0]==id){
                         this.toggleExpand(id.toString(), newAttrs, nodes.map(child => child.rule.id.toString()));
                        //  this.expandRule(this.state.pressButton[1],nodes.map(child => child.rule.id.toString()).length)
                         this.setState({pressButton:['',-1]})
                        }
        }

        let isExpand = this.state.expandRules.hasOwnProperty(id)
        let itemSizeLabel = <text 
        fill='#222'
        fontSize={14} key='itemSize' y={this.lineInterval} textAnchor="middle" x={-this.headWidth }>
            {items.length}
        </text>
        let attrValContent = antecedent.map((attrVal => {
            let [attr, val] = attrVal.split('=')
            let ranges = getAttrRanges(this.props.samples, attr).filter(r => typeof (r) == 'string'),
                rangeIdx = ranges.indexOf(val)
            let opacity = 1
            if((this.state.hoveredBubble.length!=0)&&(!this.state.hoveredBubble.includes(id))){opacity=0.3}
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
            }else{
                if (rangeIdx>=ranges.length/2){
                    rangeLabel[0] = val
                }else{
                    rangeLabel[1] = val
                }
            }

            return <g key={attrVal} className='ruleagg attrvals'  
                // tslint:disable-next-line:jsx-no-lambda
                onMouseEnter={() => {
                    if(!this.expandedFlag){
                        this.enterRect(listNum)
                    }
                }
                }
                // tslint:disable-next-line:jsx-no-lambda
                onMouseLeave={() => {
                    if(!this.expandedFlag){
                        this.leaveRect()
                    }
                }
            }>
                <rect className='background'
                    width={barWidth} height={this.lineInterval}
                    x={step * dragArray.indexOf(attr)}
                    // fill='#eee'
                    fill='white'
                    // stroke={favorPD ? "#98E090" : "#FF772D"}
                    stroke={favorPD ? this.pdColor[1] : this.pdColor[0]}
                    strokeWidth={3}
                    opacity={opacity}
                />
                <rect className='font'
                    width={barWidthTep} height={this.lineInterval}
                    x={step * dragArray.indexOf(attr) + startX}
                    // fill={favorPD ? "#98E090" : "#FF772D"} 
                    fill={favorPD ? this.pdColor[1] : this.pdColor[0]}
                    opacity={opacity}
                   
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
            <g className="icon" transform={`translate(${-this.lineInterval}, ${this.lineInterval * 0.75})`} cursor='pointer' onClick={toggleExpand}>

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

    connectionCurve=(d:axis, s:axis)=> {
        let path = `M ${s.x} ${s.y}
                C  ${(s.x + d.x) / 2} ${s.y},
                  ${(s.x + d.x) / 2} ${d.y} ,
                  ${d.x} ${d.y} `
    
        return path
    }

    drawBubbles(ruleAggs: RuleAgg[], scoreDomain: [number, number], posFlag: boolean) {
        let { offset} = this.props
        let { expandRules, bubblePosition, hoverRule, highlightRules } = this.state
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
                        let transX = 0
                        let transY = 0
                        // calculate translate distance
                        if (bubblePosition.length == this.rulesLength) {
                                let rightBorder = offset-this.headWidth-4*this.fontSize
                                transX = rightBorder - bubblePosition[i].x - bubblePosition[i].w
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
                            hoverRule={hoverRule? (hoverRule[1]==ruleAgg.id?hoverRule[0]:undefined) : undefined}
                            highlightRules={[...highlightRules[ruleAgg.id]] || []}
                            samples={this.props.samples}
                            protectedVal={this.props.protectedVal}
                            instanceAggregate ={this.props.instanceAggregate}
                        />

                        // let connectionCurve:any
                        // if(bubblePosition.length == this.rulesLength){
                        //     connectionCurve = <path d={this.connectionCurve({x:bubblePosition[i].w/2,y:bubblePosition[i].h/2}
                        //         ,{x:this.props.offset-this.headWidth-transX-2*this.fontSize,y:this.yList[i].y-transY})} style={{fill:'none',stroke:'#bbb',strokeWidth:3}}/>
                        // }

                        let hoverIn = () =>{
                            this.hoverColor(ruleAgg.id,true)
                        }
                
                        let hoverOut = () =>{
                            this.hoverColor(ruleAgg.id,false)
                        }
                        let clickBubble = (e:any) =>{
                            this.setState({pressButton:[ruleAgg.id,i]})
                            this.expandRule(i,ruleAgg.nodes.map(child => child.rule.id.toString()).length)
                        }
                        
                        let bubbleLine:any
                        if(bubblePosition.length == this.rulesLength){
                            bubbleLine = <path d={`M${bubblePosition[i].x+bubblePosition[i].w/2},${bubblePosition[i].h/2-2}
                             h${this.props.offset-bubblePosition[i].x},${0}`} style={{fill:'none',stroke:'#bbb',strokeWidth:3}}/>
                        }
                        return <g key={'bubble_' + ruleAgg.id} className='bubblesAgg'
                            transform={`translate(${transX},${transY})`}
                            onMouseEnter={this.props.buttonSwitch?hoverIn:null}
                            onMouseOut={this.props.buttonSwitch?hoverOut:null}
                            onClick={clickBubble}
                            cursor={'pointer'}
                        >
                            {this.props.buttonSwitch?null:bubbleLine}
                            {bubble}
                        </g>
                    }
                    )
            }
            
        </g>
    }
    drawConnection(results:any){
        let { offset} = this.props
        let {  bubblePosition } = this.state
        let { positiveRuleAgg, negativeRuleAgg } = results
        return <g>
        {
            positiveRuleAgg
            .map((ruleAgg:any, i:number) => {
                    let transX = 0
                    let transY = 0
                    // calculate translate distance
                    if (bubblePosition.length == this.rulesLength) {
                            let rightBorder = offset-this.headWidth-4*this.fontSize
                            transX = rightBorder - bubblePosition[i].x - bubblePosition[i].w
                            transY = bubblePosition[i].y
                    }
                

                    let connectionCurve:any
                    if(bubblePosition.length == this.rulesLength){
                        connectionCurve = <path d={this.connectionCurve({x:bubblePosition[i].w/2,y:bubblePosition[i].h/2}
                            ,{x:this.props.offset-this.headWidth-transX-2*this.fontSize,y:this.yListOrigin[i].y-transY})} style={{fill:'none',stroke:'#bbb',strokeWidth:3}}/>
                    }
                    
                    
                    return <g key={'bubble_' + ruleAgg.id} className='bubblesAgg'
                        transform={`translate(${transX},${transY})`}
                    >
                        {this.props.buttonSwitch?connectionCurve:null}
                    </g>
            })
        }
        {
            negativeRuleAgg
            .map((ruleAgg:any, i:number) => {
                i+=positiveRuleAgg.length
                    let transX = 0
                    let transY = 0
                    // calculate translate distance
                    if (bubblePosition.length == this.rulesLength) {
                            let rightBorder = offset-this.headWidth-4*this.fontSize
                            transX = rightBorder - bubblePosition[i].x - bubblePosition[i].w
                            transY = bubblePosition[i].y
                    }
                

                    let connectionCurve:any
                    if(bubblePosition.length == this.rulesLength){
                        connectionCurve = <path d={this.connectionCurve({x:bubblePosition[i].w/2,y:bubblePosition[i].h/2}
                            ,{x:this.props.offset-this.headWidth-transX-2*this.fontSize,y:this.yListOrigin[i].y-transY})} style={{fill:'none',stroke:'#bbb',strokeWidth:3}}/>
                    }

                    return <g key={'bubble_' + ruleAgg.id} className='bubblesAgg'
                        transform={`translate(${transX},${transY})`}
                    >
                        {this.props.buttonSwitch?connectionCurve:null}
                    </g>
            })
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


    draw() {
        
        let { rules, samples} = this.props
        let { expandRules } = this.state
        // let samples_numerical = samples.slice(0,1000)
        samples = samples.slice(Math.floor(samples.length / 2), samples.length)

        let itemMax = Math.max(...rules.map(d => d.items.length)), itemMin = Math.min(...rules.map(d => d.items.length)),
            itemScale = d3.scaleLinear()
                .domain([itemMin, itemMax])
                .range([this.lineInterval * 0.4, this.lineInterval * 0.85])

        // aggregate based on key attributes
        
        let {positiveRuleAgg, negativeRuleAgg} = this

        let offsetY = 0
        // recording the rect position based on bubble position
        let switchOffset = 0
        let posRules: JSX.Element[] = []
        this.yList = []
        this.yListOrigin = []

        let arrayLength = positiveRuleAgg.length + negativeRuleAgg.length
        // positive, orange
        positiveRuleAgg.forEach((ruleAgg, i) => {
            
            let ySum = 0
            if(this.ySumList.length!=0){
                ySum = this.ySumList[i]
            }
            if((i!=0)&&(this.props.buttonSwitch)){
                offsetY += 0.3 * this.lineInterval
                switchOffset += 0.3 * this.lineInterval
            }
            let posOffset = 0
            // choose rect display mode
            if(!this.props.buttonSwitch&&(this.bubblePosition.length==arrayLength)){
                // subject1: whether the former rect is expanded
                let formerRectY = 0
                if(i!=0){
                    formerRectY = this.yList[i-1].y+this.yList[i-1].h*2 + this.lineInterval
                }
                // subject2: whether the former bubble overlap
                let bubbleY = 0
                if(i!=0){
                    bubbleY = this.bubblePosition[i-1].h + this.bubblePosition[i-1].y+this.bubblePosition[i].h/2
                }
                switchOffset = Math.max(ySum,formerRectY,bubbleY)-this.lineInterval
            }else{
                switchOffset = offsetY
            }
            // calculate average y-value of an itemset
            let posAveY = switchOffset
            posRules.push(
                <g key={ruleAgg.id} id={`${ruleAgg.id}`} transform={`translate(${ this.props.offset}, ${switchOffset})`} className="rule" >
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
            // record y-axis value of each rule bar
            
            
            this.yList.push({y:posAveY+posOffset,h:hPos,r:ruleAgg.antecedent})
            this.yListOrigin.push({y:posAveY,h:hPos,r:ruleAgg.antecedent})

        })  
        this.pLenght = positiveRuleAgg.length
        
        // negtive, green
        let negaRules: JSX.Element[] = [] 
        negativeRuleAgg.forEach((ruleAgg,i)=> {
            i += positiveRuleAgg.length
            let ySum = 0
            if(this.ySumList.length!=0){
                ySum = this.ySumList[i]
            }
            if(i!=0){
                offsetY += 0.3 * this.lineInterval
                switchOffset += 0.3 * this.lineInterval
            }
            
            let negOffset = 0
            if(!this.props.buttonSwitch&&(this.bubblePosition.length==arrayLength)){
                // subject1: whether the former rect is expanded
                let formerRectY = 0
                if(i!=0){
                    formerRectY = this.yList[i-1].y+this.yList[i-1].h*2 + this.lineInterval
                }
                // subject2: whether the former bubble overlap
                let bubbleY = 0
                if(i!=0){
                    bubbleY = this.bubblePosition[i-1].h + this.bubblePosition[i-1].y+this.bubblePosition[i].h/2
                }
                switchOffset = Math.max(ySum,formerRectY,bubbleY)-this.lineInterval 
            }else{
                switchOffset = offsetY
            }
            
            // calculate average y-value of an itemset
            let negAveY = switchOffset
            negaRules.push(
                <g key={ruleAgg.id} id={`${ruleAgg.id}`} transform={`translate(${this.props.offset}, ${switchOffset})`} className="rule">
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

            this.yList.push({y:negAveY+negOffset,h:hNeg,r:ruleAgg.antecedent})
            this.yListOrigin.push({y:negAveY,h:hNeg,r:ruleAgg.antecedent})
        })
        this.rulesLength = negativeRuleAgg.length + positiveRuleAgg.length

        let scoreDomain = d3.extent(rules.map(rule => rule.risk_dif))
        let bubbles = [this.drawBubbles(positiveRuleAgg, scoreDomain, true), this.drawBubbles(negativeRuleAgg, scoreDomain, false)]
        let connectionCurve = this.drawConnection(this)
        return <g key='rules' transform={`translate(${0}, ${this.margin})`}>
            {/* <foreignObject><Euler ruleAgg={positiveRuleAgg[1]}/></foreignObject> */}
            <g className='rippleSet' data-step='5' data-intro='<h4>RippleSet</h4><br/><img height="150px" src="../tutorials/legend.png">'>
                <g className='bubbles'>
                    {connectionCurve}
                </g>
                <g className='bubbles'>
                    {bubbles}
                </g>
            </g>
            <g className="attribute matrix" data-step='7' data-intro='<h4>Attribute Matrix</h4>Each row is a group of individuals. <br/> The solid part in the rectangle indicates the range of an attribute. <br/> Users can click ► to expand for more details.<br/> <img width="200px" src="../tutorials/glyph_legend.png"/>'>
            <g className='positive rules'>
                {posRules}
            </g>
            <g className='negative rules'>
                {negaRules}
            </g>
            </g>
        </g>
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

    findMinRect(bubblePosition:rect[],num:number){
        let minBubble:rect
        let minHeight = Infinity
        for(var i=num+1;i<bubblePosition.length;i++){
            if(bubblePosition[i].y<minHeight){
                minHeight = bubblePosition[i].y
                minBubble = bubblePosition[i]
            }
        }
        return minBubble
    }
    /**
     * Divide and conquer method to find the best place to put the next bubble (greedy, not necessarily opt)
     */
    findBestAxis(bubblePosition: rect[], i: number, areaWidth: number, startAxis: number,){//listFlag:boolean) {
        let pos = bubblePosition
        // let yList = listFlag?this.yList:this.yListOrigin
        let yList = this.yList
        let size = this.bubbleSize
        let length = pos.length
        if ((areaWidth < size[i].w) || (length == 0)) { return { x: Infinity, y: Infinity } }
        else {
            let rightAxis: axis
            let leftAxis: axis
            // the x-Axis value of highest rect
            let maxB = this.findMaxRect(pos, length)
            let leftRects: rect[] = [],
                rightRects: rect[] = []
            // split all the rect based on the highest one into left part and right part
            pos.forEach((d, i) => {
                // totally right of maxB
                if (d.x > maxB.x + maxB.w) {
                    rightRects.push(d)
                }
                // totally left of maxB
                else if (d.x + d.w < maxB.x) {
                    leftRects.push(d)
                }
                // part overlapping, part right of maxB
                else if ((d.x >= maxB.x) && (d.x + d.w > maxB.x + maxB.w)) {
                    rightRects.push({ x: maxB.x + maxB.w, y: d.y, w: d.x + d.w - maxB.x - maxB.w, h: d.h })
                }
                // part overlapping, part left of maxB
                else if ((d.x < maxB.x) && (d.x + d.w <= maxB.x + maxB.w)) {
                    leftRects.push({ x: d.x, y: d.y, w: maxB.x - d.x, h: d.h })
                }
                // all overlapping, part right & part left of maxB
                else if ((d.x < maxB.x) && (d.x + d.w > maxB.x + maxB.w)) {
                    leftRects.push({ x: d.x, y: d.y, w: maxB.x - d.x, h: d.h })
                    rightRects.push({ x: maxB.x + maxB.w, y: d.y, w: d.x + d.w - maxB.x - maxB.w, h: d.h })
                }
            })
            // if the right side contains zero rect (maxB is the rightest one or input contains only one rect)
            if (rightRects.length == 0) {
                // if the max is still far from the new bubble on y-axis
                if(yList[i].y-size[i].h/2>maxB.h+maxB.y){
                    return {x:startAxis,y:yList[i].y-size[i].h/2}
                }else{
                    // the x space is large enough
                    if (areaWidth + startAxis - maxB.x - maxB.w > size[i].w) {
                        rightAxis = { x: maxB.x + maxB.w, y: yList[i].y - size[i].h/2}
                    }
                    // the x space is too small to hold this incomming rect
                    else {
                        rightAxis = { x: Infinity, y: Infinity }
                    }
                }
                
            } else {
                let areaWidthNew = areaWidth - (maxB.x + maxB.w - startAxis),
                    startAxisNew = maxB.x + maxB.w
                rightAxis = this.findBestAxis(rightRects, i, areaWidthNew, startAxisNew)//listFlag)
            }
            leftAxis = this.findBestAxis(leftRects, i, maxB.x - startAxis, startAxis)//,listFlag)
            if ((rightAxis.y == Infinity) && (leftAxis.y == Infinity)) {
                return { x: startAxis, y: maxB.y + maxB.h }
            }
            else if (rightAxis.y < leftAxis.y) {
                return rightAxis
            } else if((rightAxis.y == leftAxis.y)&&(rightAxis.x<leftAxis.x)) {
                return rightAxis
            }else{
                return leftAxis
            }
        }
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
    componentDidUpdate(prevProp: Props) {
        let bubblePosition: rect[] = [],
        bubblePositionOrigin: rect[] = []
        // let {compFlag} = this.props
        // use this value to control interval length
        let interval = 0
        this.bubbleSize.forEach((bubble, i) => {
            
            let transX = 0,
                transY = 0,
                transYOrigin = 0
            if (i == 0) {
                transY = this.yList[0].y - bubble.h/2
                transYOrigin = this.yList[0].y - bubble.h/2
            } else {
                if(this.props.buttonSwitch){
                    let greedyPos: axis = this.findBestAxis(bubblePosition, i, 250, 0)
                    let greedyPosOrigin: axis = this.findBestAxis(bubblePositionOrigin, i, 250, 0)
                    
                    greedyPos.y = Math.max(greedyPos.y, this.yList[i].y  - bubble.h / 2)
                    greedyPosOrigin.y = Math.max(greedyPosOrigin.y, this.yList[i].y  - bubble.h / 2)

                    transX = i==this.yDown.i?this.bubbleSize[i].w/2:greedyPos.x 
                    transY = greedyPos.y
                    transYOrigin = greedyPosOrigin.y
                }
                else{
                    let directPos:number = this.findDirectAxis(bubblePosition,i)
                    directPos = Math.max(directPos ,this.yList[i].y-bubble.h/2)
                    transY = directPos
                }
            }
            bubblePosition.push({ x: transX, y: transY, w: bubble.w + interval, h: bubble.h + interval })
            bubblePositionOrigin.push({ x: transX, y: transYOrigin, w: bubble.w + interval, h: bubble.h + interval })
        })

        bubblePosition.forEach((bubble,i)=>{
            if(i==this.expandedNum){
                this.yDown = {offset:0,i:i}
                this.yUp = {offset:0,i:i}
                this.yOffset = 0
                if((bubblePosition.length!=0)&&this.yList.length!=0){
                    let initPos = bubble.y,
                    maxRect = this.findMaxRect(bubblePosition,i),
                    minRect = this.findMinRect(bubblePosition,i),
                    expandH = this.yList[i].h 
                    // the offset of selected bubble. Equal to bar's central y-value
                    this.yOffset = (this.yList[i].y +expandH - this.bubbleSize[i].h/2 - initPos) -  this.lineInterval
                    // if there is overlap between the selected bubble and down bubbles, move all of the down bubbles downstairs
                    if(this.yOffset<0){
                        this.yDown.offset = this.yOffset
                    }
                    if(minRect&&(bubble.y+bubble.h+this.yOffset>minRect.y-this.yDown.offset)){
                        this.yDown = {i:i,offset:bubble.y+bubble.h+this.yOffset-minRect.y+this.yDown.offset}
                    }
                    // if there is overlap between the selected bubble and up bubbles, move all the up bubbles up
                    if(maxRect&&(maxRect.y+maxRect.h>this.yList[i].y+expandH - this.bubbleSize[i].h/2-this.lineInterval)){
                        this.yUp = {i:i,offset:this.yList[i].y+expandH - this.bubbleSize[i].h/2-0.7*this.lineInterval-(maxRect.y+maxRect.h)}
                    }
                    // this.setState({})
                }
            }
        })

        bubblePosition.forEach((bubble,i)=>{
            let offset = 0
            let iPos = Math.max(this.yDown.i,this.yUp.i)
            if(!this.props.buttonSwitch){
                offset = 0
            }else{
                if(i<iPos){
                    offset = this.yUp.offset
                }else if((i>iPos)&&(iPos!=-1)){
                    offset = this.yDown.offset
                }else if(i==iPos){
                    offset = this.yOffset
                }
            }
            bubblePosition[i].y = bubblePosition[i].y + offset
        })
        // let bubblePositionNew:rect[] = bubblePosition
        // bubblePosition.forEach((bubble,i)=>{
        //     let initY = bubble.y
        //     if(this.expandRulesIndex.includes(i)){
        //         let y = this.yList[i].y + this.yList[i].h/2 - bubble.h/2 + this.lineInterval
        //         if(y>initY){
        //                 bubblePosition.forEach((bubbleP,j)=>{
        //                 let yP = 0
        //                 if(j>i){
        //                     yP = bubbleP.y + (y-initY)
        //                     bubblePositionNew[j] = { x: bubbleP.x, y: yP, w: bubbleP.w + interval, h: bubbleP.h + interval }
        //                 }
        //             })
        //         }else if(y<initY){
        //                 bubblePosition.forEach((bubbleM,j)=>{
        //                 let yM = 0
        //                 if(j<i){
        //                     yM = bubbleM.y - (initY-y)
        //                     bubblePositionNew[j] = { x: bubbleM.x, y: yM, w: bubbleM.w + interval, h: bubbleM.h + interval }
        //                 }
        //             })
        //         }
        //         bubblePositionNew[i] = { x: bubble.x, y: y, w: bubble.w + interval, h: bubble.h + interval }
        //     }
            
        // })

        // bubblePosition = bubblePositionNew
        // define new rect pos
        let yListButton:number[] = []
        bubblePosition.forEach((bubble,i)=>{
            yListButton.push(bubble.y+bubble.h/2)
        })
        // check whether update is needed
        let posIsSame = this.compareArray(this.state.bubblePosition,bubblePosition)
        // update state
        if (!posIsSame) { 
            this.setState({ bubblePosition }) 
            this.bubblePosition = bubblePosition
            this.bubblePositionOrigin = bubblePositionOrigin
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
    }

    render() {
        let { fetchKeyStatus } = this.props
        let content: JSX.Element = <g />
        this.bubbleSize = []
        if((this.state.dataset!=this.props.dataset)||(this.state.model!=this.props.model)){
            this.setState({
                dataset:this.props.dataset,
                model: this.props.model
            })
            this.leaveRect()
            this.expandRulesIndex = []
            this.expandedNum = -1
            this.expandedFlag = false
            this.setState({expandRules:{}})
        }
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
            svgHeight= Math.max(maxBubble.y + maxBubble.h,this.yMaxValue) + this.margin * 1.1
        }
        let borderHeight = document.getElementsByClassName('itemset').length!=0?Math.max(document.getElementsByClassName('itemset')[0].clientHeight,svgHeight):'100%'
        let borderWidth = this.xMaxValue + this.props.offset + 10

        return (<svg className='itemset' style={{ width: borderWidth, height: borderHeight}}>
            <g className='rules' >
                {content}
            </g>
        </svg>
        )
    }
}