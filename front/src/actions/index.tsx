import {GENERATE_SAMPLES, FIND_GROUPS, CHANGE_SAMPLES_FETCH_STATUS, CHANGE_GROUPS_FETCH_STATUS} from 'Const';
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
    num_attrs: string[]
}
export const FindGroups = (key_attrs: string[], key_groups: KeyGroup[], num_attrs: string[]):FindGroups => {
    return {
        type:FIND_GROUPS,
        key_attrs, 
        key_groups,
        num_attrs
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


export const FetchGroups = (dataset_name:string, model_name: string)=>{
    return (dispatch:any) => {
        dispatch( ChangeGroupsFetchStatus(Status.PENDING) )
        const url = `/groups?dataset=${dataset_name}&model=${model_name}&protectAttr=sex`
        axiosInstance.get(url)
        .then((response: AxiosResponse) => {
            if (response.status !=200) {
                throw Error(response.statusText);
            }else{
                let {key_attrs, key_groups, num_attrs} = response.data
                dispatch(FindGroups(key_attrs, key_groups, num_attrs))
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
    samples: DataItem[]
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
        const url = `/samples?dataset=${dataset_name}&model=${model_name}`
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


// combine to start

export const Start = (dataset_name:string, model_name: string)=>{
    return (dispatch: any)=>{
        dispatch(ChangeSamplesFetchStatus(Status.PENDING))
        dispatch(ChangeGroupsFetchStatus(Status.PENDING))
        FetchSamples(dataset_name, model_name)(dispatch)
        .then(
            () =>{ dispatch (FetchGroups(dataset_name, model_name))}
        )
    }
}

export type AllActions = FindGroups|GenerateSamples|ChangeSamplesFetchStatus|ChangeGroupsFetchStatus