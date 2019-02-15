import {Rule, DataItem} from 'types';
// import {getAttrRanges} from './getAttrRanges';


export interface RuleNode{
    rule: Rule,
    child: RuleNode[]
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
    for (let ruleAgg of ruleCollection){
        if (isSubArray(ruleAgg.rule.antecedent, rule.antecedent)){
            oragnizeRules(ruleAgg.child, rule)
        }
    }
    let isSibling = (ruleCollection
        .filter(ruleAgg=>isSubArray(ruleAgg.rule.antecedent, rule.antecedent))
        .length==0)
    if (isSibling) {
        ruleCollection.push({rule, child: []})
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

export const ruleAggregate = (rules:Rule[], key_attrs: string[], samples: DataItem[])=>{
    rules.sort((ruleA,ruleB)=>ruleA.antecedent.length - ruleB.antecedent.length)
    let positiveRuleNodes: RuleNode[] = [] 
    let negativeRuleNodes: RuleNode[] = [] 
    rules.forEach(rule=>{
        if (rule.favorPD>0){
            oragnizeRules(positiveRuleNodes, rule)
        }else{
            oragnizeRules(negativeRuleNodes, rule)
        }
    })
    let positiveRuleAgg: RuleAgg[] = [] 
    let negativeRuleAgg: RuleAgg[] = [] 

    for (let ruleNode of positiveRuleNodes){
        let {antecedent} = ruleNode.rule
        var isContain: boolean = false 
        loop: for (let ruleAgg of positiveRuleAgg){
            isContain = isSubArray(ruleAgg.antecedent, antecedent) 
            if(isContain){
                ruleAgg.nodes.push(ruleNode)
                ruleAgg.items = Array.from(
                    new Set( ruleAgg.items.concat(...ruleNode.rule.items) )
                ) 
                break loop
            }
        }
        if (!isContain){
            positiveRuleAgg.push({
                id: ruleNode.rule.id+'_agg',
                antecedent: ruleNode.rule.antecedent
                        .filter(attrVal=>{
                            let attr = attrVal.split('=')[0]
                            return key_attrs.includes(attr)
                        }),
                nodes: [ruleNode],
                items: ruleNode.rule.items
            })
        }
    }

    for (let ruleNode of negativeRuleNodes){
        let {antecedent} = ruleNode.rule
        let isContain: boolean = false 
        for (let ruleAgg of negativeRuleAgg){
            isContain = isSubArray(ruleAgg.antecedent, antecedent) 
            if(isContain){
                ruleAgg.nodes.push(ruleNode)
                ruleAgg.items = Array.from(
                    new Set( ruleAgg.items.concat(...ruleNode.rule.items) )
                ) 
            }
            break
        }
        if (!isContain){
            negativeRuleAgg.push({
                id: ruleNode.rule.id+'_agg',
                antecedent: ruleNode.rule.antecedent
                        .filter(attrVal=>{
                            let attr = attrVal.split('=')[0]
                            return key_attrs.includes(attr)
                        }),
                nodes: [ruleNode],
                items: ruleNode.rule.items
            })
        }
    }
    return {positiveRuleAgg, negativeRuleAgg}
}

// /****
// * Test 
// ******/
// let {key_attrs} = require('../testdata/academic_lr_key.json'), 
//     samples:DataItem[] = require('../testdata/academic_lr_samples.json'),
//     rules:Rule[] = require('../testdata/academic_lr_rules.json')

// key_attrs = ['StudentAbsenceDays', 'raisedhands', 'Discussion']
// samples = samples.slice(1000, 2000)
// rules = rules.filter(rule=>Math.abs(rule.risk_dif)>0.01 )
//         .filter(rule=>rule.cls=='class=L')
//         .filter(rule=>containsAttr(rule.antecedent, key_attrs).length>=key_attrs.length)
        
// rules.sort((ruleA,ruleB)=>ruleA.antecedent.length - ruleB.antecedent.length)
// console.info(rules.map(rule=>{let a = rule["Unnamed: 0"]; if(a=='1983'){console.info(rule)}}))
// console.info('rules number', rules.length)
// // let results = ruleAggregate(rules, key_attrs, samples)
// let results = ruleAggregate2(rules, key_attrs, samples)
// console.info(results)