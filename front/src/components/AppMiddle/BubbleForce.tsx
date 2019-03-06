// import {
//     BubbleSet,
//     PointPath,
//     ShapeSimplifier,
//     BSplineShapeGenerator
// } from 'lib/bubble.js';
import * as React from 'react';
import { RuleAgg, RuleNode, getMinLinks} from 'Helpers';
import { Rule, DataItem } from 'types';
import './BubblePack.css';
import {pack as myPack} from 'lib/pack/index.js';


import * as d3 from 'd3';

export interface Props {
    ruleAgg: RuleAgg,
    // scoreScale: d3.ScaleLinear<number, number>,
    scoreColor: (score: number) => string,
    showIDs: string[],
    hoverRule: string,
    highlightRules: string[],
    samples: DataItem[],
    protectedVal: string
}
export interface State {

}

export interface ItemHierarchy {
    id: string,
    children: ItemHierarchy[],
    score: number | null,
    groups: string[]
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
    width=100; height=100; scaleRatio = 1; radius=4; ref: React.RefObject<SVGAElement>=React.createRef();
    constructor(props: Props){
        super(props)
    }
    getSize(){
        return [this.width*this.scaleRatio, this.height*this.scaleRatio]
        // let box = this.ref.current.getBoundingClientRect()
        // return [box.width, box.height]
    }
    shouldComponentUpdate(nextProps: Props){
        if (nextProps.hoverRule!=this.props.hoverRule){
            let {hoverRule} = nextProps
            d3.select(`#bubble_${this.props.ruleAgg.id}`)
              .selectAll('circle')
              .attr("stroke", (d:any) => {return d.id.includes(hoverRule)?'pink':'blue'})
        }
        return false
    }
    componentDidMount(){
        this.draw()
    }
    draw(){
        let { ruleAgg, hoverRule, highlightRules} = this.props
        let rules = flatten(ruleAgg.nodes).sort((a,b)=>a.score-b.score),
            items = extractItems(rules),
            circlePadding = this.radius*(highlightRules.length)*1.5 // change circle padding based on the highlight boundaries

        // console.info(hoverRule)

        // cluster item circles to a big circle
        // let clusteredItems = groupByKey(items, (item)=>[item.score, item.groups.length])
        
        // let scoreScale = d3
        //     .scaleLinear()
        //     .domain([0, scoreDomain[1]])
        //     .range([0, 0.6])
        // store the position of circles

        let root: ItemHierarchy = {
            id: 'root',
            children: [],
            groups: [],
            score: null
        }
        let  childDict:any = []

        items.forEach((item) => {
            let currentGroup = item.groups.sort().join(',')
            
            // let prevItem = items[itemIdx - 1], prevGroup = prevItem.groups.sort().join(',')
            if (!childDict.includes(currentGroup)) {
                root.children.push({
                    // id: 'rules_' + currentGroup,
                    id: `itemcluster_${root.children.length}`,
                    groups: item.groups,
                    score: item.score,
                    children: [{
                        id: item.id,
                        score: item.score,
                        groups: item.groups,
                        children: [],
                    }]
                })
                childDict.push(currentGroup)
            } else {
                let childID = childDict.indexOf(currentGroup)
                root.children[childID].children.push({
                    id: item.id,
                    score: item.score,
                    groups: item.groups,
                    children: []
                })
            }
        })

        
        

        const pack = myPack()
            
        pack.size([this.width, this.height])
        pack.padding((d:any)=>{
                return d.depth==0?circlePadding:0
            })
            // .size([width * 35 * radius, Math.ceil(items.length / width) * 15 * radius])
        const datum = pack(
            d3.hierarchy(root)
                .sum(d => 1) // same radius for each item
        )
        let forceNodes = datum.children.map((node: d3.HierarchyCircularNode<ItemHierarchy>)=>{
            return {
                r: node.r,
                id: node.data.id              
            }
        })

        let graph = getMinLinks(rules, datum.children)
        let forceLinks: any[]= graph.edges()
        .map((edgeObj: any)=>{
            let {weight, length} = graph.edge(edgeObj)
            let {v:source, w: target} = edgeObj
            return {
                source,
                target, 
                weight, 
                length
            }
        })

        const simulation = d3.forceSimulation(forceNodes)
        .force("link", d3.forceLink(forceLinks).id((d:any) => d.id).distance(d=>d.length))
        .force("charge", d3.forceManyBody().strength(d=>{return 4}))
        .force("collide",d3.forceCollide().radius((d,i)=>{return forceNodes[i].r}))
        .force("center", d3.forceCenter(this.width / 2, this.height / 2))

        const g = d3.select(`#bubble_${ruleAgg.id}`);

        const drag = (simulation:any) => {
  
            function dragstarted(d:any) {
              if (!d3.event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            }
            
            function dragged(d:any) {
              d.fx = d3.event.x;
              d.fy = d3.event.y;
            }
            
            function dragended(d:any) {
              if (!d3.event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            }
            
            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
          }

        const node = g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr('class', 'forceNodes')
          .selectAll("circle")
          

          node
          .data(forceNodes)
          .enter()
          .append("circle")
            .attr("r", (d:any)=>d.r)
            .attr('cx', (d:any)=>d.x)
            .attr('cy', (d:any)=>d.y)
            .attr('fill', 'white')
            .attr("stroke", (d:any)=>d.id.includes( hoverRule)?'grey':'blue')
        .attr('class','node')
        .attr('id', (d:any)=>d.id)
            .call(drag(simulation));
        
        const link = g.append("g")
          .attr("stroke", "#999")
          .attr('class', 'forceLinks')
        .selectAll("line")
        

        
        
        link
        .data(forceLinks).enter()
        .append("line")
          .attr("stroke-width", 1)
          .attr('stroke', '#ccc')
          .attr('x1', d=>d.source.x)
          .attr('x2', d=>d.target.x)
          .attr('y1', d=>d.source.y)
          .attr('y2', d=>d.target.y)

      
      
        simulation.on("tick", () => {
            d3.select(`#bubble_${ruleAgg.id}`)
            .selectAll('line')
              .attr("x1", (d:any) => d.source.x)
              .attr("y1", (d:any) => d.source.y)
              .attr("x2", (d:any) => d.target.x)
              .attr("y2", (d:any) => d.target.y);
      
            d3.select(`#bubble_${ruleAgg.id}`)
              .selectAll('circle')
              .attr("cx", (d:any) => d.x)
              .attr("cy", (d:any)=> d.y);
        });


    }
    render() {
        let {ruleAgg} = this.props
        // let {itemCircles, outlines} = this.draw()
       
        return <g className='bubbleSet' 
            id={`bubble_${ruleAgg.id}`} 
            ref={this.ref}
            transform={`scale(${this.scaleRatio})`}>
                {/* {itemCircles}
                <g className='highlight outlines'>
                    {outlines}
                </g>
                 */}
                
            {/* <rect className='outline' width={this.width} height={this.height} fill='none' stroke='gray'/> */}
            {/* <circle className='outline' r={this.height/2} cx={this.height/2} cy={this.height/2} fill='none' stroke='gray'/> */}
        </g>
    }
}