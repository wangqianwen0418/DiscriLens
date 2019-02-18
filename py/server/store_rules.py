from model import find_rules
import os
import pandas as pd
cache_path = './py/server/cache/new_data_diff_models'

def get_rules(dataset_name, protect_attr='',model_name=None):
    """
    """
    if model_name:
        model_name = '{}_{}'.format(dataset_name, model_name)
        sample_path = os.path.join(cache_path, '{}_samples.csv'.format(model_name))
    else:
        model_name = dataset_name
        sample_path = './py/data/{}_clean.csv'.format(dataset_name)
    model_samples = pd.read_csv(sample_path)
    rules = find_rules(model_samples, minimum_support=5, min_len=1, protect_attr = protect_attr, target_attr='class', elift_th=[1, 1])

    
    rules.to_json('./py/server/cache/new_data_diff_models/rules/{}_rules.json'.format(model_name),orient='records')

# get_rules('dataTest','sex= Female', 'knn')
get_rules('dataTest','sex= Fema le', 'lr')
# get_rules('dataTest','sex= Female', 'xgb') 
'''
get_rules('give_credit','age=0<x<25','knn')
get_rules('give_credit','age=0<x<25','xgb')
get_rules('give_credit','age=0<x<25')
'''
""" get_rules('bank','marital=divorced','knn') 
get_rules('bank','marital=divorced','xgb')
get_rules('bank','marital=divorced','lr')
os.system('shutdown -s') """