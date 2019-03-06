import Attributes from 'components/AppMiddle/Attributes';
import { StoreState } from 'types';
import {ChangeDragArray, ChangeKeyAttr, ChangeShowAttr, ChangeSelectedBar} from 'actions';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    // console.info(state.samples)
    return {
        samples: state.samples,
        keyAttrNum: state.keyAttrNum,
        dragArray: state.dragArray,
        showAttrNum: state.showAttrNum,
        protectedAttr: state.protectedAttr,
        fetchKeyStatus: state.fetchKeyStatus,
        selected_bar: state.selected_bar,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onChangeDragArray:(dragArray:string[])=>{dispatch(ChangeDragArray(dragArray))},
        onChangeKeyAttr: (keyAttrs:string[])=>{dispatch(ChangeKeyAttr(keyAttrs))},
        onChangeShowAttr: (showAttrs:string[])=>{dispatch(ChangeShowAttr(showAttrs))},
        onChangeSelectedBar: (selected_bar:string[])=>{dispatch(ChangeSelectedBar(selected_bar))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Attributes);