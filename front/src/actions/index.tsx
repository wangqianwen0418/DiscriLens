import {GENERATE_SAMPLES, FIND_GROUPS} from 'Const';
import axios, { AxiosResponse } from 'axios';

import {DataItem, KeyGroup} from 'types';
const axiosInstance = axios.create({
    baseURL: `http://localhost:7777/api/`,
    // timeout: 1000,
    headers: {
        'Access-Control-Allow-Origin': '*'
    }
});

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

export const FetchGroups = (dataset_name:string, model_name: string)=>{
    return (dispatch:any) => {
        const url = `/groups?dataset=${dataset_name}&model=${model_name}`
        axiosInstance.get(url)
        .then((response: AxiosResponse) => {
            if (response.status !=200) {
                throw Error(response.statusText);
            }else{
                let {key_attrs, key_groups} = response.data
                dispatch(FindGroups(key_attrs, key_groups))
            }
        })
    };
}

export const FetchSamples = (dataset_name:string, model_name: string)=>{
    return (dispatch:any) => {
        const url = `/samples?dataset=${dataset_name}&model=${model_name}`
        axiosInstance.get(url)
        .then((response: AxiosResponse) => {
            if (response.status !=200) {
                throw Error(response.statusText);
            }else{
                let samples = response.data
                dispatch(GenerateSamples(samples))
            }
        })
    };
}

export type AllActions = FindGroups|GenerateSamples