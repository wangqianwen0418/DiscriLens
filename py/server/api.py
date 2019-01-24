from flask import request, jsonify, Blueprint, current_app, Response
from model import generate_samples, generate_model_samples, ModelGene, findKeyAttrs, FindGroups
import pandas as pd
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



@api.route('/samples', methods=['GET'])
def get_samples():
    """
    train model on the training data,
    return the generated samples based on the training data
    E.g.: /api/samples?dataset=credit&model=knn
    """
    dataset_name = request.args.get('dataset', None, type=str)
    model_name = request.args.get('model', None, type=str)
    dataset_path = '../data/{}_clean.csv'.format(dataset_name)

    sample_num = 3000
    data = pd.read_csv(dataset_path)
    # samples = generate_samples(data, sample_num)

    model_gene = ModelGene(model_name)
    model, encoder, score = model_gene.fit_model(data)
    model_samples = generate_model_samples(data, sample_num, model, encoder)
    # add the ID col
    # model_samples['id'] = model_samples.index
    model_samples.insert(loc=0, column='id', value=model_samples.index)
    # print('model score', score)

    # save mdodl & samples to cache
    samples_path = os.path.join(cache_path, '{}_{}_samples.csv'.format(dataset_name, model_name))
    model_samples.to_csv(samples_path, index=False)
    model_samples.to_json('../../front/src/testdata/test.json', orient='records')
    model_path = os.path.join(cache_path, '{}_{}.joblib'.format(dataset_name, model_name))
    dump(model, model_path) 
    jsonfile = model_samples.to_json(orient='records')
    
    
    return jsonfile


@api.route('/groups', methods=['GET'])
def get_groups():
    """
    Fetch the info of classifiers.
    E.g.: /api/groups?dataset=credit&model=knn&protect=age
    """

    dataset_name = request.args.get('dataset', None, type=str)
    model_name = request.args.get('model', None, type=str)
    protect_attr = request.args.get('protect', None, type=str)

    # get training data
    dataset_path = '../data/{}_clean.csv'.format(dataset_name)
    data = pd.read_csv(dataset_path)

    # get model samples
    sample_path = os.path.join(cache_path, '{}_{}_samples.csv'.format(dataset_name, model_name))
    model_samples = pd.read_csv(sample_path)

    
    key_attrs = findKeyAttrs(data, protect_attr)

    key_vals = {}
    for key_attr in key_attrs:
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
    dataset_path = '../data/{}_clean.csv'.format(dataset_name)
    data = pd.read_csv(dataset_path)
    key_attrs = findKeyAttrs(data, protect_attr)


    return json.dumps({
        'key_attrs':key_attrs
        })