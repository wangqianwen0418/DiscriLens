# # # add id to samples
import pandas as pd
# from random import randint
# import re
samples = pd.read_json('./academic_xgb_samples.json')
# # df.to_json('academic_xgb_samples.json', orient='records') 
# # samples = pd.read_json('./academic_xgb_samples.json')
# samples.to_json('academic_xgb_samples2.json', orient='records') 
# # samples['ID'] = list(range(1000)) + list(range(1000))
# # samples.to_json('./academic_lr_samples.json', orient='records')

# add item id to rules
def item_within_rule(item, rule_context):
    for attr_val in rule_context:
        attr, val = attr_val.split('=')
        if not item[attr] == val :
            return False
    return True

rules = pd.read_json('./academic_xgb_rules.json')
rules['items'] = ''
for idx, rule in rules.iterrows():
    rules.at[idx, 'items'] = [sample['id'] for i,sample in samples.iterrows() if item_within_rule(sample, rule["antecedent"])] 
rules.to_json('./academic_xgb_rules.json', orient='records')

# numerical_samples = samples.copy()


# for idx, numerical_sample in numerical_samples.iterrows():
#     for col in numerical_samples.columns:
#         cell = str(numerical_sample[col])
#         step=0
#         if re.match('(.*)<=?(x|X)<=?(.*)', cell) is not None:
#             p = re.match('(.*)<=?(x|X)<=?(.*)', cell)
#             numerical_samples.at[idx, col] = randint(int(p[1]), int(p[3]))
#             step = int(p[3])- int(p[1])
#         elif re.match('(x|X)<=?(.*)', cell) is not None:
#             p = re.match('(x|X)<=?(.*)', cell)
#             numerical_samples.at[idx, col] = randint(max(int(p[2])-step, 0), int(p[2]))
#         elif re.match('(x|X)>=?(.*)', cell) is not None:
#             p = re.match('(x|X)>=?(.*)', cell)
#             numerical_samples.at[idx, col] = randint(int(p[2]), int(p[2])+step)

# new_samples = pd.concat([ numerical_samples, samples])
# new_samples.to_json('academic_xgb_samples.json', orient='records') 


###################
# normalized rules
#################/
rule_file = './academic_xgb_rules.json'
rules = pd.read_json(rule_file)
antecedents = []
for idx, rule in rules.iterrows():
    ante = rule["antecedent"]
    if (',').join(ante) not in antecedents:
        antecedents.append( (',').join(ante) )
        if rule['cls'] =='class=0':
            new_row = pd.Series({
                "id": rule['id'],
                "cls": 'class=1',
                'pd': rule['pd'],
                "items": rule['items'],
                "antecedent": rule["antecedent"],
                "conf_pd": 1-rule['conf_pd'],
                "conf_pnd": 1-rule['conf_pnd'],
                "sup_pnd": len(rule["items"]) - rule["sup_pnd"],
                "sup_pd": rule["sup_pd"]/rule['conf_pd'] - rule["sup_pd"],
                "risk_dif": -1*rule["risk_dif"] ,
                "elift": 1/rule["elift"]
            })
            rules.iloc[idx] = new_row
    else: 
        rules = rules.drop([idx])
            
rules.to_json(rule_file, orient='records') 

