from model import find_rules
import os
import pandas as pd
cache_path = './front/src/testdata/'

def get_rules(dataset_name, protect_attr='',model_name=None):
    """
    """
    if model_name:
        model_name = '{}_{}'.format(dataset_name, model_name)
        sample_path = os.path.join(cache_path, '{}_samplesR.csv'.format(model_name))
    else:
        model_name = dataset_name
        sample_path = './py/data/{}_clean.csv'.format(dataset_name)
    model_samples = pd.read_csv(sample_path)
    rules = find_rules(model_samples, minimum_support=5, min_len=1, protect_attr = protect_attr, target_attr='class', elift_th=[1, 1])

    
    rules.to_json(cache_path + '{}_rules.json'.format(model_name),orient='records')

get_rules('adult','sex= Female', 'knn')
get_rules('adult','sex= Fema le', 'lr')
get_rules('adult','sex= Female', 'xgb') 
'''
get_rules('give_credit','age=0<x<25','knn')
get_rules('give_credit','age=0<x<25','xgb')
get_rules('give_credit','age=0<x<25')
'''
# get_rules('bank','marital=divorced','knn') 
get_rules('bank','marital=divorced','xgb')
get_rules('bank','marital=divorced','lr')
# os.system('shutdown -s')

models = ['xgb','knn','lr']
dataSets = ['bank','adult']

print('start')
for dataSet in dataSets:
    for model in models:
        sample_name = cache_path  +  dataSet + '_' + model + '_samples.json'
        rule_name = cache_path + dataSet + '_' + model + '_rules.json'
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
            rules.at[idx, 'items'] = [sample['id'] for i,sample in samples.loc[1000:1999].iterrows() if item_within_rule(sample, rule["antecedent"])] 
        rules.to_json(rule_name, orient='records')

        print(dataSet+'_'+model+' has done')

print('All finished')