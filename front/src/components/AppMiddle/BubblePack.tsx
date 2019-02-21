import {
    BubbleSet,
    PointPath,
    ShapeSimplifier,
    BSplineShapeGenerator
} from 'lib/bubble.js';
import * as React from 'react';
import { RuleAgg, RuleNode } from 'Helpers/ruleAggregate';
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

export interface ItemHierarchy {
    id: string,
    children: ItemHierarchy[],
    score: number | null
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
        if(!rules.map(rule=>rule.id).includes(node.rule.id)){
            rules.push(node.rule)
        }
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
                itemSet[idx] = {
                    id: item,
                    score: Math.max(itemSet[idx].score, rule.risk_dif),
                    groups: itemSet[idx].groups.concat([rule.id.toString()])
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
    return itemSet
}

export default class Bubble extends React.Component<Props, State>{
    highlightPath(id: string) {
        d3.select(`path#outline_${id}`)
            .style('stroke-width', 7)
            .style('stroke', 'pink')
    }
    onMouseLeave() {
        d3.selectAll('path.outline')
            .style('stroke', 'gray')
            .style('stroke-width', 1)
    }
    render() {
        let { ruleAgg, scoreDomain, showIDs } = this.props
        let rules = flatten(ruleAgg.nodes).sort((a,b)=>a.score-b.score),
            items = extractItems(rules)
        
        let opacityScale = d3
            .scaleLinear()
            .domain([0, scoreDomain[1]])
            .range([0.2, 1])
        // store the position of circles
        let width = Math.floor(Math.sqrt(items.length)), //number of items of each row
            radius = 2 //radius of the item

        let root: ItemHierarchy = {
            id: 'root',
            children: [],
            score: null
        }
        let  childID = 0

        items.forEach((item, itemIdx) => {
            let currentGroup = item.groups.sort().join(',')
            if (itemIdx == 0) {
                root.children.push({
                    id: 'group_' + currentGroup,
                    score: item.score,
                    children: [{
                        id: item.id,
                        children: [],
                        score: item.score,
                    }]
                })
            }
            else {
                
                let prevItem = items[itemIdx - 1], prevGroup = prevItem.groups.sort().join(',')
                if (currentGroup!= prevGroup) {
                    root.children.push({
                        id: 'group_' + currentGroup,
                        score: item.score,
                        children: [{
                            id: item.id,
                            score: item.score,
                            children: [],
                        }]
                    })
                    childID += 1
                } else {
                    root.children[childID].children.push({
                        id: item.id,
                        score: item.score,
                        children: []
                    })
                }

            }
        })

        const pack = d3.pack()
            .size([width * 35 * radius, Math.ceil(items.length / width) * 15 * radius])
        const datum = pack(
            d3.hierarchy(root)
                .sum(d => 1) // same radius for each item
        )

        let itemCircles: JSX.Element[] = []
        let itemsPos: any[] = []

        datum.children.forEach(set => {
            set.children.forEach((item: any) => {
                itemsPos.push({
                    x: item.x,
                    y: item.y,
                    r: item.r,
                    ...item.data
                })
                itemCircles.push(
                    <circle
                        key={item.data.id} cx={item.x} cy={item.y} r={item.r / 3}
                        fill="#FF9F1E"
                        opacity={opacityScale(item.data.score)}
                    />
                )
            })
        })

        var bubbles = new BubbleSet(),
            padding = 2

        var outlines = rules
            .filter(rule => showIDs.includes(rule.id.toString()))
            .map(rule => {
                let itemIn = itemsPos
                    .filter(itemP => rule.items.includes(itemP.id))
                    .map(item => {
                        return {
                            x: item.x,
                            y: item.y,
                            width: item.r * 2 / 3,
                            height: item.r * 2 / 3
                        }
                    })
                let itemOut = itemsPos
                    .filter(itemP => !rule.items.includes(itemP.id))
                    .map(item => {
                        return {
                            x: item.x,
                            y: item.y,
                            width: item.r * 2,
                            height: item.r * 2
                        }
                    })
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
                    fill='none' stroke='gray' />
            })

        return <g className='bubbleSet' id={`bubble_${ruleAgg.id}`}>
            {itemCircles}
            {outlines}
        </g>
    }
}