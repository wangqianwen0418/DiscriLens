import {Rule} from 'types';
import {containsAttr} from 'Helpers';
export const filterRules = (rules: Rule[], ruleThreshold:[number, number], keyAttrs: string[]):Rule[]=>{
    return rules
            // risk threshold
            .filter(rule => rule.risk_dif >= ruleThreshold[1] || rule.risk_dif <= ruleThreshold[0])
            .filter(rule => rule.cls == 'class=1')
            // normalize risk diff => favor PD
            .map(rule => {
                return { ...rule, favorPD: rule.cls == 'class=1' ? rule.risk_dif : -1 * rule.risk_dif }
            })
            .filter(rule => containsAttr(rule.antecedent, keyAttrs).length >= keyAttrs.length)
}

export const filterRulesNoThreshold = (rules: Rule[], keyAttrs: string[]):Rule[]=>{
    return rules
            .filter(rule => rule.cls == 'class=1')
            // normalize risk diff => favor PD
            .map(rule => {
                return { ...rule, favorPD: rule.cls == 'class=1' ? rule.risk_dif : -1 * rule.risk_dif }
            })
            .filter(rule => containsAttr(rule.antecedent, keyAttrs).length >= keyAttrs.length)
}
