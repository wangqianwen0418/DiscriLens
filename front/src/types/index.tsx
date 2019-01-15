export interface DataItem{
    [key:string]: any
}

export interface KeyGroup{
    [key:string]: any
}

export interface StoreState{
    key_attrs: string[],
    samples: DataItem[],
    key_groups: KeyGroup[]
}