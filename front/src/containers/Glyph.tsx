import Glyph from 'components/AppMiddle/Glyph';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeRuleThresholds , ChangeDragStatus } from 'actions';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    // console.info(state.samples)
    return {
        rules: state.rules,
        samples: state.samples,
        thr_rules: state.thr_rules,
        key_attrs:state.key_attrs,
        drag_array: state.drag_array,
        protected_attr: state.protected_attr,
        drag_status: state.drag_status,
        show_attrs: state.show_attrs,
        fetch_groups_status: state.fetch_groups_status
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onChange:(thr_rules:[number, number])=>{dispatch(ChangeRuleThresholds(thr_rules))},
        ChangeDragStatus: (drag_status: boolean)=>{dispatch(ChangeDragStatus(drag_status))},
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Glyph);