export interface DataItem{
    [key:string]: number|string
}

export interface Rule{
    antecedent:  string[],
    cls: string,
    conf_pd: number,
    conf_pnd: number,
    elift : number,
    pd : string,
    sup_pd : number,
    sup_pnd : number,
    risk_dif : number
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
    rules: Rule[],  // record all rules
    key_groups: KeyGroup[], // record all data of key attrs
    fetch_samples_status: Status,   // loading status
    fetch_groups_status: Status,    // loadinf status
    thr_rules: [number, number],    // slider bar interaction, select threshold of rule filtering
    protected_attr: string, // record protected attr
    show_attrs: string[], // record all the attrs that are shown
    drag_array: string[],   // array to record each attr's location, used for dragging function
    drag_status: boolean, // when a dragging happens, this falg is set to true, then reset to false after function receives the movement
}
