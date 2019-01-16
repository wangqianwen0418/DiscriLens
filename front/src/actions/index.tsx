import {GENERATE_SAMPLES, FIND_GROUPS, CHANGE_SAMPLES_FETCH_STATUS, CHANGE_GROUPS_FETCH_STATUS} from 'Const';
import axios, { AxiosResponse } from 'axios';
import {DataItem, KeyGroup, Status} from 'types';

const axiosInstance = axios.create({
    baseURL: `http://localhost:7777/api/`,
    // timeout: 1000,
    headers: {
        'Access-Control-Allow-Origin': '*'
    }
});

/*****************
all about groups
*****************/ 
export interface FindGroups{
    type:FIND_GROUPS,
    key_attrs: string[],
    key_groups: KeyGroup[]
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


export const FetchGroups = (dataset_name:string, model_name: string)=>{
    return (dispatch:any) => {
        ChangeGroupsFetchStatus(Status.PENDING)
        const url = `/groups?dataset=${dataset_name}&model=${model_name}`
        axiosInstance.get(url)
        .then((response: AxiosResponse) => {
            if (response.status !=200) {
                throw Error(response.statusText);
            }else{
                let {key_attrs, key_groups} = response.data
                dispatch(FindGroups(key_attrs, key_groups))
            }
        }).then(()=>{
            ChangeGroupsFetchStatus(Status.COMPLETE)
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
    return {
        type:GENERATE_SAMPLES,
        samples
    }
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
        const url = `/samples?dataset=${dataset_name}&model=${model_name}`
        axiosInstance
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

export type AllActions = FindGroups|GenerateSamples|ChangeSamplesFetchStatus|ChangeGroupsFetchStatus