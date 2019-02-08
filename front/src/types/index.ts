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
    key_attrs: string[], // record key attrs
    samples: DataItem[],    // record all samples 
    rules: DataItem[],  // record all rules
    key_groups: KeyGroup[], // record all data of key attrs
    fetch_samples_status: Status,   // loading status
    fetch_groups_status: Status,    // loadinf status
    thr_rules: number[],    // slider bar interaction, select threshold of rule filtering
    protected_attr: string, // record protected attr
    g_endPos: number[][],   // <g> 's end position, record the position of each attr's corresponding bars
}
