import * as graphlib from '@dagrejs/graphlib';
import { Rule } from 'types';
import * as d3 from 'd3';
import { ItemHierarchy } from 'components/AppMiddle/BubblePack';

export interface MinLink {
    source: string,
    target: string,
    length: number,
    weight: number,
    id: string
}

interface RulesGraph { [ruleID: string]: typeof graphlib.Graph }

const getEdgeWeight = (e: typeof graphlib.graph.edgeObj, rulesGraph: RulesGraph) => {
    let weight = 0
    for (let ruleID in rulesGraph) {
        let ruleGraph = rulesGraph[ruleID]
        if (ruleGraph.hasEdge(e)) weight=weight+1;
    }
    return weight
}

export const getMinLinks = (rules: Rule[], circles: d3.HierarchyCircularNode<ItemHierarchy>[]): typeof graphlib.Graph=> {
     let rulesGraph: RulesGraph = {}
    // build a graph for each rule
    for (var rule of rules) {
        let g = new graphlib.Graph({ directed: false })
        circles.forEach((child: d3.HierarchyCircularNode<ItemHierarchy>, childIdx: number) => {
            let {groups, id} = child.data
            if (groups.includes(rule.id.toString())) {
                g.setNode(id)
            }
        })
        let nodeIDs = g.nodes()
        for (let i = 0; i < nodeIDs.length; i++)
            for (let j = i+1; j < nodeIDs.length; j++) {
                g.setEdge(nodeIDs[i], nodeIDs[j])
            }
        rulesGraph[rule.id] = g
    }

    
    // find the min spanning tree for each rule
    for (let ruleID in rulesGraph) {
        let ruleGraph = rulesGraph[ruleID]
        if (ruleGraph.edges().length>2){
            rulesGraph[ruleID] = graphlib.alg.prim(ruleGraph, (edgeObj:any)=>-1 * getEdgeWeight(edgeObj, rulesGraph));
        }
    }
    // update links based on MST
    let resultGraph = new graphlib.Graph({ directed: false })
    for (let ruleID in rulesGraph) {
        let ruleGraph = rulesGraph[ruleID]
        for (let edgeObj of ruleGraph.edges()) {
            const getR = (id: string) => circles.filter((d: any) => d.data.id == id)[0].r
            let source = edgeObj.v, target = edgeObj.w
            // let link: MinLink = {
            //     id: links.length.toString(),
            //     source,
            //     target,
            //     length: getR(source) + getR(target),
            //     weight: getEdgeWeight(edgeObj, rulesGraph)
            // }
            if (!resultGraph.hasEdge(edgeObj)) {
                // links.push(link)
                resultGraph.setNode(source)
                resultGraph.setNode(target)
                resultGraph.setEdge(
                    source, 
                    target, 
                    {
                        weight: getEdgeWeight(edgeObj, rulesGraph),
                        length: getR(source) + getR(target),
                    }) 
            }
        }
    }
    console.info(resultGraph.edges().map((e:any)=>resultGraph.edge(e)))
    return resultGraph
}

