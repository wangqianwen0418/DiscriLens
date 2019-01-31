import SetCover from 'components/AppMiddle/SetCover';
import { StoreState } from 'types';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

let rules = require('../testdata/academic_rules.json')

const filterRule = (rules:any[], rulesRange:[number, number], key_attrs: string[])=>{
    const outside = (elift:number, rulesRange: [number, number]):boolean=>{
        return elift<=rulesRange[0] || elift>=rulesRange[1]
    }
    const overlap = (antecedent: string[], key_attrs:string[]):boolean=>{
        for (let i=0; i<antecedent.length; i++){
            let attr = antecedent[i].split('=')[0]
            if (key_attrs.indexOf(attr)!=-1){
                return true
            }
        }
        return false
    }
    return rules
            .filter(rule=>outside(rule.elift, rulesRange))
            .filter(rule=>overlap(rule.antecedent, key_attrs))
}

export function mapStateToProps(state:StoreState) {
    // console.info(state.SetCover)
    return {
        // rules: state.rules,
        // range: state.rulesRange
        rules: filterRule(rules, [0.8, 1.1], state.key_attrs),
        // attrs: Object.keys(state.samples[0])
        ranges: Object.keys(state.samples[0])
            .sort(attr=>state.key_attrs.indexOf(attr)) // put key attribute at the front
            .map((attr)=>{
                return {
                    attr,
                    range: state.samples.map(d=>d[attr])
                            .filter((x:string, i:number, a:string[]) => a.indexOf(x) == i)
                }
        })
        
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SetCover);