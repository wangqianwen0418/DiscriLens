import Side from 'components/Side';
import {Start } from 'actions';
import { StoreState } from 'types';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    return {
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        onStart:(dataset_name: string, model_name:string, protect_name: string)=>{dispatch(Start(dataset_name, model_name, protect_name))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Side);