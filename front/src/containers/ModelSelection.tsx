import ModelSelection from 'components/AppMiddle/ModelSelection';
import { StoreState } from 'types';
import { connect} from 'react-redux';
import { switchModel,ChangeXSclaeMax,switchCompModel,ChangeFoldFlag,changeCompareMode, ChangeSelectionInfo} from 'actions';

export function mapStateToProps(state:StoreState) {
    return {
        showDataset: state.showDataset,
        allRules: state.allRules,
        dragArray: state.dragArray,
        keyAttrNum: state.keyAttrNum,
        accuracy: state.accuracy,
        compareFlag:state.compareFlag,
        selectInfo:state.selectInfo,
        ruleThreshold: state.ruleThreshold
    };
}

export function mapDispatchToProps(dispatch:any) {
    return {
        onChangeXScaleMax:(xScaleMax:number)=>{dispatch(ChangeXSclaeMax(xScaleMax))},
        onChangeModel:(dataset:string,model:string)=>{dispatch(switchModel(dataset,model))},
        onChangeCompModel:(dataset:string,model:string)=>{dispatch(switchCompModel(dataset,model))},
        onChangeFoldFlag:(foldFlag:boolean)=>{dispatch(ChangeFoldFlag(foldFlag))},
        onChangeCompareMode:(compareFlag:boolean)=>{dispatch(changeCompareMode(compareFlag))},
        onChangeSelectionInfo:(selectInfo:{dataset:string,model:string})=>{dispatch(ChangeSelectionInfo(selectInfo))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ModelSelection);