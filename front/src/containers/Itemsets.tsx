import Itemsets from 'components/AppMiddle/Itemsets2';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeShowAttr, ChangeDragArray } from 'actions';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    // console.info(state.samples)
    return {
        rules: state.rules,
        samples: state.samples,
        ruleThreshold: state.ruleThreshold,
        keyAttrNum:state.keyAttrNum,
        dragArray: state.dragArray, 
        protectedAttr: state.protectedAttr,
        showAttrNum: state.showAttrNum,
        fetchKeyStatus: state.fetchKeyStatus
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onChangeShowAttr: (showAttrs: string[])=>dispatch(ChangeShowAttr(showAttrs)),
        onChangeDragArray: (dragArray: string[])=>(dispatch(ChangeDragArray(dragArray)))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Itemsets);
