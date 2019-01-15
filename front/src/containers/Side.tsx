import Side from 'components/Side';
import {FetchSamples } from 'actions';
import { StoreState } from 'types';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onGenerateSamples:(dataset_name: string, model_name:string)=>{dispatch(FetchSamples(dataset_name, model_name))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Side);