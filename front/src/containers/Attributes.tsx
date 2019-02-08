import Attributes from 'components/AppMiddle/Attributes';
import { StoreState } from 'types';
import {Pos} from 'actions';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState, ownProps?:any) {
    // console.info(state.samples)
    return {
        samples: state.samples,
        key_attrs: state.key_attrs,
        key_groups: state.key_groups,
        protected_attr: state.protected_attr,
        g_endPos: state.g_endPos,
        fetch_groups_status: state.fetch_groups_status,
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
        changePosArray:(g_endPos:number[][])=>{dispatch(Pos(g_endPos))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Attributes);