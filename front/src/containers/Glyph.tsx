import Glyph from 'components/AppMiddle/Glyph';
import { StoreState } from 'types';
import { connect} from 'react-redux';
// import { Dispatch } from 'redux';

export function mapStateToProps(state:StoreState) {
    // console.info(state.samples)
    return {
        rules: state.rules,
        samples: state.samples,
        thr_rules: state.thr_rules,
        key_attrs:state.key_attrs,
        g_endPos: state.g_endPos,
        fetch_groups_status: state.fetch_groups_status
    };
}

export function mapDispatchToProps(dispatch: any) {
    return {
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Glyph);