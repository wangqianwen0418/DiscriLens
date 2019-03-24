import {CHANGE_DRAG_ARRAY,GENERATE_SAMPLES, 
    GENERATE_RULES,CHANGE_PROTECTED_ATTR,CHANGE_RULE_THRESHOLD,
    CHANGE_SAMPLES_FETCH_STATUS, CHANGE_KEY_FETCH_STATUS, 
    CHANGE_RULES_FETCH_STATUS, CHANGE_KEY_ATTR,CHANGE_SHOW_ATTRS,
    CHANGE_XSCALE,CHANGE_SHOW_DATASET,SELBAR,GENERATE_COMP_SAMPLES,GENERATE_COMP_RULES
    ,FOLDFLAG,ACCURACY,TRANS_COMPARE,TRANS_COMPARE_OFFSET,EXPAND_RULE,COMPARE_MODE,
    SELECTION,UNMATCHED,OFFSET} from 'Const';
import axios, { AxiosResponse } from 'axios';
import {DataItem, Status, Rule} from 'types';
import { Dispatch } from 'react';
import { RuleAgg } from 'Helpers';

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
export interface rect {
    x: number,
    y: number,
    w: number,
    h: number,
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
export interface GenerateAccuracy{
    type:ACCURACY,
    accuracy:number[],
}

export const GenerateAccuracy = (accuracy:number[]):GenerateAccuracy =>{
    return ({
        type: ACCURACY,
        accuracy
    });
}
/*****************
all about samples
*****************/ 
export interface offsetLength{
    type:OFFSET,
    offsetLength:number,
}

export const ChangeOffestLength = (offsetLength:number):offsetLength =>{
    return ({
        type: OFFSET,
        offsetLength
    });
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
all about compSamples
*****************/ 
export interface GenerateCompSamples{
    type:GENERATE_COMP_SAMPLES,
    compSamples: DataItem[],
}

export const GenerateCompSamples = (compSamples:DataItem[]):GenerateCompSamples =>{
    return ({
        type: GENERATE_COMP_SAMPLES,
        compSamples
    });
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
all about compRules
*****************/ 
export interface GenerateCompRules{
    type:GENERATE_COMP_RULES,
    compRules: Rule[]
}

export const GenerateCompRules = (compRules:Rule[]):GenerateCompRules =>{
    return ({
        type: GENERATE_COMP_RULES,
        compRules
    });
}


/*****************
all about compMode
*****************/ 
export interface compareMode{
    type:COMPARE_MODE,
    compareFlag: boolean
}

export const changeCompareMode = (compareFlag:boolean):compareMode =>{
    return ({
        type: COMPARE_MODE,
        compareFlag
    });
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
    protectedAttr:string,
    protectedVal:string
}

export const ChangeProtectedAttr = (protectedAttr:string, protectedVal:string=''):ChangeProtectedAttr =>{
    return ({
        type: CHANGE_PROTECTED_ATTR,
        protectedAttr,
        protectedVal
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
all about transfer compareList
*****************/ 
export interface compareList{
    type:TRANS_COMPARE,
    compareList:{b2:rect[],r:{y:number,r:string[]}[],p:number,yMax:any}
}

export const TransCompareList = (compareList:{b2:rect[],r:{y:number,r:string[]}[],p:number,yMax:any}):compareList =>{
    return ({
        type: TRANS_COMPARE,
        compareList
    });
}


/*****************
all about transfer expandRule
*****************/ 
export interface expandRule{
    type:EXPAND_RULE,
    expandRule:{id: number, newAttrs: string[], children: string[]}
}

export const TransExpandRule = (expandRule:{id: number, newAttrs: string[], children: string[]}):expandRule =>{
    return ({
        type: EXPAND_RULE,
        expandRule
    });
}

/*****************
all about transfer compareOffset
*****************/ 
export interface compareOffset{
    type:TRANS_COMPARE_OFFSET,
    compareOffset:{y:number[],index:number[]}
}

export const TransCompareOffset = (compareOffset:{y:number[],index:number[]}):compareOffset =>{
    return ({
        type: TRANS_COMPARE_OFFSET,
        compareOffset
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


/*****************
all about fold flag
*****************/ 
export interface foldFlag{
    type:FOLDFLAG,
    foldFlag:boolean
}

export const ChangeFoldFlag = (foldFlag:boolean):foldFlag =>{
    return ({
        type: FOLDFLAG,
        foldFlag
    });
}

/*****************
all about selection
*****************/ 
export interface selectionInfo{
    type:SELECTION,
    selectInfo:{dataset:string,model:string}
}

export const ChangeSelectionInfo = (selectInfo:{dataset:string,model:string}):selectionInfo =>{
    return ({
        type: SELECTION,
        selectInfo
    });
}
/*****************
all about unMatchedRules
*****************/ 
export interface unMatchedRules{
    type:UNMATCHED,
    unMatchedRules:{pos:[RuleAgg,number][],neg:[RuleAgg,number][]}
}

export const ChangeUnMatchedRules = (unMatchedRules:{pos:[RuleAgg,number][],neg:[RuleAgg,number][]}):unMatchedRules =>{
    return ({
        type: UNMATCHED,
        unMatchedRules
    });
}
// combine to start

export const Start = (dataset_name:string, model_name: string, protect_attr: string)=>{
    return (dispatch: any)=>{
        dispatch(ChangeSamplesFetchStatus(Status.PENDING))
        dispatch(ChangeKeyFetchStatus(Status.PENDING))
        dispatch(ChangeRulesFetchStatus(Status.PENDING))
        dispatch(FetchRules(dataset_name, model_name))
        dispatch(ChangeProtectedAttr(protect_attr, ''))
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
    let {keyAttrs,accuracy } = require('../testdata/'+ dataset + '_key.json'), 
    jsonSamples = require('../testdata/'+ dataset + '_' + model + '_samples.json'),
    jsonRule = require('../testdata/'+ dataset + '_' + model + '_rules.json'),
    dragArray = [...Object.keys(jsonSamples[0])]

    // remove the attribute 'id' and 'class'
    dragArray.splice(dragArray.indexOf('id'), 1)
    dragArray.splice(dragArray.indexOf('class'), 1)
    // if (dragArray.includes(protectedAttr)){
    //   dragArray.splice(dragArray.indexOf(protectedAttr), 1)
    // }  
    // move key attributes to the front
    dragArray = keyAttrs.concat(dragArray.filter(attr=>!keyAttrs.includes(attr)))

    let protectedVal = jsonRule[0].pd
    protectedAttr = protectedVal.split('=')[0]

    return (dispatch: any) =>{
        dispatch(GenerateSamples(jsonSamples))
        dispatch(ChangeKeyAttr(keyAttrs))
        dispatch(ChangeProtectedAttr(protectedAttr, protectedVal))
        dispatch(ChangeShowAttr(keyAttrs))
        dispatch(ChangeDragArray(dragArray))
        dispatch(GenerateRules(jsonRule))
        dispatch(GenerateAccuracy(accuracy))
    }
}

export const switchModel=(dataset:string,model:string)=>{
    let jsonSamples = require('../testdata/'+ dataset + '_' + model + '_samples.json'),
    jsonRule = require('../testdata/'+ dataset + '_' + model + '_rules.json')

    return (dispatch: any) =>{
        dispatch(GenerateRules(jsonRule))
        dispatch(GenerateSamples(jsonSamples))
    }
}

export const switchCompModel = (dataset:string,model:string)=>{
    
    if((dataset=='')||(model=='')){
        return (dispatch:any) =>{
            dispatch(GenerateCompSamples(null))
            dispatch(GenerateCompRules(null))
        }
    }
    else{
        let jsonSamples = require('../testdata/' + dataset + '_' + model + '_samples.json'),
        jsonRule = require('../testdata/' + dataset + '_' + model + '_rules.json')
        
        if(!model||!dataset){
            jsonRule = null
            jsonSamples = null
        }

        return (dispatch:any) =>{
            dispatch(GenerateCompSamples(jsonSamples))
            dispatch(GenerateCompRules(jsonRule))
        }
    }
    
}

export type AllActions = GenerateSamples|GenerateRules|GenerateCompRules|GenerateCompSamples|ChangeSamplesFetchStatus
|ChangeRulesFetchStatus|ChangeKeyFetchStatus|ChangeRuleThresholds|ChangeProtectedAttr| GenerateAccuracy|compareOffset|
ChangeDragArray|ChangeKeyAttr|ChangeShowAttr|showDataset|ChangeXScaleMax|selectedBar|foldFlag|compareList|expandRule|
compareMode|unMatchedRules|selectionInfo|offsetLength