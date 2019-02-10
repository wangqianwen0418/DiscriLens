import {BAR_ARRAY,GENERATE_SAMPLES, FIND_GROUPS, 
    GENERATE_RULES,CHANGE_PROTECTED_ATTR,CHANGE_RULE_THRESHOLD,
    CHANGE_SAMPLES_FETCH_STATUS, CHANGE_GROUPS_FETCH_STATUS, 
    CHANGE_RULES_FETCH_STATUS, CHANGE_KEY_ATTR} from 'Const';
import axios, { AxiosResponse } from 'axios';
import {DataItem, KeyGroup, Status} from 'types';
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

/*****************
all about groups
*****************/ 
export interface FindGroups{
    type:FIND_GROUPS,
    key_attrs: string[],
    key_groups: KeyGroup[],
}
export const FindGroups = (key_attrs: string[], key_groups: KeyGroup[]):FindGroups => {
    return {
        type:FIND_GROUPS,
        key_attrs, 
        key_groups
    }
}

export interface ChangeGroupsFetchStatus{
    type:CHANGE_GROUPS_FETCH_STATUS,
    status: Status
}
export const ChangeGroupsFetchStatus = (status: Status):ChangeGroupsFetchStatus => {
    return {
        type:CHANGE_GROUPS_FETCH_STATUS,
        status
    }
}


export const FetchGroups = (dataset_name:string, model_name: string, protect_attr: string)=>{
    return (dispatch:any) => {
        dispatch( ChangeGroupsFetchStatus(Status.PENDING) )
        const url = `/groups?dataset=${dataset_name}&model=${dataset_name}_${model_name}&protectAttr=${protect_attr}`
        axiosInstance.get(url)
        .then((response: AxiosResponse) => {
            if (response.status !=200) {
                throw Error(response.statusText);
            }else{
                let {key_attrs, key_groups} = response.data
                dispatch(FindGroups(key_attrs, key_groups))
            }
        }).then(()=>{
            dispatch( ChangeGroupsFetchStatus(Status.COMPLETE) )
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
    rules: DataItem[]
}

export const GenerateRules = (rules:DataItem[]):GenerateRules =>{
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
all about CHANGING rules
*****************/ 
export interface ChangeRuleThresholds{
    type:CHANGE_RULE_THRESHOLD,
    thr_rules:number[]
}

export const ChangeRuleThresholds = (thr_rules:number[]):ChangeRuleThresholds =>{
    return ({
        type: CHANGE_RULE_THRESHOLD,
        thr_rules
    });
}

export const ChangeRuleThr = (thr_rules:number[])=>{
    return (dispatch:any) => {
        return dispatch(ChangeRuleThresholds(thr_rules))
    };
}

/*****************
all about protected_attr
*****************/ 
export interface ChangeProtectedAttr{
    type:CHANGE_PROTECTED_ATTR,
    protected_attr:string
}

export const ChangeProtectedAttr = (protected_attr:string):ChangeProtectedAttr =>{
    return ({
        type: CHANGE_PROTECTED_ATTR,
        protected_attr
    });
}

export const ChangeProtectedAttribute = (protected_attr:string)=>{
    return (dispatch:any) => {
        return dispatch(ChangeProtectedAttr(protected_attr))
    };
}

/*****************
all about bars array
*****************/ 
export interface BarArray{
    type:BAR_ARRAY,
    drag_array:number[][]
}

export const BarArray = (drag_array:number[][]):BarArray =>{
    return ({
        type: BAR_ARRAY,
        drag_array
    });
}

export const ChangeBarArray = (drag_array:number[][])=>{
    return (dispatch:any) => {
        return dispatch(BarArray(drag_array))
    };
}



// combine to start

export const Start = (dataset_name:string, model_name: string, protect_attr: string)=>{
    return (dispatch: any)=>{
        dispatch(ChangeSamplesFetchStatus(Status.PENDING))
        dispatch(ChangeGroupsFetchStatus(Status.PENDING))
        dispatch(ChangeRulesFetchStatus(Status.PENDING))
        dispatch(FetchRules(dataset_name, model_name))
        dispatch(ChangeProtectedAttribute(protect_attr))
        FetchSamples(dataset_name, model_name)(dispatch)
        .then(
            () =>{ 
                dispatch (FetchGroups(dataset_name, model_name, protect_attr))}
        )
    }
}

export const Rule = (thr_rules: number[])=>{
    return (dispatch: any)=>{
        dispatch(ChangeRuleThr(thr_rules))
    }
}

export const Pos = (drag_array: number[][])=>{
    return (dispatch: any)=>{
        dispatch(ChangeBarArray(drag_array))
    }
}

/*****************
change key attrs
*****************/ 

export interface ChangeKeyAttr{
    type: CHANGE_KEY_ATTR,
    key_attrs: string[]
}
export const ChangeKeyAttr = (key_attrs: string[])=>{
    return {
        type: CHANGE_KEY_ATTR,
        key_attrs
    }
}

export type AllActions = FindGroups|GenerateSamples|GenerateRules|ChangeSamplesFetchStatus
|ChangeRulesFetchStatus|ChangeGroupsFetchStatus|ChangeRuleThresholds|ChangeProtectedAttr|BarArray|ChangeKeyAttr