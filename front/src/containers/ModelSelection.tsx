import ModelSelection from 'components/AppMiddle/ModelSelection';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeRuleThresholds, switchModel} from 'actions';

export function mapStateToProps(state:StoreState) {
    return {
        showDataset: state.showDataset,
        allRules: state.allRules,
        keyAttrs: state.dragArray.slice(0, state.keyAttrNum),
        ruleThreshold: state.ruleThreshold
    };
}

export function mapDispatchToProps(dispatch:any) {
    return {
        onChangeModel:(dataset:string,model:string)=>{dispatch(switchModel(dataset,model))},
        onChangeRuleThreshold:(thr_rules:[number, number])=>{dispatch(ChangeRuleThresholds(thr_rules))},
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ModelSelection);