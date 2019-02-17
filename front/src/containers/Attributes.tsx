import Attributes from 'components/AppMiddle/Attributes';
import { StoreState } from 'types';
import {ChangeBarArray, ChangeKeyAttr, ChangeShowAttrs, ChangeDragStatus} from 'actions';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    // console.info(state.samples)
    return {
        samples: state.samples,
        key_attrs: state.key_attrs,
        key_groups: state.key_groups,
        protected_attr: state.protected_attr,
        drag_status: state.drag_status,
        fetch_groups_status: state.fetch_groups_status,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        changePosArray:(drag_array:string[])=>{dispatch(ChangeBarArray(drag_array))},
        onChangeKeyAttr: (key_attrs:string[])=>{dispatch(ChangeKeyAttr(key_attrs))},
        changeDragStatus: (drag_status: boolean)=>{dispatch(ChangeDragStatus(drag_status))},
        changeShowAttrs: (show_attrs:string[])=>{dispatch(ChangeShowAttrs(show_attrs))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Attributes);