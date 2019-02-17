**************************************
Raw data folder contains source data (cleaned and genreated samples), including 
1. dataTest (modified from adult dataset, protected attribute is "sex= Female")
1. bank (bank_term_deposit, protected attribute is "marital=divorced") 
1. give_credit (give me credit dataset, protected attribute is ''age=0<x<25'', don't have
 better candidate for protected attributes)
Each dataset is used to generate new samples with xgboost and knn models.

***************************************
