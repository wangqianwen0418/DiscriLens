import Side from 'components/Side';
import {ChangeRuleThresholds ,ChangeDataSet,changeShowDataset} from 'actions';
import { StoreState } from 'types';
import { connect} from 'react-redux';
//import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
        ruleThreshold: state.ruleThreshold,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onStart:(dataset_name: string, model_name:string, protect_attr:string)=>{dispatch(ChangeDataSet(dataset_name, model_name, protect_attr))},
        onChange:(ruleThreshold:[number, number])=>{dispatch(ChangeRuleThresholds(ruleThreshold))},
        onSelect:(showDataset: string)=>{dispatch(changeShowDataset(showDataset))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Side);