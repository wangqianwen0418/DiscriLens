from model.data_encoder import DataEncoder

from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier

from sklearn.model_selection import cross_val_score

class ModelGene(object):   
    def __init__(self, model_name='knn'):
        self.models = {
            "rf": RandomForestClassifier(
                bootstrap=True, 
                class_weight=None, 
                criterion='entropy', 
                max_depth=10, 
                max_features=0.45, 
                max_leaf_nodes=None, 
                min_impurity_decrease=1e-07, 
                min_samples_leaf=6, 
                min_samples_split=7, 
                min_weight_fraction_leaf=0.0, 
                n_estimators=512, 
                n_jobs=1, 
                oob_score=False, 
                random_state=3, 
                verbose=0, 
                warm_start=False
            ),
            "knn": KNeighborsClassifier(
                algorithm = "ball_tree",
                leaf_size = 40,
                metric = "manhattan",
                n_neighbors = 17
            )
        }
        self.model = self.models[model_name]

    def fit_model(self, data):
        '''
        Args:
            data(panda DataFrame): training dataset

        Return:
            model: an already trained sklearn model
            score(list<number>): cross validate score
        '''
        
        encoder = DataEncoder()
        encoder.fit(data)
        x_train, y_train = encoder.transform(data)

        model = self.model
        model.fit(x_train, y_train)
        score = cross_val_score(model, x_train, y_train, scoring='accuracy', cv=10) 
        return model, encoder, score
   
