import Overview from 'components/AppMiddle/Overview';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeRuleThresholds} from 'actions';

export function mapStateToProps(state:StoreState) {
    return {
        allRules: state.allRules,
        compAllRules: state.compAllRules,
        protectedVal: state.protectedVal,
        keyAttrs: state.dragArray.slice(0, state.keyAttrNum),
        ruleThreshold: state.ruleThreshold,
        xScaleMax: state.xScaleMax,
        compareFlag:state.compareFlag,
    };
}

export function mapDispatchToProps(dispatch:any) {
    return {
        onChangeRuleThreshold:(thr_rules:[number, number])=>{dispatch(ChangeRuleThresholds(thr_rules))},
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Overview);