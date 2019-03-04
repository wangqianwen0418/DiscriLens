import * as graphlib from '@dagrejs/graphlib';
import { Rule } from 'types';
import * as d3 from 'd3';
import { ItemHierarchy } from 'components/AppMiddle/BubblePack';

export interface MinLink {
    source: string,
    target: string,
    length: number,
    id: string
}

interface RulesGraph { [ruleID: string]: typeof graphlib.Graph }

const getEdgeWeight = (e: typeof graphlib.graph.edgeObj, rulesGraph: RulesGraph) => {
    let weight = 0
    for (let ruleID in rulesGraph) {
        let ruleGraph = rulesGraph[ruleID]
        if (ruleGraph.edge(e)) weight++;
    }
    return weight
}

export const getMinLinks = (rules: Rule[], circles: d3.HierarchyCircularNode<ItemHierarchy>[]): MinLink[] => {
    let links: MinLink[] = [] // links connecting outer circles belonging to the same set
    
    let rulesGraph: RulesGraph = {}

    // build a graph for each rule
    for (var rule of rules) {
        let g = new graphlib.Graph({ directed: false })
        circles.forEach((child: d3.HierarchyCircularNode<ItemHierarchy>, childIdx: number) => {
            let outCircleID = child.data.id
            if (outCircleID.includes(rule.id)) {
                g.setNode(outCircleID)
            }
        })
        let nodeIDs = g.nodes()
        for (let i = 0; i < nodeIDs.length; i++)
            for (let j = i; j < nodeIDs.length; j++) {
                g.setEdge(nodeIDs[i], nodeIDs[j])
            }
        rulesGraph[rule.id] = g
    }


    // find the minimum spanning tree for each rule
    for (let ruleID in rulesGraph) {
        let ruleGraph = rulesGraph[ruleID]
        rulesGraph[ruleID] = graphlib.alg.prim(ruleGraph, getEdgeWeight);
    }
    // update links based on MST
    for (let ruleID in rulesGraph) {
        let ruleGraph = rulesGraph[ruleID]
        for (let edgeObj of ruleGraph.edges()) {
            const getR = (id: string) => circles.filter((d: any) => d.data.id == id)[0].r
            let source = edgeObj.v, target = edgeObj.w
            let link: MinLink = {
                id: links.length.toString(),
                source,
                target,
                length: getR(source) + getR(target)
            }
            if (links.length == 0 || links.filter(d => d.source == source && d.target == target).length == 0) {
                links.push(link)
            }
        }
    }
    return links
}

