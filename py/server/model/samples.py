import pandas as pd
import numpy as np



import random
import re
import copy

from model.data_encoder import DataEncoder
from model.helpers import find_range_cols
from model.data_encoder import num2cate



# Data generator
class DataGene(object):   
    def __init__(self, data, sample_num=3000, class_col='class'):
        """
        Args:
            data(pandas DataFrame): origin training data
            sample_num(int):       
        """
        self.data = data
        self.sample_num = sample_num
        self.class_col = 'class'

    def get_samples(self):
        """
        Return:
            samples(pandas DataFrame)
        """
        features = self.data.drop([self.class_col], axis=1)
        range_cols = find_range_cols(self.data)
        cat_cols = features.select_dtypes(exclude=['int64']).drop(range_cols, axis=1).columns
        num_cols = features.select_dtypes(include=['int64']).columns
        
        samples = []
        
        for i in range(self.sample_num):
            sample_cat = [
                random.choice( list(set(features[cat_name])) )
                for cat_name in cat_cols
            ]
            sample_num = [
                random.choice( list(set(features[num_name])) )
                for num_name in num_cols
            ]
            sample_range = [
                random.choice( list(set(features[range_name])) )
                for range_name in range_cols
            ]
            sample = sample_cat + sample_num + sample_range
            samples.append(sample)
            
        
        samples = pd.DataFrame(samples, columns=list(cat_cols)+list(num_cols)+range_cols)
        return samples 

def generate_samples(data, sample_num):
    """
    generate new samples (no label) based on training data 
    Args:
        data(pandas DataFrame): training data
        sample_num(int): 
    Return:
        samples(pandas DataFrame): generated samples (no label)
    """
    dataGene = DataGene(data, sample_num)
    new_samples = dataGene.get_samples()
    return new_samples

def get_numAttrs(data):
    dataGene = DataGene(data)
    features = dataGene.data.drop([dataGene.class_col], axis=1)
    num_cols = features.select_dtypes(include=['int64']).columns
    output = 'ert'
    #for var in num_cols:
        #output.append(var)
    return output

def generate_model_samples(samplesInit, model, encoder):
    """
    models behavior on generated sample data:
    Args:
        data(pandas DataFrame): training data
        sample_num(int): 
        model(sklearn model object): already trained model
        encoder(instance of DataGene): instance of DataGene, already fit 
    Return:
        model_samples(pandas DataFrame): generated samples(not-categorized) for front-end
        storeData(pandas DataFrame): generated samples(categorized) for storing (saving as file)
    """
    #samplesInit = generate_samples(data, sample_num)
    samples = num2cate(samplesInit)
    # model predict
    x_samples, _ = encoder.transform(samples)
    y_samples = model.predict(x_samples)
    # decode the prediction
    #y_samples = encoder.label_encoder.inverse_transform(y_samples)
    
    #  concate 
    model_samples = samplesInit.copy()
    model_samples['class'] = pd.Series(np.asarray(y_samples), index= samples.index) 

    storeData = samples.copy()
    storeData['class'] = pd.Series(np.asarray(y_samples), index= samples.index) 
    return model_samples, storeData
    # return pd.concat([model_samples,storeData]), storeData

def findKeyAttrs(samples, protect_attr, result_attr = 'class'):
    """
    Args:
        samples(pandas DataFrame): 
        protect_attr(string || Array<string>): 
    Return:
        key_attrs(list<string>): a list of key attributes that directly influence the decision
    """
    from pycausal.pycausal import pycausal as pc
    pc = pc()
    pc.start_vm()
    from pycausal import search as s
    # pc import must keep the above order
   
    # choose a causal mining algorithm
    causal = 'fges'
    if causal == 'bayes':
        ### use bayes Est to find the key attributes
        ### somewhat slow, extract more key attributes 
        graph = s.bayesEst(samples, depth = 0, alpha = 0.05, verbose = True)
    else:
        ## OR use Fast Greedy Equivalence Search
        ## faster than bayes, get less key attributes
        graph = s.tetradrunner()
        graph.getAlgorithmParameters(algoId = 'fges', scoreId = 'bdeu')
        graph.run(algoId = 'fges', dfs = samples, scoreId = 'bdeu', priorKnowledge = None, dataType = 'discrete',
               structurePrior = 0.5, samplePrior = 0.5, maxDegree = 5, faithfulnessAssumed = True, verbose = False)
        
    # graph.getNodes()
    key_attrs = []
    print('edges', graph.getEdges())
    for edge in graph.getEdges():
        if 'class' in edge:
            # extract attr name from the edge
            # remove --> or --o or --- and white space
            attr = re.sub(r'-+>?o?|{}|\s+'.format(result_attr), '', edge)
            key_attrs.append(attr)
            
            
    # remove protect attrs        
    if type(protect_attr) is not str: 
        # if protect attr is a list
        for a in protect_attr:
            if a in key_attrs:
                key_attrs.remove(a)
    elif protect_attr in key_attrs:
        # if protect attr is a string
        key_attrs.remove(protect_attr)
    print('key attributes', key_attrs)
    return key_attrs

#######################
# ?? this can be moved to the front end, no need ot calculate here
########################
class FindGroups(object):   
    def __init__(self, key_vals):
        '''
        Args: 
            key_vals(dict): e.g., {'atrribute_a':['a', 'b', 'c'], 'attribute_b': ['m', 'n', 'k']}
            depth(int): recursive depth
            index(dict): the choosen value of each key attribute. e.g.,  {'atrribute_a':'a', 'attribute_b': 'k'}
            key_groups: a list of index
        '''
        self.key_vals = key_vals
        self.key_attrs = [k for k in key_vals]
        self.key_groups = []
        self.generate_groups( 0, {} )
        
        

    def generate_groups(self,  depth, index):
        '''
        a recursive function to find the attribute constraints of the key groups
            e.g., 
            [
                {'atrribute_a':'a', 'attribute_b': 'm'},
                {'atrribute_a':'a', 'attribute_b': 'n'},
                {'atrribute_a':'b', 'attribute_b': 'm'},
                {'atrribute_a':'b', 'attribute_b': 'n'}
            ]
        Args: 
            key_vals(dict): e.g., {'atrribute_a':['a', 'b', 'c'], 'attribute_b': ['m', 'n', 'k']}
            depth(int): recursive depth
            index(dict): the choosen value of each key attribute. e.g.,  {'atrribute_a':'a', 'attribute_b': 'k'}
            key_groups: a list of index
        '''

        for k in self.key_vals[ self.key_attrs[depth] ]:
            index_ = copy.deepcopy(index)
            index_[self.key_attrs[depth]] = k
            if depth < len(self.key_attrs)-1: 
                depth_ = depth+1 
                self.generate_groups(depth_, index_)
            else:
                self.key_groups.append(index_)

    def locate_items(self, model_samples, protect_attr):
        protect_vals = list(set(model_samples[protect_attr]))

        for i, group in enumerate(self.key_groups):
            group_items = model_samples.copy()
            for attr in group:
                group_items = group_items.loc[group_items[attr]==group[attr]]
            # print(group, len(group_items))
            self.key_groups[i]['items'] = group_items.index.tolist()
            
            score = []
            if len(group_items)>0:
                for val in protect_vals:
                    # based on protected attribute
                    # self.key_groups[i]['items'][val] =  {}
                    group_items_ = group_items.loc[group_items[protect_attr] == val]
                    if len(group_items_)>0:
                        group_reject = group_items_.loc[group_items_['class'] == 0]
                        group_accept = group_items_.loc[group_items_['class'] == 1]
                        p_0 = len(group_reject)/len(group_items_)
                        p_1 = len(group_accept)/len(group_items_)
                        score.append(p_1)
                        # self.key_groups[i]['items'][val]['reject'] = group_reject.index.tolist()
                        # self.key_groups[i]['items'][val]['reject'] = group_reject.index.tolist()
                        # print(val, "{:.2f}".format(p_0), "{:.2f}".format(p_1), len(group_items_)) 
            if(score==[]):
                self.key_groups[i]['score'] =  0
            elif(len(score)==1):
                self.key_groups[i]['score'] =  abs(score[0])
            else:
                self.key_groups[i]['score'] =  abs(score[0]-score[1])
            self.key_groups[i]['scores'] =  score
        self.key_groups.sort(key=lambda x: x['score'] , reverse=True)
        return self.key_groups

