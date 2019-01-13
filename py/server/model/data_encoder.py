from sklearn.preprocessing import LabelEncoder, OneHotEncoder

from model.helpers import find_range_cols

import pandas as pd
import numpy as np

import re

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
            cats = data.drop([self.class_column]+range_col, axis=1).select_dtypes(exclude=['int'])
            self.cat_columns = cats.columns
        else:
            cats = data[self.cat_columns].drop(range_col, axis=1).select_dtypes(exclude=['int'])
            
        self.cat_cols = cats.columns
        
        for cat_name in cats.columns:   
        # save the indices of categorical columns for one-hot encoding

            # encode each feature as an integer in range(unique_vals)
            le = LabelEncoder()
            cats[cat_name] = le.fit_transform(cats[cat_name])
            self.column_encoders[cat_name] = le

        # One-hot encode the whole feature matrix.
        # Set sparse to False so that we can test for NaNs in the output
        self.cat_encoder = OneHotEncoder(categories='auto',sparse=False)
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
    
    def transform_x(self, data):
        """
        only transform x, for the generated data
        """
        cats = data[self.cat_columns]

        # encode each categorical feature as an integer
        for column, encoder in list(self.column_encoders.items()):
            cats[column] = encoder.transform(cats[column])

        # one-hot encode the categorical features
        X = self.cat_encoder.transform(cats)
        
        if self.class_column in data:
            nums = data.drop([self.class_column], axis=1).select_dtypes(include=['int']).values
        else:
            nums = data.select_dtypes(include=['int']).values
            
       
        # transform range cols into integrate. e.g., <4 -> 1; 4<x<7 -> 2
        ranges = []
        for col in self.range_col:
            values = data[col]
            ranges.append( self.range2int(values) )
        ranges = np.transpose( np.array(ranges) )
#         print(X.shape, nums.shape, ranges.shape)
        
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