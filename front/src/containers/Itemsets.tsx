import Itemsets from 'components/AppMiddle/Itemsets2';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeShowAttrs } from 'actions';
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
        show_attrs: state.show_attrs,
        fetch_groups_status: state.fetch_groups_status
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        // onChange:(thr_rules:[number, number])=>{dispatch(ChangeRuleThresholds(thr_rules))},
        onChangeShowAttrs: (show_attrs: string[])=>dispatch(ChangeShowAttrs(show_attrs))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Itemsets);
