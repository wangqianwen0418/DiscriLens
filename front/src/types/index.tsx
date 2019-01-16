export interface DataItem{
    [key:string]: any
}

export interface KeyGroup{
    [key:string]: any
}

export enum Status {
    COMPLETE = 'complete',
    PENDING = 'pending',
    INACTIVE = 'inactive'
}

export interface StoreState{
    key_attrs: string[],
    samples: DataItem[],
    key_groups: KeyGroup[],
    fetch_samples_status: Status,
    fetch_groups_status: Status
}