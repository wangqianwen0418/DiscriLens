export interface DataItem{
    [key:string]: number|string
}

export interface Rule{
    id: string,
    antecedent:  string[],
    cls: string,
    conf_pd: number,
    conf_pnd: number,
    elift : number,
    pd : string,
    sup_pd : number,
    sup_pnd : number,
    risk_dif : number,
    items: (string)[],
    [key:string]:any
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
    // key_attrs: string[], // record key attrs
    dataset: string,
    model: string,
    keyAttrNum: number,
    samples: DataItem[],    // record all samples 
    compSamples: DataItem[], // record all samples of compared model
    allRules: Rule[], // all rules
    compAllRules: Rule[], // all rules of compared model
    rules: Rule[],  // filtered rules
    compRules: Rule[], // filtered rules of compared model
    // key_groups: KeyGroup[], // record all data of key attrs
    fetchSampleStatus: Status,   // loading status
    fetchKeyStatus: Status,    // loadinf status
    ruleThreshold: [number, number],    // slider bar interaction, select threshold of rule filtering
    protectedAttr: string, // record protected attr
    protectedVal: string,
    // show_attrs: string[], // record all the attrs that are shown
    showAttrNum: number,
    dragArray: string[],   // array to record each attr's location, used for dragging function
    showDataset: string, // the dataset that the user is exploring, others will be hidden
    xScaleMax: number, // used to zoom axis when selection is expanded to keep all axis consistent
    selected_bar: string[], // used to transfer the info of hoverd rect
    foldFlag: boolean, // whether the model selection panle is folded, true is folded and false is expanded
    accuracy: number[], // used to transfer models' accuracy to display
}