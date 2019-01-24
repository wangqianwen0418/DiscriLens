import pandas as pd


def find_range_cols(data):
    range_col = [] # columns that fit numerical values into ranges
    for col in data.select_dtypes(exclude=['int', 'float', 'float64']).columns:
        if any(item in data[col][0] for item in ['>', '<']): 
            range_col.append(col)
                
    return range_col