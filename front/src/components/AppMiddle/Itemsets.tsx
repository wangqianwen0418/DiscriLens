import * as React from 'react';
import { DataItem, Status, Rule } from 'types';
import { Icon } from 'antd';
import { ruleAggregate, getAttrRanges, RuleAgg, RuleNode, } from 'Helpers';
import * as d3 from 'd3';

// import Euler from 'components/AppMiddle/Euler';
// import Bubble from 'components/AppMiddle/Bubble';
import Bubble from 'components/AppMiddle/BubblePack';

import "./Itemsets.css";

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
    highlightRule: string,
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
    bubbleSize: [number, number][] = [];
    yoffSet:number=0;
    yList:number[] = [];

    constructor(props: Props) {
        super(props)
        this.state = {
            expandRules: {},
            highlightRule: undefined,
            bubblePosition: []
        }
        this.toggleExpand = this.toggleExpand.bind(this)
        this.drawRuleAgg = this.drawRuleAgg.bind(this)
        this.drawRuleNode = this.drawRuleNode.bind(this)
        this.drawBubbles = this.drawBubbles.bind(this)
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
    drawRuleNode(ruleNode: RuleNode, offsetX: number, offsetY: number, favorPD: boolean, itemMax: number,listNum:number=0): { content: JSX.Element[], offsetY: number } {
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
        let parent = <g className={`${ruleNode.rule} rule`}
            transform={`translate(${this.props.offsetX}, ${offsetY})`}
            
            // tslint:disable-next-line:jsx-no-lambda
            onMouseEnter={()=>{
                this.setState({highlightRule: rule.id.toString()})
                this.enterRect(listNum)}
            }
            // tslint:disable-next-line:jsx-no-lambda
            onMouseLeave={()=> {
                this.setState({highlightRule:undefined})
                this.leaveRect()
            }}
            >
            <g 
                className="score" 
                transform={`translate(${-circleRadius + indent - this.headWidth * 0.1}, ${this.lineInterval * 0.5})`}
                // //tslint:disable-next-line:jsx-no-lambda
                // onMouseEnter={()=>this.setState({highlightRule: rule.id.toString()})}
                // // tslint:disable-next-line:jsx-no-lambda
                // onMouseLeave={()=> this.setState({highlightRule:''})}
            >
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
                let { content: child, offsetY: newY } = this.drawRuleNode(childNode, offsetX, offsetY, favorPD, itemMax,listNum)
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
            this.yoffSet = this.yList[i] - initPos
            bubblePosition = bubblePosition.map((bubble,j)=>{
                bubble.y += this.yoffSet
                return bubble
            })
            this.setState({bubblePosition})
        }
    }

    leaveRect(){
        let bubblePosition = this.state.bubblePosition
        if(bubblePosition.length!=0){
            bubblePosition = bubblePosition.map((bubble,j)=>{
                bubble.y -= this.yoffSet
                return bubble
            })
            this.yoffSet = 0
            this.setState({bubblePosition})
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
        let { expandRules,bubblePosition } = this.state
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
        
        return <g className='bubbles' transform={`translate(${showAttrNum * step + this.margin}, ${0})`}>
            {
                ruleAggs
                    .map((ruleAgg, i) =>{
                        
                        
                        // first state bubble ot obtain the bubbleSize to calculate translate
                        let bubble = <Bubble 
                        ref={(ref:any)=>{
                            if (ref){
                                this.bubbleSize.push(ref.getSize())}
                            }
                            
                        }
                            ruleAgg={ruleAgg} 
                            scoreDomain={scoreDomain} 
                            showIDs={showIDs} 
                            highlightRule={this.state.highlightRule}
                            samples = {this.props.samples}
                            protectedVal={this.props.protectedVal}
                        />
                        return <g key={'bubble_' + ruleAgg.id}  className='bubblesAgg'
                        transform={`translate(${bubblePosition.length==ruleAggs.length?bubblePosition[i].x+100:100},
                         ${bubblePosition.length==ruleAggs.length?bubblePosition[i].y:0})`} >
                        {bubble}
                    </g>
                    }
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

        let itemMax = Math.max(...rules.map(d => d.items.length))

        // aggregate based on key attributes
        let results = ruleAggregate(rules, dragArray.filter(attr => keyAttrs.includes(attr)), samples)
        // console.info(results)

        let { positiveRuleAgg, negativeRuleAgg } = results
        let offsetY = 0
        let posRules: JSX.Element[] = []
        if(this.yList.length>positiveRuleAgg.length){
            this.yList = []
        }
        positiveRuleAgg.forEach((ruleAgg,i)=>{
            offsetY += 0.3 * this.lineInterval
            if(this.yList.length-1<i){
                this.yList.push(offsetY)
            }else{
                this.yList[i] = offsetY
            }
            posRules.push(
                <g key={ruleAgg.id} id={`${ruleAgg.id}`} transform={`translate(${this.props.offsetX}, ${offsetY})`} className="rule" >
                    {
                        this.drawRuleAgg(ruleAgg, true)
                    }
                </g>
            )
            offsetY = offsetY + 2 * this.lineInterval
            if (expandRules.hasOwnProperty(ruleAgg.id)) {
                for (let ruleNode of ruleAgg.nodes) {
                    let { content, offsetY: newY } = this.drawRuleNode(ruleNode, 1, offsetY, true, itemMax, i)
                    offsetY = newY
                    posRules = posRules.concat(content)
                }
            }
        })  
        let negaRules: JSX.Element[] = []
        negativeRuleAgg.forEach((ruleAgg,i)=> {
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
                    let { content, offsetY: newY } = this.drawRuleNode(ruleNode, 1, offsetY, false, itemMax,i)
                    offsetY = newY
                    negaRules = negaRules.concat(content)
                }
            }
        })

        let scoreDomain = d3.extent(rules.map(rule => rule.risk_dif))
        let bubbles = this.drawBubbles(positiveRuleAgg, scoreDomain)
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
    findMaxRect(bubblePosition:rect[],num:number){
        let maxBubble:rect
        let maxHeight = 0
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
        if((areaWidth<size[i][0])||(length==0)){return {x:Infinity,y:Infinity}}
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
                if(areaWidth+startAxis-maxB.x-maxB.w>size[i][0]){
                    rightAxis = {x:maxB.x+maxB.w,y:maxB.y + this.lineInterval*2}
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
        let interval = 5
        this.bubbleSize.forEach((bubble,i)=>{
            let transX = 0,
            transY = 0
            if(i==0){
                transX = 0
                transY = this.yList[0]
            }else{
                let greedyPos:axis = this.findBestAxis(bubblePosition,i,250,0)
                greedyPos.y = Math.max(greedyPos.y,this.yList[i])
                transX = greedyPos.x
                transY = greedyPos.y
            }
            bubblePosition.push({x:transX,y:transY,w:bubble[0]+interval,h:bubble[1]+interval})
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
            <g className='rules' >
                {content}
            </g>
        </svg>
        )
    }
}