import Side from 'components/Side';
import {Start, ChangeRuleThresholds } from 'actions';
import { StoreState } from 'types';
import { connect} from 'react-redux';
//import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
        thr_rules: state.thr_rules,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onStart:(dataset_name: string, model_name:string, protect_attr:string)=>{dispatch(Start(dataset_name, model_name, protect_attr))},
        onChange:(thr_rules:[number, number])=>{dispatch(ChangeRuleThresholds(thr_rules))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Side);