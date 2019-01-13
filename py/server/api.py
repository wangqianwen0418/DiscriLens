from flask import request, jsonify, Blueprint, current_app, Response
from model import generate_samples, generate_model_samples, ModelGene, findKeyAttrs
import pandas as pd

api = Blueprint('api', __name__)

######################
# API Starts here
######################


@api.route('/dataset/<string:dataset_name>', methods=['GET'])
def get_dataset(dataset_name):
    """Fetch dataset by id"""
    dataset_path = '../data/{}_clean.csv'.format(dataset_name)
    csvfile = open(dataset_path, 'r')
    return Response(csvfile, mimetype='text/csv')

@api.route('/samples', methods=['GET'])
def get_samples():
    """
    Fetch the info of classifiers.
    E.g.: /api/samples?dataset=credit&model=knn
    """
    dataset_name = request.args.get('dataset', None, type=str)
    model_name = request.args.get('model', None, type=str)
    dataset_path = '../data/{}_clean.csv'.format(dataset_name)

    data = pd.read_csv(dataset_path)
    samples = generate_samples(data, 3000)

    model_gene = ModelGene(model_name)
    model, encoder, score = model_gene.fit_model(data)
    print('model score', score)
    model_samples = generate_model_samples(data, 10, model, encoder)
    print(model_samples[:1],len(model_samples))

    protect_attr = 'sex'
    key_attrs = findKeyAttrs(model_samples, protect_attr)
    return ', '.join(key_attrs)
    # return Response( model_samples.to_csv(header=True, index=True), mimetype='text/csv')


