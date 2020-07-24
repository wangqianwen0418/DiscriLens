import Resemble from 'components/AppMiddle/Resemble';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { ChangeKeyAttr,switchCompModel,switchModel} from 'actions';
//import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
        foldFlag: state.foldFlag,
        models:state.models,
        compSamples:state.compSamples,
        rules: state.rules,
        samples: state.samples,
        compRules:state.compRules,
        compareFlag:state.compareFlag,
        causal: state.causal,
        keyAttrNum:state.keyAttrNum,
        dragArray:state.dragArray,
        protectedAttr:state.protectedAttr,
        showDataset:state.showDataset,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onChangeKeyAttrs:(keyAttrs:string[])=>dispatch(ChangeKeyAttr(keyAttrs)),
        onChangeModel:(dataset:string,model:string)=>{dispatch(switchModel(dataset,model))},
        onChangeCompModel:(dataset:string,model:string)=>{dispatch(switchCompModel(dataset,model))},
        // onChangeCompareMode:(compareFlag:boolean, models:string[])=>{dispatch(changeCompareMode(compareFlag, models))},
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Resemble);