import {Rule} from 'types';
import {containsAttr} from 'Helpers';
export const filterRules = (rules: Rule[], ruleThreshold:[number, number], keyAttrs: string[]):Rule[]=>{
    rules = filterRulesNoThreshold( rules, keyAttrs)
            // risk threshold
    // console.info(rules, ruleThreshold)
    rules = rules.filter(rule => rule.favorPD >=0? (rule.favorPD>=ruleThreshold[1]) : rule.favorPD <= ruleThreshold[0])
           
    // console.info(rules)
    return rules
}

export const filterRulesNoThreshold = (rules: Rule[], keyAttrs: string[]):Rule[]=>{
    rules= rules
            .filter(rule => rule.cls == 'class=1')
            // normalize risk diff => favor PD
            .map(rule => {
                return { ...rule, favorPD: rule.cls == 'class=1' ? rule.risk_dif : -1 * rule.risk_dif }
            })
    rules = rules
            .filter(rule => containsAttr(rule.antecedent, keyAttrs).length >= keyAttrs.length)
    return rules
}
