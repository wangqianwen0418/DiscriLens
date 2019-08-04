#%%

import sys
sys.path.append("model")

import os
import pandas as pd
import json
import numpy as np

from model import num2cate_fit, num2cate_transform, generate_samples, generate_model_samples, ModelGene, findKeyAttrs, FindGroups, get_numAttrs, find_rules
from model.samples import DataGene
from model.data_encoder import DataEncoder
from joblib import dump, load

from sklearn.model_selection import KFold
from sklearn.metrics import accuracy_score
import dill
import pickle
import warnings
warnings.filterwarnings('ignore')

from itertools import chain

#%%

current_path = os.path.dirname(os.path.realpath(__file__))
store_path = os.path.join(current_path, '../../front/src/asset/')



    

def get_model_predictions(dataset_name='adult', models=['xgb'], protect_attr='', find_key=False):
    """
    train model on the training data,
    return the predictions on the testing data
    """
    data_path = '../data/{}/'.format(dataset_name)
    data_path = os.path.join(current_path, data_path)
    mdlp_path = os.path.join(data_path, '{}_mdlp.pkl'.format(dataset_name))
    train_data_path = os.path.join( data_path, '{}.data.csv'.format(dataset_name, dataset_name) )
    test_data_path = os.path.join( data_path,'{}.test.csv'.format(dataset_name, dataset_name) )

    train_data = pd.read_csv(train_data_path)
    test_data = pd.read_csv(test_data_path)
    
    mdlp = num2cate_fit(train_data, 2)

    if find_key:
        # find key_attrs
        key_attrs = findKeyAttrs(num2cate_transform(data, mdlp))
        f = open(store_path + '{}_key.json'.format(dataset_name),'w')
        json.dump(key_attrs, f)

    #  save mdlp
    f=open(mdlp_path, 'wb')
    dill.dump(mdlp, f, -1)

    for model_name in models:
        
        # set name
        data_model = dataset_name+"_"+model_name
        model_gene = ModelGene(data_model)
    
        # train model
        model, encoder, score = model_gene.fit_model( num2cate_transform(train_data, mdlp) )
        model_path = os.path.join(current_path, './cache/models/model_{}_{}.pkl'.format(model_name, dataset_name))
        f = open(model_path, 'wb')    
        pickle.dump(model, f) 

        #########################################
        # save model prediction on training data 

        train_ = train_data.drop(train_data.columns[-1], axis=1)
        num_samples, cate_samples = generate_model_samples(train_, mdlp, model, encoder) 
        
        # add the ID col 
        cate_samples.insert(loc=0, column='id', value= cate_samples.index)
        num_samples.insert(loc=0, column='id', value= num_samples.index)
        
        # save mdeol & samples to cache
        dataOut = pd.concat([num_samples,cate_samples])
        
        samples_path = os.path.join(store_path, '{}_samples.json'.format(data_model))
        dataOut.to_json(samples_path, orient='records')
        # dataOut.to_csv(samples_path, index=False)
        
        ###################################
        # save model prediction on test data
        test_ = test_data.drop(test_data.columns[-1], axis=1)
        num_samples, cate_samples = generate_model_samples(test_, mdlp, model, encoder) 
        
        # add the ID col 
        cate_samples.insert(loc=0, column='id', value= cate_samples.index)
        num_samples.insert(loc=0, column='id', value= num_samples.index)
        
        # save mdeol & samples to cache
        dataOut = pd.concat([num_samples,cate_samples])
        
        samples_path = os.path.join(store_path, '{}_test_samples.json'.format(data_model))
        dataOut.to_json(samples_path, orient='records')
        # dataOut.to_csv(samples_path, index=False)

        test_score = accuracy_score(test_data['class'].values, num_samples['class'].values)
        
        print(dataset_name + ' ' + model_name + 'across validate accuracy: ' + str(score))
        print(dataset_name + ' ' + model_name + 'test accuracy: ' + str(test_score))
        
    print(dataset_name + 'model training and test, all done')
    
def get_rules(dataset_name, protect_attr='',model_name=None, min_support = 5):
    
    model_name = '{}_{}'.format(dataset_name, model_name)
    sample_path = os.path.join(store_path, '{}_samples.json'.format(model_name))
    model_samples = pd.read_json(sample_path)
    model_samples = model_samples.iloc[int(len(model_samples)/2):]
    rules = find_rules(model_samples, minimum_support=min_support, min_len=1, protect_attr = protect_attr, target_attr='class', elift_th=[1, 1])

    
    rules.to_json(store_path + '{}_rules.json'.format(model_name),orient='records')

def get_all_rules(protect, models=['xgb','knn','lr'], dataset='adult'):
    
    for model in models:
        get_rules(dataset, protect, model)
        get_rules(dataset, protect, model)
        get_rules(dataset, protect, model)
    for model in models:
        sample_name = os.path.join(store_path, dataset + '_' + model + '_samples.json')
        rule_name = os.path.join(store_path, dataset + '_' + model + '_rules.json')
        samples = pd.read_json(sample_name)

        # add item id to rules
        def item_within_rule(item, rule_context):
            for attr_val in rule_context:
                attr, val = attr_val.split('=')
                if not item[attr] == val :
                    return False
            return True

        rules = pd.read_json(rule_name)
        rules['items'] = ''
        for idx, rule in rules.iterrows():
            rules.at[idx, 'items'] = [sample['id'] for i,sample in samples.iloc[int(len(samples)/2):].iterrows() if item_within_rule(sample, rule["antecedent"])] 
        rules.to_json(rule_name, orient='records')

        print(dataset+'_'+model+' has done')

    print('All finished')


#%%
models =['svm']
dataset = 'adult'
get_model_predictions(dataset, models)
# get_all_rules('sex=Female', models, dataset)


#%%
