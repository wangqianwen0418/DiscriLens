import {Rule, DataItem} from 'types';
import {getAttrRanges} from './getAttrRanges';


export interface RuleNode{
    rule: Rule,
    children: RuleNode[]
}

export interface RuleAgg{
    id:Rule['id'],
    antecedent: string[],
    nodes: RuleNode[],
    items: Rule['items']
}
// export interface RuleTree {
//     positiveRuleNodes: RuleAggregate[],
//     negativeRuleNodes: RuleAggregate[],
//     attrValue: string,
//     positiveItems: (number|string)[],
//     negativeItems: (number|string)[],
// }


// return [i, j][], the i_th element in attrs is the j_th element in ante
export const containsAttr = (ante: Rule['antecedent'], attrs: string[]):[number, number][]=>{
    let idx :[number, number][] = []
    for (let i =0; i<attrs.length;i++){
        let attr = attrs[i]
        for (let j=0;j<ante.length;j++){
            let attrVal = ante[j]
            if (attrVal.includes(attr)){
                idx.push([i,j])
            }
        }
    }
    return idx
}

// check whether arrayA is a sub array of arrayB
export const isSubArray = (shortArray:string[], longArray:string[]):boolean=>{
    let flag = true
    for (let item of shortArray){
        if (!longArray.includes(item)){
            flag=false
            break
        }
    }
    return flag
}

export function oragnizeRules (ruleCollection: RuleNode[], rule: Rule): RuleNode[]{
    for (let ruleNode of ruleCollection){
        if (isSubArray(ruleNode.rule.antecedent, rule.antecedent)){
            oragnizeRules(ruleNode.children, rule)
        }
    }
    let isSibling = (ruleCollection
        .filter(ruleAgg=>isSubArray(ruleAgg.rule.antecedent, rule.antecedent))
        .length==0)
    if (isSibling) {
        ruleCollection.push({rule, children: []})
    }
    return ruleCollection
}

// export const ruleAggregate2 = (rules:Rule[], key_attrs: string[], samples: DataItem[])=>{
//     rules.sort((ruleA,ruleB)=>ruleA.antecedent.length - ruleB.antecedent.length)
//     let result: {[attr:string]: RuleTree[]} = {}
//     key_attrs.forEach(attr=>{
//         result[attr] = []
//         let attrRanges = getAttrRanges(samples, attr)
//         let attrValues = attrRanges.map(range=>`${attr}=${range}`)
//         attrValues.forEach(attrValue=>{
//             let positiveRuleNodes: RuleAggregate[] = [] 
//             let negativeRuleNodes: RuleAggregate[] = [] 
            

//             rules.forEach(rule=>{
//                 let {antecedent} = rule
//                 if (antecedent.includes(attrValue)){
//                     if (rule.favorPD < 0){
//                         negativeRuleNodes = oragnizeRules(negativeRuleNodes, rule)
//                     }else{
//                         positiveRuleNodes = oragnizeRules(positiveRuleNodes, rule)
//                     }
                    
//                 }
//             })
//             let positiveItems = Array.from(new Set([].concat(...positiveRuleNodes.map(rule=>rule.items)) )) //item union set
//             let negativeItems = Array.from(new Set([].concat(...negativeRuleNodes.map(rule=>rule.items)) ))
//             result[attr].push({attrValue, positiveRuleNodes, negativeRuleNodes, positiveItems, negativeItems})
//         })
//     })
//     return result
// }

export const ruleAggregate = (rules:Rule[], keyAttrs: string[], samples: DataItem[])=>{
    // console.info(rules)
    rules.sort((ruleA,ruleB)=>ruleA.antecedent.length - ruleB.antecedent.length)
    // console.info('rules', rules)
    let positiveRuleNodes: RuleNode[] = [] 
    let negativeRuleNodes: RuleNode[] = [] 
    // console.info(rules)
    rules.forEach(rule=>{
        if (rule.favorPD>0){
            oragnizeRules(positiveRuleNodes, rule)
        }else{
            oragnizeRules(negativeRuleNodes, rule)
        }
    })
    // console.info('nodes', positiveRuleNodes, negativeRuleNodes)
    let positiveRuleAgg: RuleAgg[] = [] 
    let negativeRuleAgg: RuleAgg[] = [] 
    // console.info('pos', positiveRuleNodes)
    // console.info('neg', negativeRuleNodes)
    for (var ruleNode of positiveRuleNodes){
        let {antecedent} = ruleNode.rule
        var isContain: boolean = false 
        
        loop1: for (let ruleAgg of positiveRuleAgg){
            isContain = isSubArray(ruleAgg.antecedent, antecedent) 
           
            if(isContain){
                ruleAgg.nodes.push(ruleNode)
                ruleAgg.items = Array.from(
                    new Set( ruleAgg.items.concat(...ruleNode.rule.items) )
                ) 
                break loop1
            }
        }
        if (!isContain){
            positiveRuleAgg.push({
                id: 'agg'+ruleNode.rule.id,
                antecedent: ruleNode.rule.antecedent
                        .filter(attrVal=>{
                            let attr = attrVal.split('=')[0]
                            return keyAttrs.includes(attr)
                        })
                        .sort((a,b)=>{
                            let attrA = a.split('=')[0], attrB = b.split('=')[0]
                            return keyAttrs.indexOf(attrA)-keyAttrs.indexOf(attrB)
                        }),
                nodes: [ruleNode],
                items: ruleNode.rule.items
            })
        }
    }
    for (let ruleNode of negativeRuleNodes){
        let {antecedent} = ruleNode.rule
        let isContain: boolean = false 
        
        loop2: for (let ruleAgg of negativeRuleAgg){
            isContain = isSubArray(ruleAgg.antecedent, antecedent) 
            // console.log('negAn',antecedent)
            if(isContain){
                ruleAgg.nodes.push(ruleNode)
                ruleAgg.items = Array.from(
                    new Set( ruleAgg.items.concat(...ruleNode.rule.items) )
                ) 
            break loop2
            }
        }
        if (!isContain){
            negativeRuleAgg.push({
                id: 'agg'+ruleNode.rule.id,
                antecedent: ruleNode.rule.antecedent
                        .filter(attrVal=>{
                            let attr = attrVal.split('=')[0]
                            return keyAttrs.includes(attr)
                        }),
                nodes: [ruleNode],
                items: ruleNode.rule.items
            })
        }
        // console.log('hinal',negativeRuleAgg)
    }
    // sort rule agg 

    const sortInf = (ante: string[]):number=>{
        const reducer = (acc: number, cur:string)=>{
            let [attr, val] = cur.split('=')
            let ranges = getAttrRanges(samples, attr)
            let rangeIdx = ranges.indexOf(val)
            let unit = Math.pow(10, keyAttrs.length-1 - keyAttrs.indexOf(attr))
            return acc + rangeIdx*unit
        }
        let orderScore = ante.reduce(reducer, 0)
        return orderScore
    }
    positiveRuleAgg.sort((aggA, aggB)=>{
        return sortInf(aggA.antecedent) - sortInf(aggB.antecedent)
    })
    negativeRuleAgg.sort((aggA, aggB)=>{
        return sortInf(aggA.antecedent) - sortInf(aggB.antecedent)
    })
    return {positiveRuleAgg, negativeRuleAgg}
}


export const ruleAggregateCompare = (rules:Rule[], keyAttrs: string[], samples: DataItem[], attrs: string[])=>{
    // console.info(rules)
    rules.sort((ruleA,ruleB)=>ruleA.antecedent.length - ruleB.antecedent.length)
    // console.info('rules', rules)
    let positiveRuleNodes: RuleNode[] = [] 
    let negativeRuleNodes: RuleNode[] = [] 
    // console.info(rules)
    rules.forEach(rule=>{
        if (rule.favorPD>0){
            oragnizeRules(positiveRuleNodes, rule)
        }else{
            oragnizeRules(negativeRuleNodes, rule)
        }
    })
    // console.info('nodes', positiveRuleNodes, negativeRuleNodes)
    let positiveRuleAgg: RuleAgg[] = [] 
    let negativeRuleAgg: RuleAgg[] = [] 
    // console.info('pos', positiveRuleNodes)
    // console.info('neg', negativeRuleNodes)
    for (var ruleNode of positiveRuleNodes){
        let {antecedent} = ruleNode.rule
        var isContain: boolean = false 
        
        loop1: for (let ruleAgg of positiveRuleAgg){
            isContain = isSubArray(ruleAgg.antecedent, antecedent) 
           
            if(isContain){
                ruleAgg.nodes.push(ruleNode)
                ruleAgg.items = Array.from(
                    new Set( ruleAgg.items.concat(...ruleNode.rule.items) )
                ) 
                break loop1
            }
        }
        if (!isContain){
            positiveRuleAgg.push({
                id: 'agg'+ruleNode.rule.id,
                antecedent: ruleNode.rule.antecedent
                        .filter(attrVal=>{
                            let attr = attrVal.split('=')[0]
                            return keyAttrs.includes(attr)
                        })
                        .sort((a,b)=>{
                            let attrA = a.split('=')[0], attrB = b.split('=')[0]
                            return keyAttrs.indexOf(attrA)-keyAttrs.indexOf(attrB)
                        }),
                nodes: [ruleNode],
                items: ruleNode.rule.items
            })
        }
    }
    for (let ruleNode of negativeRuleNodes){
        let {antecedent} = ruleNode.rule
        let isContain: boolean = false 
        
        loop2: for (let ruleAgg of negativeRuleAgg){
            isContain = isSubArray(ruleAgg.antecedent, antecedent) 
            // console.log('negAn',antecedent)
            if(isContain){
                ruleAgg.nodes.push(ruleNode)
                ruleAgg.items = Array.from(
                    new Set( ruleAgg.items.concat(...ruleNode.rule.items) )
                ) 
            break loop2
            }
        }
        if (!isContain){
            negativeRuleAgg.push({
                id: 'agg'+ruleNode.rule.id,
                antecedent: ruleNode.rule.antecedent
                        .filter(attrVal=>{
                            let attr = attrVal.split('=')[0]
                            return keyAttrs.includes(attr)
                        }),
                nodes: [ruleNode],
                items: ruleNode.rule.items
            })
        }
        // console.log('hinal',negativeRuleAgg)
    }
    // sort rule agg 

    const sortInf = (ante: string[]):number=>{
        const reducer = (acc: number, cur:string)=>{
            let [attr, val] = cur.split('=')
            let ranges = getAttrRanges(samples, attr)
            let rangeIdx = ranges.indexOf(val)
            let unit = Math.pow(10, keyAttrs.length-1 - keyAttrs.indexOf(attr))
            return acc + rangeIdx*unit
        }
        let orderScore = ante.reduce(reducer, 0)
        return orderScore
    }
    positiveRuleAgg.sort((aggA, aggB)=>{
        return sortInf(aggA.antecedent) - sortInf(aggB.antecedent)
    })
    negativeRuleAgg.sort((aggA, aggB)=>{
        return sortInf(aggA.antecedent) - sortInf(aggB.antecedent)
    })
    return {positiveRuleAgg, negativeRuleAgg}
}
// /****
// * Test 
// ******/
// let {keyAttrs} = require('../testdata/academic_lr_key.json'), 
//     samples:DataItem[] = require('../testdata/academic_lr_samples.json'),
//     rules:Rule[] = require('../testdata/academic_lr_rules.json')

// keyAttrs = ['StudentAbsenceDays', 'raisedhands', 'Discussion']
// samples = samples.slice(1000, 2000)
// rules = rules.filter(rule=>Math.abs(rule.risk_dif)>0.01 )
//         .filter(rule=>rule.cls=='class=0')
//         .filter(rule=>containsAttr(rule.antecedent, keyAttrs).length>=keyAttrs.length)
        
// rules.sort((ruleA,ruleB)=>ruleA.antecedent.length - ruleB.antecedent.length)
// console.info(rules.map(rule=>{let a = rule["Unnamed: 0"]; if(a=='1983'){console.info(rule)}}))
// console.info('rules number', rules.length)
// // let results = ruleAggregate(rules, keyAttrs, samples)
// let results = ruleAggregate2(rules, keyAttrs, samples)
// console.info(results)