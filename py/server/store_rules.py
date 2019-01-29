from model import find_rules
import os
import pandas as pd
cache_path = './cache'

def get_rules(dataset_name, model_name=None):
    """
    """
    if model_name:
        model_name = '{}_{}'.format(dataset_name, model_name)
        sample_path = os.path.join(cache_path, '{}_samples.csv'.format(model_name))
    else:
        model_name = dataset_name
        sample_path = '../data/{}_clean.csv'.format(dataset_name)
    model_samples = pd.read_csv(sample_path)
    rules = find_rules(model_samples, minimum_support=5, min_len=1, protect_attr='gender=F', target_attr='class', elift_th=[1, 1])

    
    rules.to_csv('./cache/{}_rules.csv'.format(model_name))

get_rules('credit', 'knn')
get_rules('credit')
get_rules('academic', 'xgb')
get_rules('academic')
