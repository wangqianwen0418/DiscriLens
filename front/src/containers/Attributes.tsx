import Attributes from 'components/AppMiddle/Attributes';
import { StoreState } from 'types';
import {ChangeBarArray, ChangeKeyAttr} from 'actions';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    // console.info(state.samples)
    return {
        samples: state.samples,
        key_attrs: state.key_attrs,
        key_groups: state.key_groups,
        protected_attr: state.protected_attr,
        drag_array: state.drag_array,
        fetch_groups_status: state.fetch_groups_status,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        changePosArray:(drag_array:number[][])=>{dispatch(ChangeBarArray(drag_array))},
        onChangeKeyAttr: (key_attrs:string[])=>{dispatch(ChangeKeyAttr(key_attrs))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Attributes);