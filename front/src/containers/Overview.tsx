import Overview from 'components/AppMiddle/Overview';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeRuleThresholds, ChangeDragStatus} from 'actions';

export function mapStateToProps(state:StoreState) {
    return {
        rules: state.rules,
        key_attrs:state.key_attrs,
        thr_rules: state.thr_rules,
        drag_status: state.drag_status,
    };
}

export function mapDispatchToProps(dispatch:any) {
    return {
        onChange:(thr_rules:[number, number])=>{dispatch(ChangeRuleThresholds(thr_rules))},
        changeDrag:(drag_status:boolean,)=>dispatch(ChangeDragStatus(drag_status)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Overview);