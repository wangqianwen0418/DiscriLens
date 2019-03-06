import * as React from 'react';
import { DataItem, Status, Rule } from 'types';
import { Icon, Tooltip } from 'antd';
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
    d="M878.3 392.1L631.9 145.7c-6.5-6.5-15-9.7-23.5-9.7s-17 3.2-23.5 9.7L423.8 306.9c-12.2-1.4-24.5-2-36.8-2-73.2 0-146.4 24.1-206.5 72.3a33.23 33.23 0 0 0-2.7 49.4l181.7 181.7-215.4 215.2a15.8 15.8 0 0 0-4.6 9.8l-3.4 37.2c-.9 9.4 6.6 17.4 15.9 17.4.5 0 1 0 1.5-.1l37.2-3.4c3.7-.3 7.2-2 9.8-4.6l215.4-215.4 181.7 181.7c6.5 6.5 15 9.7 23.5 9.7 9.7 0 19.3-4.2 25.9-12.4 56.3-70.3 79.7-158.3 70.2-243.4l161.1-161.1c12.9-12.8 12.9-33.8 0-46.8zM666.2 549.3l-24.5 24.5 3.8 34.4a259.92 259.92 0 0 1-30.4 153.9L262 408.8c12.9-7.1 26.3-13.1 40.3-17.9 27.2-9.4 55.7-14.1 84.7-14.1 9.6 0 19.3.5 28.9 1.6l34.4 3.8 24.5-24.5L608.5 224 800 415.5 666.2 549.3z"/>
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
    offsetX: number,
    offset:number,
    onChangeShowAttr: (showAttrs: string[]) => void
    onChangeSelectedBar:(selected_bar:string[]) => void
}
export interface State {
    expandRules: { [id: string]: ExpandRule } // store the new show attributes of the rules that have been expaned
    hoverRule: string,
    highlightRules: {[id:string]: string[]}; // the highlight rules in each ruleAGG
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
export interface axis{
    x:number,
    y:number
}
export interface rect{
    x:number,
    y:number,
    w:number,
    h:number,
}

export default class Itemset extends React.Component<Props, State>{
    public height = 40; bar_margin = 1; attr_margin = 8; viewSwitch = -1; lineInterval = 15;
    margin = 65;
    headWidth = this.props.offsetX - this.margin;
    indent: 5;
    bubbleSize: rect[] = [];
    positiveRuleAgg: RuleAgg[] = [];
    negativeRuleAgg: RuleAgg[] = [];
    yoffSet:number=0;
    yList:number[] = [];
    rulesLength:number = 0;

    scoreColor = (score: number)=>{
        let [minScore, maxScore ] = d3.extent(this.props.rules.map(rule => rule.risk_dif))
        if (score<0){
            return d3.interpolateOranges(
                d3.scaleLinear()
                .domain([minScore, 0])
                .range([0.65, 0.3])(score)
            )
        }else{
            return d3.interpolateGreens(
                d3.scaleLinear()
                .domain([0, maxScore])
                .range([0.3, 0.8])(score)
            )
        }

    }

    constructor(props: Props) {
        super(props)
        this.state = {
            expandRules: {},
            hoverRule: undefined,
            highlightRules: {},
            bubblePosition: []
        }
        this.toggleExpand = this.toggleExpand.bind(this)
        this.drawRuleAgg = this.drawRuleAgg.bind(this)
        this.drawRuleNode = this.drawRuleNode.bind(this)
        this.drawBubbles = this.drawBubbles.bind(this)
        this.toggleHighlight = this.toggleHighlight.bind(this)
        this.enterRect = this.enterRect.bind(this)
        this.leaveRect = this.leaveRect.bind(this)
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
    toggleHighlight(ruleAggID:string, ruleID: string){
        let {highlightRules} =this.state
        if (!highlightRules[ruleAggID]){
            highlightRules[ruleAggID] = [ruleID]
        }else{
            let idx = highlightRules[ruleAggID].indexOf(ruleID)
            if (idx==-1){
                highlightRules[ruleAggID].push(ruleID)
            }else{
                highlightRules[ruleAggID].splice(idx, 1)
            }
        }
        
        this.setState({highlightRules})
    }
    drawRuleNode(ruleNode: RuleNode, offsetX: number, offsetY: number, favorPD: boolean, itemScale: d3.ScaleLinear<number, number>, ruleAggID: string, listNum:number=0): { content: JSX.Element[], offsetY: number } {
        let { rule, children } = ruleNode
        let { antecedent, items, id } = rule
        let { barWidth, step, keyAttrNum, showAttrNum, dragArray} = this.props
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

        let inConf = Math.min(rule.conf_pd, rule.conf_pnd)
        
        let progressBarWidth = this.lineInterval*0.2
        let outRadius = itemScale(items.length)
        let inRadius = outRadius -  progressBarWidth*1.1
        let innerArc:any = d3.arc()
                    .innerRadius(inRadius)
                    .outerRadius(inRadius+progressBarWidth)
                    .cornerRadius(progressBarWidth/2)

        let outerArc:any = d3.arc()
                    .innerRadius(outRadius)
                    .outerRadius(outRadius+progressBarWidth)
                    .cornerRadius(progressBarWidth/2)
        

        let parent = <g className={`${ruleNode.rule.id} rule`}
            transform={`translate(${this.props.offsetX+this.props.offset}, ${offsetY})`}
            
            // tslint:disable-next-line:jsx-no-lambda
            onMouseEnter={()=>{
                this.setState({hoverRule: rule.id.toString()})
                this.enterRect(listNum)
                }
            }
            // tslint:disable-next-line:jsx-no-lambda
            onMouseLeave={()=>{ 
                    this.setState({hoverRule:undefined})
                    this.leaveRect()
                }
            }
            // tslint:disable-next-line:jsx-no-lambda
            onClick={(e: React.MouseEvent)=>{
                e.preventDefault()
                e.stopPropagation()
                let ruleID = rule.id.toString()
                let {highlightRules} = this.state, idx = highlightRules[ruleAggID].indexOf(ruleID)
                if (idx==-1){
                    highlightRules[ruleAggID].push(ruleID)
                }else{
                    highlightRules[ruleAggID].splice(idx, 1)
                }
                this.setState({highlightRules})
            }
            }
            >
            <g 
                className="score" 
                transform={`translate(${-itemScale.range()[1] + indent - this.headWidth * 0.1}, ${this.lineInterval * 0.5})`}
                // //tslint:disable-next-line:jsx-no-lambda
                // onMouseEnter={()=>this.setState({highlightRule: rule.id.toString()})}
                // // tslint:disable-next-line:jsx-no-lambda
                // onMouseLeave={()=> this.setState({highlightRule:''})}
            > 
                
                <path 
                    className="background in"
                    d={innerArc({
                        startAngle:0,
                        endAngle: Math.PI*2
                    })}
                    fill="#eee"
                />
                
                <path
                    className="in bar"
                    d={innerArc({
                        startAngle:0,
                        endAngle: Math.PI*2*rule.conf_pd
                    })}
                    fill={this.scoreColor(-Math.pow(10, -5))}
                />
                {/* <path
                    className="out bar"
                    d={outerArc({
                        startAngle: Math.PI*2*inConf,
                        endAngle: Math.PI*2*rule.conf_pd
                    })}
                    // fill="#FF9F1E"
                    fill="url(#negativeGradient)"
                /> */}
                <g className='in gradientArc'>
                {d3.range( Math.floor((rule.conf_pd-inConf)*50) )
                    .map(i=>{
                    return <path key={i} className="out bar"
                    d={innerArc({
                        startAngle: Math.PI*2*(inConf+ i/50),
                        endAngle: Math.PI*2*(inConf+ (i+1)/50),
                    })}
                    fill={this.scoreColor(-(i+1)/50)}
                    />
                })}
                </g>
                <path
                    className="background out"
                    fill='#eee'
                    d = {outerArc({
                        startAngle:0,
                        endAngle: Math.PI*2
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
                    fill={this.scoreColor(Math.pow(10, -6))}
                    d={outerArc({
                        startAngle:0,
                        endAngle: Math.PI*2*inConf
                    })}
                />
                 <g className='out gradientArc'>
                    {d3.range(Math.floor(rule.conf_pnd-inConf)*360)
                        .map(i=>{
                        return <path key={i} className="out bar"
                        d={outerArc({
                            startAngle: Math.PI*2*(inConf+ i/360),
                            endAngle: Math.PI*2*(inConf+ (i+1)/360),
                        })}
                        fill={this.scoreColor((i+1)/360)}
                        />
                    })}
                </g>
                {/* <g className='pin icon' transform={`translate(${0}, ${-itemScale.range()[1]})`} opacity={0}>{PIN}</g> */}

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
                opacity={highlightRules[ruleAggID]? (highlightRules[ruleAggID].includes(rule.id.toString())?1:0):0}
                // tslint:disable-next-line:jsx-no-lambda
                onClick={(e:React.MouseEvent)=>{
                    e.stopPropagation()
                    e.preventDefault()
                    this.toggleHighlight(ruleAggID, rule.id.toString())}
                }
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
                            // stroke={favorPD ? "#98E090" : "#FF772D"}
                            stroke = {this.scoreColor(ruleNode.rule.risk_dif)}
                            strokeWidth={2}
                        />
<<<<<<< HEAD
                        
                        <Tooltip title={val}>
                            <rect className='font'
                                width={barWidth / ranges.length} height={this.lineInterval}
                                x={step * showAttrs.indexOf(attr) + barWidth / ranges.length * rangeIdx}
                                fill={favorPD ? "#98E090" : "#FF772D"}
                                onMouseEnter={()=>{
                                    this.props.onChangeSelectedBar([attr,val])
                                }}
                                onMouseLeave={()=>{
                                    this.props.onChangeSelectedBar(['',''])
                                }}
                            />
                        </Tooltip>
                        
=======
                        <rect className='font'
                            width={barWidth / ranges.length} height={this.lineInterval}
                            x={step * showAttrs.indexOf(attr) + barWidth / ranges.length * rangeIdx}
                            // fill={favorPD ? "#98E090" : "#FF772D"}
                            fill = {this.scoreColor(ruleNode.rule.risk_dif)}
                        />
>>>>>>> 94cf276b4071dddd45caf199ed2756274877bb77
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
                let { content: child, offsetY: newY } = this.drawRuleNode(childNode, offsetX, offsetY, favorPD, itemScale, ruleAggID, listNum)
                children = children.concat(child)
                offsetY = newY
            }
            content = content.concat(children)
        }
        return { content, offsetY }
    }

    enterRect(i:number){
        let bubblePosition = this.state.bubblePosition
        if(bubblePosition.length!=0){
            let initPos = bubblePosition[i].y
            this.yoffSet = this.yList[i] - this.bubbleSize[i].h/2 - initPos
            this.setState({})
        }
    }

    leaveRect(){
        let bubblePosition = this.state.bubblePosition
        if(bubblePosition.length!=0){
            this.yoffSet = 0
            this.setState({})
        }
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
                    // stroke={favorPD ? "#98E090" : "#FF772D"}
                    stroke = {this.scoreColor(favorPD ?Math.pow(10, -6): -Math.pow(10, -6))}
                    strokeWidth={2}
                />
                <rect className='font'
                    width={barWidth / ranges.length} height={this.lineInterval}
                    x={step * dragArray.indexOf(attr) + barWidth / ranges.length * rangeIdx}
                    // fill={favorPD ? "#98E090" : "#FF772D"} 
                    fill = {this.scoreColor(favorPD ?Math.pow(10, -6): -Math.pow(10, -6))}
                />
            </g>
        }))
        attrValContent.unshift(itemSizeLabel)
        return attrValContent
    }
<<<<<<< HEAD
    drawBubbles(ruleAggs: RuleAgg[], scoreDomain: [number, number], posFlag:boolean) {
=======
    drawBubbles(ruleAggs: RuleAgg[]) {
        let { showAttrNum, step } = this.props
>>>>>>> 94cf276b4071dddd45caf199ed2756274877bb77
        // let {bubblePosition} = this.state
        let { expandRules, bubblePosition} = this.state
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
        return <g className='bubbles' transform={`translate(${0}, ${0})`}>
            {
                ruleAggs
                    .map((ruleAgg, i) =>{
                        let transX = 100
                        let transY = 0
                        // calculate translate distance
                        if(bubblePosition.length==this.rulesLength){
                            if(posFlag){
                                // if rules are positive rules
                                transX = bubblePosition[i].x+100
                                transY = bubblePosition[i].y
                            }else{
                                // if rules are negtive rules
                                let initI = bubblePosition.length - ruleAggs.length
                                transX = bubblePosition[initI + i].x+100
                                transY = bubblePosition[initI + i].y
                            }
                        }
                        // first state bubble ot obtain the bubbleSize to calculate translate
                        let bubble = <Bubble 
                        ref={(ref:any)=>{
                            if (ref){
                                this.bubbleSize.push({x:0,y:0,w:ref.getSize()[0],h:ref.getSize()[1]})}
                            }
                            
                        }
                            ruleAgg={ruleAgg} 
                            scoreColor={this.scoreColor} 
                            showIDs={showIDs} 
                            hoverRule={this.state.hoverRule}
                            highlightRules={this.state.highlightRules[ruleAgg.id]||[]}
                            samples = {this.props.samples}
                            protectedVal={this.props.protectedVal}
                        />

                        return <g key={'bubble_' + ruleAgg.id}  className='bubblesAgg'
                        transform={`translate(${transX},${transY})`}
                          >
                        {bubble}
                    </g>
                    }
                    )
                
                    // ruleAggs
                    //     .map((ruleAgg, i) =>
                    //         <g key={'bubble_' + ruleAgg.id} transform={`translate(100, ${80 * i})`} >
                    //             <Bubble 
                    //             ref={(ref:any)=>{
                    //                 if (ref){
                    //                     this.bubbleSize.push(ref.getSize())}
                    //                 }
                                    
                    //             }
                    //                 ruleAgg={ruleAgg} 
                    //                 scoreDomain={scoreDomain} 
                    //                 showIDs={showIDs} 
                    //                 hoverRule={this.state.hoverRule}
                    //                 highlightRules={this.state.highlightRules[ruleAgg.id]||[]}
                    //                 samples = {this.props.samples}
                    //                 protectedVal={this.props.protectedVal}
                    //             />
                    //         </g>
                    //     )
    
                

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


        let { positiveRuleAgg, negativeRuleAgg } = results
        this.positiveRuleAgg = positiveRuleAgg
        this.negativeRuleAgg = negativeRuleAgg

        let offsetY = 0
        let posRules: JSX.Element[] = []
        if(this.yList.length>positiveRuleAgg.length+negativeRuleAgg.length){
            this.yList = []
        }

        let posYList:number[] = []
        let negYList:number[] = []
        positiveRuleAgg.forEach((ruleAgg,i)=>{
            offsetY += 0.3 * this.lineInterval
            if(posYList.length-1<=i){
                posYList.push(offsetY+this.yoffSet)
            }else{
                posYList[i] = offsetY+this.yoffSet
            }
            posRules.push(
                <g key={ruleAgg.id} id={`${ruleAgg.id}`} transform={`translate(${this.props.offsetX+this.props.offset}, ${offsetY})`} className="rule" >
                    {
                        this.drawRuleAgg(ruleAgg, true)
                    }
                </g>
            )
            offsetY = offsetY + 2 * this.lineInterval
            if (expandRules.hasOwnProperty(ruleAgg.id)) {
                for (let ruleNode of ruleAgg.nodes) {
                    let { content, offsetY: newY } = this.drawRuleNode(ruleNode, 1, offsetY, true, itemScale, ruleAgg.id.toString(), i)
                    offsetY = newY
                    posRules = posRules.concat(content)
                }
            }
        })  
        let negaRules: JSX.Element[] = []
        negativeRuleAgg.forEach((ruleAgg,i)=> {
            offsetY += 0.3 * this.lineInterval
            if(negYList.length-1<=i){
                negYList.push(offsetY+this.yoffSet)
            }else{
                negYList[i] = offsetY+this.yoffSet
            }
            negaRules.push(
                <g key={ruleAgg.id} id={`${ruleAgg.id}`} transform={`translate(${this.props.offsetX+this.props.offset}, ${offsetY})`} className="rule">
                    {
                        this.drawRuleAgg(ruleAgg, false)
                    }
                </g>
            )
            offsetY = offsetY + 2 * this.lineInterval
            if (expandRules.hasOwnProperty(ruleAgg.id)) {
                for (let ruleNode of ruleAgg.nodes) {
                    let { content, offsetY: newY } = this.drawRuleNode(ruleNode, 1, offsetY, false, itemScale, ruleAgg.id.toString(), i)
                    offsetY = newY
                    negaRules = negaRules.concat(content)
                }
            }
        })

<<<<<<< HEAD
        this.rulesLength = negativeRuleAgg.length + positiveRuleAgg.length

        this.yList = posYList.concat(negYList)

        let scoreDomain = d3.extent(rules.map(rule => rule.risk_dif))
        let bubbles = [this.drawBubbles(positiveRuleAgg, scoreDomain, true), this.drawBubbles(negativeRuleAgg, scoreDomain, false)]
=======
        // let negativeScoreDomain = [0, Math.max(...rules.filter(rule=>rule.risk_dif<0).map(rule => -1*rule.risk_dif))]
        // let negativeScoreScale = d3
        //     .scaleLinear()
        //     .domain(negativeScoreDomain)
        //     .range([0, 0.8])
        
        // let positiveScoreDomain = [0, Math.max(...rules.filter(rule=>rule.risk_dif>=0).map(rule => rule.risk_dif))]
        // let positiveScoreScale = d3
        //     .scaleLinear()
        //     .domain(positiveScoreDomain)
        //     .range([0, 0.8])

        // let [minScore, maxScore ] = d3.extent(rules.map(rule => rule.risk_dif))

        // let scoreColor = d3.scaleLinear()
        // .domain([minScore<0?minScore:0 , 0, 0, maxScore>0?maxScore:0 ])
        // .range([d3.interpolateOranges(0.8), d3.interpolateOranges(0.2), d3.interpolateGreens(0.2), d3.interpolateGreens(0.8)])

       
        
        let bubbles = [this.drawBubbles(positiveRuleAgg), this.drawBubbles(negativeRuleAgg)]
>>>>>>> 94cf276b4071dddd45caf199ed2756274877bb77

        return <g key='rules' transform={`translate(${0}, ${this.margin})`}>
            {/* <foreignObject><Euler ruleAgg={positiveRuleAgg[1]}/></foreignObject> */}
            
            <g className='bubbles'>
                {bubbles}
            </g>
            <g className='positive rules'>
                {posRules}
            </g>
            <g className='negative rules'>
                {negaRules}
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
        let  {highlightRules} = this.state
        let {negativeRuleAgg, positiveRuleAgg} = this
        negativeRuleAgg.forEach(ruleAgg=>{
            if (!highlightRules[ruleAgg.id]){
                highlightRules[ruleAgg.id.toString()] = ruleAgg.nodes.map(node=>node.rule.id.toString()).slice(0, 2)
            }
        })
        positiveRuleAgg.forEach(ruleAgg=>{
            if (!highlightRules[ruleAgg.id]){
                highlightRules[ruleAgg.id.toString()] = ruleAgg.nodes.map(node=>node.rule.id.toString()).slice(0, 2)
            }
        })
        this.setState({highlightRules})
    }
    findMaxRect(bubblePosition:rect[],num:number){
        let maxBubble:rect
        let maxHeight = -Infinity
        for(var i=0;i<num;i++){
            if(bubblePosition[i].h+bubblePosition[i].y>maxHeight){
                maxHeight = bubblePosition[i].h+bubblePosition[i].y
                maxBubble = bubblePosition[i]
            }
        }
        return maxBubble
    }
    /**
     * Divide and conquer method to find the best place to put the next bubble (greedy, not necessarily opt)
     */
    findBestAxis(bubblePosition:rect[],i:number,areaWidth:number,startAxis:number){
        let pos = bubblePosition
        let size = this.bubbleSize
        let length = pos.length
<<<<<<< HEAD
        if((areaWidth<size[i].w)||(length==0)){return {x:Infinity,y:Infinity}}
=======
        // console.log(bubblePosition)
        if((areaWidth<size[i][0])||(length==0)){return {x:Infinity,y:Infinity}}
>>>>>>> 94cf276b4071dddd45caf199ed2756274877bb77
        else{
            let rightAxis:axis 
            let leftAxis:axis
            // the x-Axis value of highest rect
            let maxB = this.findMaxRect(pos,length)
            let leftRects:rect[] = [],
            rightRects:rect[] = []
            // split all the rect based on the highest one into left part and right part
            pos.forEach((d,i)=>{
                // totally right of maxB
                if(d.x>maxB.x+maxB.w){
                    rightRects.push(d)
                }
                // totally left of maxB
                else if(d.x+d.w<maxB.x){
                    leftRects.push(d)
                }
                // part overlapping, part right of maxB
                else if((d.x>=maxB.x)&&(d.x+d.w>maxB.x+maxB.w)){
                    rightRects.push({x:maxB.x+maxB.w,y:d.y,w:d.x+d.w-maxB.x-maxB.w,h:d.h})
                }
                // part overlapping, part left of maxB
                else if((d.x<maxB.x)&&(d.x+d.w<=maxB.x+maxB.w)){
                    leftRects.push({x:d.x,y:d.y,w:maxB.x-d.x,h:d.h})
                }
                // all overlapping, part right & part left of maxB
                else if((d.x<maxB.x)&&(d.x+d.w>maxB.x+maxB.w)){
                    leftRects.push({x:d.x,y:d.y,w:maxB.x-d.x,h:d.h})
                    rightRects.push({x:maxB.x+maxB.w,y:d.y,w:d.x+d.w-maxB.x-maxB.w,h:d.h})
                }
            })
            // if the right side contains zero rect (maxB is the rightest one or input contains only one rect)
            if(rightRects.length==0){
                // the x space is large enough
                if(areaWidth+startAxis-maxB.x-maxB.w>size[i].w){
                    rightAxis = {x:maxB.x+maxB.w,y:maxB.y - size[i].h / 2 + this.yList[i] - this.yList[i-1]}
                }
                // the x space is too small to hold this incomming rect
                else{
                    rightAxis = {x:Infinity,y:Infinity}
                }
            }else{
                let areaWidthNew = areaWidth-(maxB.x+maxB.w-startAxis),
                startAxisNew = maxB.x+maxB.w
                rightAxis = this.findBestAxis(rightRects,i,areaWidthNew,startAxisNew)
            }
            leftAxis = this.findBestAxis(leftRects,i,maxB.x-startAxis,startAxis)
            if((rightAxis.y==Infinity)&&(leftAxis.y==Infinity)){
                return {x:startAxis,y:maxB.y+maxB.h}
            }
            else if(rightAxis.y<leftAxis.y){
                return rightAxis
            }else{
                return leftAxis
            }
        }
    }

    componentDidUpdate(prevProp: Props) {
        let bubblePosition:rect[] = []
        // use this value to control interval length
        let interval = 1
        this.bubbleSize.forEach((bubble,i)=>{
            let transX = 0,
            transY = 0
            if(i==0){
                transX = 0
                transY = this.yList[0] - bubble.h / 2
            }else{
                let greedyPos:axis = this.findBestAxis(bubblePosition,i,250,0)
                greedyPos.y = Math.max(greedyPos.y,this.yList[i]- bubble.h/2)
                transX = greedyPos.x
                transY = greedyPos.y
            }
            bubblePosition.push({x:transX,y:transY,w:bubble.w+interval,h:bubble.h+interval})
        })
        // check whether update is needed
        let array1 = bubblePosition,
        array2 = this.state.bubblePosition,
        is_same = true
        if(array1.length == array2.length){
            array1.map((element, index)=>{
                is_same = is_same && ((element.x == array2[index].x)&&(element.y == array2[index].y)); 
            })
        }else{
            is_same = false
        }
        // update state
        if(!is_same){this.setState({bubblePosition})}
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
        return (<svg className='itemset' style={{ width: "100%", height: "100%" }}>
        {/* <defs>
            <linearGradient id="negativeGradient" x1="0%" y1="0%" x2="100%" y2="100%" >
                <stop className="stop1" offset="0%" stopColor={d3.interpolateOranges(0.2)}/>
                <stop className="stop3" offset="100%" stopColor={d3.interpolateOranges(0.8)}/>
            </linearGradient>
            <linearGradient id="positiveGradient" x1="0%" y1="0%" x2="0%" y2="100%" gradientUnits="userSpaceOnUse">
                <stop className="stop1" offset="0%" stopColor={d3.interpolateGreens(0)}/>
                <stop className="stop3" offset="100%" stopColor={d3.interpolateGreens(0.8)}/>
            </linearGradient>
        </defs> */}
            <g className='rules' >
                {content}
            </g>
        </svg>
        )
    }
}