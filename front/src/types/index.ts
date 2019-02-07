export interface DataItem{
    [key:string]: number|string
}

export interface KeyGroup{
    [key:string]: any
}

export interface NumAttr{
    [key:string]: number
}

export enum Status {
    COMPLETE = 'complete',
    PENDING = 'pending',
    INACTIVE = 'inactive'
}

export interface StoreState{
    key_attrs: string[],
    samples: DataItem[],
    rules: DataItem[],
    key_groups: KeyGroup[],
    fetch_samples_status: Status,
    fetch_groups_status: Status,
    thr_rules: number[],
    protected_attr: string
}
