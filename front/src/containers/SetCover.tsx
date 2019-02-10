import SetCover from 'components/AppMiddle/SetCover';
import { StoreState } from 'types';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

let rules = require('../testdata/academic_rules.json')

const filterRule = (rules:any[], rulesRange:[number, number], key_attrs: string[])=>{
    const outside = (val:number, range: [number, number]):boolean=>{
        return val<=range[0] || val>=range[1]
    }
    const overlap = (array1: string[], array2:string[]):boolean=>{
        for (let i=0; i<array1.length; i++){
            let attr = array1[i].split('=')[0]
            if (array2.indexOf(attr)!=-1){
                return true
            }
        }
        return false
    }
    return rules
            .filter(rule=>outside(rule.risk_dif, rulesRange))
            .filter(rule=>overlap(rule.antecedent, key_attrs))
}

export function mapStateToProps(state:StoreState) {
    // console.info(state.SetCover)
    return {
        // rules: state.rules,
        // range: state.rulesRange
        rules: filterRule(rules, [-0.1, 0.1], state.key_attrs),
        benefitCls: 'H',
        // attrs: Object.keys(state.samples[0])
        ranges: Object.keys(state.samples[0])
            .sort((a,b)=>state.key_attrs.indexOf(b)-state.key_attrs.indexOf(a)) // put key attribute at the front
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