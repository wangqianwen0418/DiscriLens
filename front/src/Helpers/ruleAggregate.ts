import {Rule} from 'types';
export const containsAttr = (ante: Rule['antecedent'], attr: string):number=>{
    for (let i =0; i<ante.length;i++){
        let attrVal = ante[i]
        if (attrVal.includes(attr)){
            return i
        }
    }
    return -1
}
export interface RuleAggregate{
    rule: Rule,
    child: RuleAggregate[]
}
export const ruleAggregate = (rules:Rule[], key_attrs: string[])=>{
    // let results: RuleAggregate[] = []
    // key_attrs.forEach(attr=>{
    //     rules.forEach((rule, ruleIdx)=>{
    //         let {antecedent} = rule
    //     })
    // })
}

/****
* Test 
******/