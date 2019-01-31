from flask import request, jsonify, Blueprint, current_app, Response
from model import num2cate, generate_samples, generate_model_samples, ModelGene, findKeyAttrs, FindGroups, get_numAttrs, find_rules
import pandas as pd
from model.samples import DataGene
from model.data_encoder import DataEncoder
from joblib import dump, load

import json
import os

api = Blueprint('api', __name__)
cache_path = './cache'

######################
# API Starts here
######################
@api.route('/dataset/<string:dataset_name>', methods=['GET'])
def get_dataset(dataset_name):
    """Fetch dataset by id"""
    dataset_path = '../data/{}_clean.csv'.format(dataset_name)
    df = pd.read_csv(dataset_path, 'r', delimiter=',')
    return df.to_json()

@api.route('/generate_num/<string:dataset_name>', methods=['GET'])
def get_numData(dataset_name):
    """Fetch dataset by id"""
    dataset_path = '../data/{}.csv'.format(dataset_name)
    data = pd.read_csv(dataset_path)
    data = data.dropna(how='any')
    dataGene = DataGene(data, sample_num=3000)
    new_samples = dataGene.get_samples()
    #new_samples.to_json('../data/file.json', orient='records', lines=True)
    ''' 
    samples_path = os.path.join(cache_path, '{}_samples.csv'.format(dataset_name, model_name))
    new_samples.to_csv(samples_path, index=False)
    new_samples.to_json('./new.json', orient='records')
    '''
    return new_samples.to_json()


@api.route('/samples', methods=['GET'])
def get_samples():
    """
    train model on the training data,
    return the generated samples based on the training data
    E.g.: /api/samples?dataset=credit&model=knn&num=3000
    """
    dataset_name = request.args.get('dataset', None, type=str)
    model_name = request.args.get('model', None, type=str)
    model_name = '{}_{}'.format(dataset_name, model_name)
    sample_num = request.args.get('num', None, type=int)
    dataset_path = '../data/{}_clean.csv'.format(dataset_name)

    data = pd.read_csv(dataset_path)
    model_gene = ModelGene(model_name)
    model, encoder, score = model_gene.fit_model(data)
    model_samples, _ = generate_model_samples(data, sample_num, model, encoder)
    # add the ID col as the first col
    model_samples.insert(loc=0, column='id', value=model_samples.index)

    # save mdodl & samples to cache
    samples_path = os.path.join(cache_path, '{}_samples.csv'.format(model_name))
    model_samples.to_csv(samples_path, index=False)
    model_samples.to_json('../../front/src/testdata/test.json', orient='records')
    model_path = os.path.join(cache_path, '{}.joblib'.format(model_name))
    dump(model, model_path) 
    jsonfile = model_samples.to_json(orient='records')
    
    
    return jsonfile

@api.route('/pd_rules', methods=['GET'])
def get_rules():
    """
    Fetch the potentially discriminatory rules of a classifier.
    E.g.: /api/pd_rules?dataset=academic&model=xgb&protect=gender
    """
    dataset_name = request.args.get('dataset', None, type=str)
    protect_attr = request.args.get('protect', None, type=str)
    model_name = request.args.get('model', None, type=str)
    if model_name:
        model_name = '{}_{}'.format(dataset_name, model_name)
        sample_path = os.path.join(cache_path, '{}_samples.csv'.format(model_name))
    else:
        sample_path = '../data/{}_clean.csv'.format(dataset_name)
    model_samples = pd.read_csv(sample_path)
    rules = find_rules(model_samples, minimum_support=15, min_len=1, protect_attr='gender=F', target_attr='class', elift_th=[1, 1])

    # return rules.to_json(orient='records')
    return Response(rules.to_csv(), mimetype="text/csv",)


@api.route('/groups', methods=['GET'])
def get_groups():
    """
    Fetch the info of classifiers.
    E.g.: /api/groups?dataset=credit&model=knn&protect=age
    """

    dataset_name = request.args.get('dataset', None, type=str)
    model_name = request.args.get('model', None, type=str)
    model_name = '{}_{}'.format(dataset_name, model_name)
    protect_attr = request.args.get('protect', None, type=str)
    # get traiing data
    dataset_path = '../data/{}.csv'.format(dataset_name)
    data = pd.read_csv(dataset_path)
    data = num2cate(data)

    # get model samples
    sample_path = os.path.join(cache_path, '{}_samples.csv'.format(model_name))
    model_samples = pd.read_csv(sample_path)

    
    key_attrs = findKeyAttrs(data, protect_attr)

    key_vals = {}
    key_groups = []
    for key_attr in key_attrs:
        #if(type(model_samples[key_attr][0])!=type(model_samples['id'][0])):
        key_vals[key_attr] = list(set(data[key_attr]))
    
    findGroups = FindGroups(key_vals)
    key_groups = findGroups.locate_items(model_samples, protect_attr)
    
    for i, group in enumerate(key_groups):
        key_groups[i]['items'] = list(map(int, key_groups[i]['items']))

    return_value = {
        'key_attrs': key_attrs,
        'key_groups': key_groups
    }

    f = open('../../front/src/testdata/test2.json','w')
    json.dump(return_value, f)
   
    return jsonify(return_value)





@api.route('/key_attrs/<string:dataset_name>', methods=['GET'])
def get_key_attrs(dataset_name):
    """
    Fetch the key attributes of a dataset (training data).
    E.g.: /api/key_attrs/credit
    """
    protect_attr = ''
    dataset_path = '../data/{}.csv'.format(dataset_name)
    data = pd.read_csv(dataset_path)
    key_attrs = findKeyAttrs(data, protect_attr)


    return json.dumps({
        'key_attrs':key_attrs
        })