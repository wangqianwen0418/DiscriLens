from sklearn.preprocessing import LabelEncoder, OneHotEncoder

from model.helpers import find_range_cols

import pandas as pd
import numpy as np
from mdlp.discretization import MDLP

import math
import re

def findRange(thresholds, v):
    for i, th in enumerate(thresholds):
        if(v <= th):
            if i==0:
                    return "x<{}".format(th)
            elif i == len(thresholds)-1:
                    return "x>{}".format(thresholds[i-1])
            else:
                    return "{}<x<{}".format(thresholds[i-1], thresholds[i])
                
def convert_cate(arr):
    n = 4 #parts to be divided
    maxValue = max(arr)
    minValue = min(arr)
    thresholds = [ math.floor(i*(maxValue-minValue)/n)+minValue for i in range(n+1)]

    #print([findRange(thresholds, i) for i in arr])
    
    return pd.Series([findRange(thresholds, i) for i in arr])


# def num2cate(dataIn):
#     df = dataIn[:]
# #     new_data = pd.DataFrame()
#     for k in df.columns:
#         if(k in df.select_dtypes(include=['int64','float64'])):
#             values = pd.to_numeric(df[k])
#             df[k] = convert_cate(values.tolist())
        
#     return df

def interval2string(inter):
    '''
    Arg:
        inter (tuple)
    Return:
        string; something like a<x<b
    '''
    if (inter[0]==-math.inf):
        return 'x<{}'.format(int(inter[1]))
    elif (inter[1]==math.inf):
        return 'x>{}'.format(int(inter[0]))
    else:
        return '{}<x<{}'.format(int(inter[0]), int(inter[1]))

def num2cate_fit(df, min=4):
    '''
    Arg
        df (Panda dataframes); the last col must be class, int 0 or 1
        min (int): The minimum depth of the interval splitting. Overrides
        the MDLP stopping criterion. If the entropy at a given interval
        is found to be zero before `min_depth`, the algorithm will stop.
    Return
        mdlp (MDLP instance): transform, can be used to transform samples
    '''
    Y = df.iloc[:, -1].values
    continuous_features =df.iloc[:, :-1].select_dtypes(include=['int64','float64']).columns.tolist()
    continuous_features.sort() # ensoure the features order between fit and transform
    X = df[continuous_features].values
    mdlp = MDLP(min_depth=min)
    mdlp.fit(X, Y) # X, Y should be numpy array

    return mdlp

def num2cate_transform(df, mdlp):
    '''
    Arg
        df (Panda dataframes): data
        mdlp (MDLP instance): already fit
    Return
        data (): discretised data using mdlp
    '''
    df = df.copy()
    if 'class' in df.columns:
        continuous_features =df.drop(['class'], axis=1).select_dtypes(include=['int64','float64']).columns.tolist()
    else:
        continuous_features =df.select_dtypes(include=['int64','float64']).columns.tolist()
    continuous_features.sort() # ensoure the features order between fit and transform
    X = df[continuous_features].values
    conv_X = mdlp.transform(X)

    for col_idx, col in enumerate( continuous_features ):
        df[col] = [interval2string(i) for i in mdlp.cat2intervals(conv_X, col_idx)]
    return df
    



class DataEncoder(object):
    def __init__(self, class_column='class', cat_columns=None):
        self.class_column = class_column
        self.cat_columns = cat_columns

        # these will be trained with fit_encoders()
        self.column_encoders = {} # label encoder
        self.cat_encoder = None # one-hot encoder
        self.label_encoder = None # label encoder

    def fit(self, data):
        """
        Fit one-hot encoders for categorical features and an integer encoder for
        the label. These can be used later to transform raw data into a form
        that ATM can work with.

        data: pd.DataFrame of unprocessed data
        """
        if self.class_column not in data.columns:
            raise KeyError('Class column "%s" not found in dataset!' %
                           self.class_column)
            
        range_col = find_range_cols(data)
                
        self.range_col = range_col
            

        # encode categorical columns, leave ordinal values alone
        if self.cat_columns is None:
            cats = data.drop([self.class_column]+range_col, axis=1).select_dtypes(exclude=['int64'])
            self.cat_columns = cats.columns
        else:
            cats = data[self.cat_columns].drop(range_col, axis=1).select_dtypes(exclude=['int64'])
            
        self.cat_cols = cats.columns
        
        for cat_name in cats.columns:   
        # save the indices of categorical columns for one-hot encoding

            # encode each feature as an integer in range(unique_vals)
            le = LabelEncoder()
            cats[cat_name] = le.fit_transform(cats[cat_name])
            self.column_encoders[cat_name] = le

        # One-hot encode the whole feature matrix.
        # Set sparse to False so that we can test for NaNs in the output
        self.cat_encoder = OneHotEncoder(n_values='auto',sparse=False)
        # if Category column exists          
        if cats.shape[1] != 0:
            self.cat_encoder.fit(cats)

        # Train an encoder for the label as well
        labels = np.array(data[[self.class_column]])
        self.label_encoder = LabelEncoder()
        self.label_encoder.fit(labels)
        

    def transform(self, data):
        """
        Convert a DataFrame of labeled data to a feature matrix in the form
        that ATM can use.
        """
        y = self.transform_y(data)
        X = self.transform_x(data)

        return X, y
    
    def transform_x(self, data, onehot=False):
        """
        only transform x, for the generated data
        """
        cats = data[self.cat_columns]

        # encode each categorical feature as an integer
        for column, encoder in list(self.column_encoders.items()):
            cats[column] = encoder.transform(cats[column])

        # one-hot encode the categorical features
        if cats.shape[1] != 0 and onehot:
            X = self.cat_encoder.transform(cats)
        else:
            X = cats
        
        if self.class_column in data:
            nums = data.drop([self.class_column], axis=1).select_dtypes(include=['int64']).values
        else:
            nums = data.select_dtypes(include=['int64']).values
            
       
        # transform range cols into integrate. e.g., <4 -> 1; 4<x<7 -> 2
        ranges = []
        for col in self.range_col:
            values = data[col]
            ranges.append( self.range2int(values) )
#         print(X.shape, nums.shape, ranges.shape)
        if(ranges==[]):
            X = np.concatenate((X, nums), axis=1)
        else:
            ranges = np.transpose( np.array(ranges) )
            X = np.concatenate((X, nums, ranges), axis=1)
        return X
    
    def transform_y(self, data):
        if self.class_column in data:
            # pull labels into a separate series and transform them to integers
            labels = np.array(data[[self.class_column]])
            y = self.label_encoder.transform(labels)
            # drop the label column and transform the remaining features
        else:
            y = None
            
        return y
    
    def range2int(self, values):
        ranges = []
        for v in values:
            if v not in ranges:
                ranges.append(v)
        
        def sort_key(x):
            num_strings = re.findall('\d+', x)
            # 'undefined' is in the front
            if len(num_strings)==0:
                return -1
            # x> 1, x<7
            elif len(num_strings)==1:
                return int(num_strings[0])*2
            # 1<x<7
            else:
                nums = map(int, num_strings) # string to number
                return sum(nums)
                
        ranges.sort(key=sort_key)
        return list(map(lambda x: ranges.index(x), values))
        
        
    
    def fit_transform(self, data):
        """ Process data into a form that ATM can use. """
        self.fit(data)
        return self.transform(data)