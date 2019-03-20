import Resemble from 'components/AppMiddle/Resemble';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeKeyAttr } from 'actions';
//import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
        foldFlag: state.foldFlag,
        compSamples:state.compSamples,
        rules: state.rules,
        samples: state.samples,
        compRules:state.compRules,
        compareFlag:state.compareFlag,
        causal: state.causal,
        keyAttrNum:state.keyAttrNum,
        dragArray:state.dragArray,
        protectedAttr:state.protectedAttr,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onChangeKeyAttrs:(keyAttrs:string[])=>dispatch(ChangeKeyAttr(keyAttrs)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Resemble);