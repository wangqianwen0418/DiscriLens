import {CHANGE_DRAG_ARRAY,GENERATE_SAMPLES, 
    GENERATE_RULES,CHANGE_PROTECTED_ATTR,CHANGE_RULE_THRESHOLD,
    CHANGE_SAMPLES_FETCH_STATUS, CHANGE_KEY_FETCH_STATUS, 
    CHANGE_RULES_FETCH_STATUS, CHANGE_KEY_ATTR,CHANGE_SHOW_ATTRS,
    CHANGE_XSCALE,CHANGE_SHOW_DATASET,SELBAR} from 'Const';
import axios, { AxiosResponse } from 'axios';
import {DataItem, Status, Rule} from 'types';
import { Dispatch } from 'react';

const axiosInstance = axios.create({
    baseURL: `http://localhost:7777/api/`,
    // timeout: 1000,
    headers: {
        'Access-Control-Allow-Origin': '*'
    }
});

export type ThunkAction<R, S, E> = (dispatch: Dispatch<S>, getState: () => S, extraArgument: E) => R;

export interface Dispatch<S> {
  <R, E>(asyncAction: ThunkAction<R, S, E>): R;
}
export interface Dispatch<S> {
  <A>(action:A &{type:any}): A &{type:any};
}

/*****************g
 *get key attributes which used to define groups
*****************/ 
// export interface FindKeys{
//     type:FIND_KEYS,
//     keyAttrs: string[],
//     // key_groups: KeyGroup[],
// }
// export const FindKeys = (keyAttrs: string[]):FindKeys => {
//     return {
//         type:FIND_KEYS,
//         keyAttrs, 
//         // key_groups
//     }
// }

export interface ChangeKeyFetchStatus{
    type:CHANGE_KEY_FETCH_STATUS,
    status: Status
}
export const ChangeKeyFetchStatus = (status: Status):ChangeKeyFetchStatus => {
    return {
        type:CHANGE_KEY_FETCH_STATUS,
        status
    }
}


export const FetchKeys = (dataset_name:string, model_name: string, protect_attr: string)=>{
    return (dispatch:any) => {
        dispatch( ChangeKeyFetchStatus(Status.PENDING) )
        const url = `/groups?dataset=${dataset_name}&model=${dataset_name}_${model_name}&protectAttr=${protect_attr}`
        axiosInstance.get(url)
        .then((response: AxiosResponse) => {
            if (response.status !=200) {
                throw Error(response.statusText);
            }else{
                let {keyAttrs} = response.data
                dispatch(ChangeKeyAttr(keyAttrs))
            }
        }).then(()=>{
            dispatch( ChangeKeyFetchStatus(Status.COMPLETE) )
        })
    };
}

/*****************
all about samples
*****************/ 
export interface GenerateSamples{
    type:GENERATE_SAMPLES,
    samples: DataItem[],
}

export const GenerateSamples = (samples:DataItem[]):GenerateSamples =>{
    return ({
        type: GENERATE_SAMPLES,
        samples
    });
}
export interface ChangeSamplesFetchStatus{
    type:CHANGE_SAMPLES_FETCH_STATUS,
    status: Status
}
export const ChangeSamplesFetchStatus = (status: Status): ChangeSamplesFetchStatus=>{
    return {
        type: CHANGE_SAMPLES_FETCH_STATUS,
        status
    }
}

export const FetchSamples = (dataset_name:string, model_name: string)=>{
    return (dispatch:any) => {
        dispatch(ChangeSamplesFetchStatus(Status.PENDING))
        //const url = `/samples?dataset=${dataset_name}&model=${model_name}`
        const url = `/samples?dataset=${dataset_name}&model=${dataset_name}_${model_name}`
        return axiosInstance
                .get(url)
                .then((response: AxiosResponse) => {
                    if (response.status !=200) {
                        throw Error(response.statusText);
                    }else{
                        let samples = response.data
                        dispatch(GenerateSamples(samples))
                    }
                }).then(()=>{
                    dispatch(ChangeSamplesFetchStatus(Status.COMPLETE))
                })
    };
}

/*****************
all about rules
*****************/ 
export interface GenerateRules{
    type:GENERATE_RULES,
    rules: Rule[]
}

export const GenerateRules = (rules:Rule[]):GenerateRules =>{
    return ({
        type: GENERATE_RULES,
        rules
    });
}
export interface ChangeRulesFetchStatus{
    type:CHANGE_RULES_FETCH_STATUS,
    status: Status
}
export const ChangeRulesFetchStatus = (status: Status): ChangeRulesFetchStatus=>{
    return {
        type: CHANGE_RULES_FETCH_STATUS,
        status
    }
}
export const FetchRules = (dataset_name:string, model_name: string)=>{
    return (dispatch:any) => {
        dispatch(ChangeRulesFetchStatus(Status.PENDING))
        const url = `/rules?dataset=${dataset_name}_${model_name}`
        return axiosInstance
                .get(url)
                .then((response: AxiosResponse) => {
                    if (response.status !=200) {
                        throw Error(response.statusText);
                    }else{
                        let rules = response.data
                        dispatch(GenerateRules(rules))
                    }
                }).then(()=>{
                    dispatch(ChangeRulesFetchStatus(Status.COMPLETE))
                })
    };
}

/*****************
all about CHANGING rule threshold
*****************/ 
export interface ChangeRuleThresholds{
    type:CHANGE_RULE_THRESHOLD,
    ruleThreshold:[number, number]
}

export const ChangeRuleThresholds = (ruleThreshold:[number, number]):ChangeRuleThresholds =>{
    return ({
        type: CHANGE_RULE_THRESHOLD,
        ruleThreshold: [ruleThreshold[0]||0, ruleThreshold[1]||0]
    });
}


/*****************
all about protectedAttr
*****************/ 
export interface ChangeProtectedAttr{
    type:CHANGE_PROTECTED_ATTR,
    protectedAttr:string
}

export const ChangeProtectedAttr = (protectedAttr:string):ChangeProtectedAttr =>{
    return ({
        type: CHANGE_PROTECTED_ATTR,
        protectedAttr
    });
}

/*****************
the array that store the order of attributes
*****************/ 
export interface ChangeDragArray{
    type:CHANGE_DRAG_ARRAY,
    dragArray:string[]
}

export const ChangeDragArray = (dragArray:string[]):ChangeDragArray =>{
    return ({
        type: CHANGE_DRAG_ARRAY,
        dragArray
    });
}


/*****************
all about changing showAttrs
*****************/ 
export interface ChangeShowAttr{
    type:CHANGE_SHOW_ATTRS,
    showAttrs: string[]
}

export const ChangeShowAttr = (showAttrs:string[]):ChangeShowAttr =>{
    return ({
        type: CHANGE_SHOW_ATTRS,
        showAttrs
    });
}

/*****************
all about changing xScale max
*****************/ 
export interface ChangeXScaleMax{
    type:CHANGE_XSCALE,
    xScaleMax: number
}

export const ChangeXSclaeMax = (xScaleMax:number):ChangeXScaleMax =>{
    return ({
        type: CHANGE_XSCALE,
        xScaleMax
    });
}


/*****************
all about changing selected bar
*****************/ 
export interface selectedBar{
    type:SELBAR,
    selected_bar:string[]
}

export const ChangeSelectedBar = (selected_bar:string[]):selectedBar =>{
    return ({
        type: SELBAR,
        selected_bar
    });
}

// combine to start

export const Start = (dataset_name:string, model_name: string, protect_attr: string)=>{
    return (dispatch: any)=>{
        dispatch(ChangeSamplesFetchStatus(Status.PENDING))
        dispatch(ChangeKeyFetchStatus(Status.PENDING))
        dispatch(ChangeRulesFetchStatus(Status.PENDING))
        dispatch(FetchRules(dataset_name, model_name))
        dispatch(ChangeProtectedAttr(protect_attr))
        FetchSamples(dataset_name, model_name)(dispatch)
        .then(
            () =>{ 
                dispatch (FetchKeys(dataset_name, model_name, protect_attr))}
        )
    }
}

/*****************
change key attrs
*****************/ 

export interface ChangeKeyAttr{
    type: CHANGE_KEY_ATTR,
    keyAttrs: string[]
}

export const ChangeKeyAttr = (keyAttrs: string[])=>{
    return {
        type: CHANGE_KEY_ATTR,
        keyAttrs
    }
}

export interface showDataset{
    type: CHANGE_SHOW_DATASET,
    showDataset: string
}

export const changeShowDataset = (showDataset: string): showDataset=>{
    return {
        type: CHANGE_SHOW_DATASET,
        showDataset
    }
}
// export const KeyAttr = (keyAttrs: string[], key_groups:KeyGroup[])=>{
//     return (dispatch: any)=>{
//         dispatch(FindKeys(keyAttrs, key_groups))
//     }
// }

export const ChangeDataSet = (dataset:string, model:string, protectedAttr:string) =>{
    let key_attrs = require('../testdata/'+ dataset + '_key.json'), 
    jsonSamples = require('../testdata/'+ dataset + '_' + model + '_samples.json'),
    jsonRule = require('../testdata/'+ dataset + '_' + model + '_rules.json'),
    dragArray = [...Object.keys(jsonSamples[0])]

    // remove the attribute 'id' and 'class'
    dragArray.splice(dragArray.indexOf('id'), 1)
    dragArray.splice(dragArray.indexOf('class'), 1)
    if (dragArray.includes(protectedAttr)){
      dragArray.splice(dragArray.indexOf(protectedAttr), 1)
    }  
    console.log(key_attrs)
    // move key attributes to the front
    dragArray = key_attrs.concat(dragArray.filter(attr=>!key_attrs.includes(attr)))

    return (dispatch: any) =>{
        dispatch(GenerateSamples(jsonSamples))
        dispatch(ChangeKeyAttr(key_attrs))
        dispatch(ChangeProtectedAttr(protectedAttr))
        dispatch(ChangeShowAttr(key_attrs))
        dispatch(ChangeDragArray(dragArray))
        dispatch(dispatch(GenerateRules(jsonRule)))
    }
}

export const switchModel=(dataset:string,model:string)=>{
    let jsonSamples = require('../testdata/'+ dataset + '_' + model + '_samples.json'),
    jsonRule = require('../testdata/'+ dataset + '_' + model + '_rules.json')

    return (dispatch: any) =>{
        dispatch(dispatch(GenerateRules(jsonRule)))
        dispatch(GenerateSamples(jsonSamples))
    }
}

export type AllActions = GenerateSamples|GenerateRules|ChangeSamplesFetchStatus
|ChangeRulesFetchStatus|ChangeKeyFetchStatus|ChangeRuleThresholds|ChangeProtectedAttr|
ChangeDragArray|ChangeKeyAttr|ChangeShowAttr|showDataset|ChangeXScaleMax|selectedBar