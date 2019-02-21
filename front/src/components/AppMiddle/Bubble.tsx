import {
    BubbleSet,
    PointPath,
    ShapeSimplifier,
    BSplineShapeGenerator
} from 'lib/bubble.js';
import * as React from 'react';
import { RuleAgg, RuleNode, groupByKey } from 'Helpers';
import { Rule } from 'types';

import * as d3 from 'd3';

export interface Props {
    ruleAgg: RuleAgg,
    scoreDomain: [number, number] | [undefined, undefined],
    showIDs: string[],
    highlightRule: string
}
export interface State {

}
// export interface SetData {
//     sets: string[],
//     label: string,
//     size: number,
//     score: number
//     [key: string]: any
// }
const flatten = (nodes: RuleNode[]): Rule[] => {
    let rules: Rule[] = []
    for (let node of nodes) {
        rules.push(node.rule)
        if (node.children.length > 0) {
            rules = rules.concat(
                flatten(node.children)
                .filter(
                    rule=>!rules.map(rule=>rule.id).includes(rule.id)
                )
            )
        }
    }
    return rules
}

const extractItems = (rules: Rule[]): { id: any, score: number, groups: string[] }[] => {
    let itemSet: { id: any, score: number, groups: string[] }[] = []
    for (let rule of rules) {
        for (let item of rule.items) {
            let idx = itemSet
                .map(d => d.id)
                .indexOf(item)
            if (idx > -1) {
                itemSet[idx].score = Math.max(itemSet[idx].score, rule.risk_dif)
                if(!itemSet[idx].groups.includes(rule.id.toString())){
                    itemSet[idx].groups.push(rule.id.toString())
                }

            } else {
                itemSet.push({
                    id: item,
                    score: rule.risk_dif,
                    groups: [rule.id.toString()]
                })
            }
        }
    }
    
    itemSet.sort((a, b) => a.score - b.score)
    // console.info('sort score', itemSet)
    itemSet.sort(
            (a,b) => b.groups.length - a.groups.length
            )
    // console.info('sort group', itemSet)
    return itemSet
}

export default class Bubble extends React.Component<Props, State>{
    highlightPath(id: string) {
        d3.select(`path#outline_${id}`)
            .style('stroke-width', 7)
            .style('stroke', 'pink')
            .style('z-index', 5)
    }
    onMouseLeave() {
        d3.selectAll('path.outline')
            .style('stroke', 'gray')
            .style('stroke-width', 1)
    }
    render() {
        let { ruleAgg, scoreDomain, showIDs, highlightRule } = this.props
        let rules = flatten(ruleAgg.nodes),
            items = extractItems(rules)

        // cluster item circles to a big circle
        let clusteredItems = groupByKey(items, (item)=>[item.score, item.groups.length])
        // console.info(clusteredItems)

        let opacityScale = d3
            .scaleLinear()
            .domain([0, scoreDomain[1]])
            .range([0.2, 1])
        // store the position of circles
        let width = Math.floor(Math.sqrt(clusteredItems.length)), //number of items of each row
            radius = 2 //radius of the item
        let circlePos = clusteredItems.map((clusteredItem, idx) => {
            let posY = Math.floor(idx / width),
                posX = (idx - posY * width)
            return { 
                x: posX * 16 * radius, 
                y: posY * 16 * radius, 
                width: clusteredItem.length * radius, 
                height: clusteredItem.length * radius, 
                clusteredItem 
            }
        })
        // draw items
        let itemCircles = circlePos.map((circle,circleIdx) => {
            let score = circle.clusteredItem[0].score
            return <g key={circleIdx} transform={`translate(${circle.x}, ${circle.y})`}>
            <circle
                r={ radius * circle.clusteredItem.length}  
                fill="#FF9F1E"
                opacity={opacityScale(score)}
            />
            <text>{score.toFixed(2)}</text>
            </g>
        })
        // draw set boundaries
        // const onMouseLeave = ()=>{
        //     d3.selectAll('path.outline')
        //     .style('stroke', 'black')
        //     .style('stroke-width', 1)
        //     }

        var bubbles = new BubbleSet(),
            padding = 2
        var outlines = rules
            .filter(rule => showIDs.includes(rule.id.toString()))
            .map(rule => {
                let itemIn = circlePos.filter(circle => circle.clusteredItem[0].groups.includes(rule.id.toString()))
                let itemOut = circlePos.filter(circle => !circle.clusteredItem[0].groups.includes(rule.id.toString()))
                var list = bubbles.createOutline(
                    BubbleSet.addPadding(itemIn, padding),
                    BubbleSet.addPadding(itemOut, padding),
                    null
                );
                var outline = new PointPath(list).transform([
                    new ShapeSimplifier(0.0),
                    new BSplineShapeGenerator(),
                    new ShapeSimplifier(0.0),
                ]);
                const onMouseEnter = () => this.highlightPath(rule.id.toString())
                return <path key={rule.id} d={outline.toString()} id={`outline_${rule.id}`}
                    className='outline'
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={this.onMouseLeave}
                    fill='none' 
                    stroke={rule.id==highlightRule?'pink':'gray'} 
                    strokeWidth={rule.id==highlightRule?4:1} 
                    />
            })
        console.info('show ids', showIDs, 'outline', outlines)

        return <g className='bubbleSet' id={`bubble_${ruleAgg.id}`}>
            {itemCircles}
            {outlines}
        </g>
    }
}