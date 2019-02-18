import Attributes from 'components/AppMiddle/Attributes';
import { StoreState } from 'types';
import {ChangeDragArray, ChangeKeyAttr, ChangeShowAttrs} from 'actions';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    // console.info(state.samples)
    return {
        samples: state.samples,
        key_attrs: state.key_attrs,
        drag_array: state.drag_array,
        show_attrs: state.show_attrs,
        key_groups: state.key_groups,
        protected_attr: state.protected_attr,
        drag_status: state.drag_status,
        fetch_groups_status: state.fetch_groups_status,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onChangeDragArray:(drag_array:string[])=>{dispatch(ChangeDragArray(drag_array))},
        onChangeKeyAttr: (key_attrs:string[])=>{dispatch(ChangeKeyAttr(key_attrs))},
        changeShowAttrs: (show_attrs:string[])=>{dispatch(ChangeShowAttrs(show_attrs))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Attributes);