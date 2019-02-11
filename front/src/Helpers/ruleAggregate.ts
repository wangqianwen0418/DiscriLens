import {Rule} from 'types';
export interface RuleAggregate{
    rule: Rule,
    child: RuleAggregate[]
}
export const ruleAggregate = (rules:Rule[], key_attrs: string[])=>{
    // let results: RuleAggregate[] = []
    // key_attrs.forEach((attr, attr_i)=>{

    // })
}