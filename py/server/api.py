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
    #model_name = request.args.get('model', None, type=str)
    
    sample_num = 1000 # number of generated data 
    dataset_path = '../data/{}.csv'.format(dataset_name)
    data = pd.read_csv(dataset_path)
    # generate samples
    samplesInit = generate_samples(data, sample_num)

    model=['knn','xgb','lr']

    scoreOut = []

    for var in model:
        model_name = dataset_name+"_"+var
        model_gene = ModelGene(model_name)
        model, encoder, score = model_gene.fit_model(num2cate(data))
        scoreOut.append([model_name,score])
        model_samples, storeData = generate_model_samples(samplesInit, model, encoder) 
        # here model_samples are non-catogorized data for output while storeData is categorized data for storing
        
        # add the ID col 
        storeData.insert(loc=0, column='id', value=storeData.index)
        model_samples.insert(loc=0, column='id', value= model_samples.index)
        # save mdeol & samples to cache
        dataOut = pd.concat([model_samples,storeData])

        samples_path = os.path.join(cache_path, '{}_samples.json'.format(model_name))
        storeData.to_json(samples_path, orient='records')

        samples_path = os.path.join(cache_path, '{}_samples.csv'.format(model_name))
        storeData.to_csv(samples_path, index=False)

        samples_path = os.path.join(cache_path, '{}_samples_concat.json'.format(model_name))
        dataOut.to_json(samples_path, orient='records')

        samples_path = os.path.join(cache_path, '{}_samples_concat.csv'.format(model_name))
        dataOut.to_csv(samples_path, index=False)
        
        model_path = os.path.join(cache_path, '{}.joblib'.format(model_name))
        dump(model, model_path) 
        model_samples.to_json('../../{}_samples.csv'.format(model_name) , orient='records')


    jsonfile = model_samples.to_json(orient='records')
    
    return pd.DataFrame(scoreOut).to_json()
    
    # dataset_path = './cache/test/dataTest_knn_samples.csv'
    # data1 = pd.read_csv(dataset_path)
    
    # dataset_path = './cache/test/dataTest_knn_samples1.csv'
    # data2 = pd.read_csv(dataset_path)

    # dataout = pd.concat([data2,data1])

    # return dataout.to_json(orient='records')
    

@api.route('/pd_rules', methods=['GET'])
def get_rules():
    """
    Fetch the potentially discriminatory rules of a classifier.
    E.g.: /api/pd_rules?dataset=academic&model=xgb&protect=gender
    """
    dataset_name = request.args.get('dataset', None, type=str)
    protect_attr = request.args.get('protect', None, type=str)
    model_name = request.args.get('model', None, type=str)
    model_name = '{}_{}'.format(dataset_name, model_name)

    sample_path = os.path.join(cache_path, '{}_samples.csv'.format(model_name))
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
    protect_attr = request.args.get('protectAttr', None, type=str)
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

    f = open('../../front/src/testdata/{}_key.json'.format(model_name),'w')
    json.dump(return_value, f)
   
    return jsonify(return_value)

@api.route('/rules',methods=['GET'])
def get_rules_exist():
    dataset_name = request.args.get('dataset', None, type=str)
    
    dataset_path = './cache/rules/{}_rules.csv'.format(dataset_name)
    data = pd.read_csv(dataset_path)
    return data.to_json(orient='records')



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