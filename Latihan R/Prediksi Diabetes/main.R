# Diabetes Predict
## Logistic Regression
df_lr = read.csv('simulated_diabetes_1000.csv')

library(caTools)
set.seed(123)

df_lr[,1:2] = scale(df_lr[,1:2])

split_diabetes_lr = sample.split(df_lr$Diabetes, SplitRatio = 0.8)
training_set_diabetes_lr = subset(df_lr, split_diabetes_lr == TRUE)
test_set_diabetes_lr = subset(df_lr, split_diabetes_lr == FALSE)

classifier_lr = glm(formula = Diabetes ~ Age + Daily_Sugar_g,
                 family = binomial,
                 data = training_set_diabetes_lr)

pred_diabetes_lr = predict(classifier_lr, type = 'response', newdata = test_set_diabetes_lr)

Diabetes_Pred_lr = ifelse(pred_diabetes_lr >= 0.5, 1, 0)

data_diabetes_lr = cbind(test_set_diabetes_lr, Diabetes_Pred_lr)

## k-Nearest Neighbors (kNN)
df_knn = read.csv('simulated_diabetes_1000.csv')

df_knn[,1:2] = scale(df_knn[,1:2])

split_diabetes_knn = sample.split(df_knn$Diabetes, SplitRatio = 0.8)
training_set_diabetes_knn = subset(df_knn, split_diabetes_knn == TRUE)
test_set_diabetes_knn = subset(df_knn, split_diabetes_knn == FALSE)

library(class)
Diabetes_Pred_knn = knn(train = training_set_diabetes_knn[-c(3,4)],
                        test = test_set_diabetes_knn[-c(3,4)],
                        cl = training_set_diabetes_knn[,3],
                        k = 15)

data_diabetes_knn = cbind(test_set_diabetes_knn, Diabetes_Pred_knn)

# Diabetes Prob Predict
## Linear Regression => data_diabetes_lr
split_diabetes_prob_lr_lr = sample.split(data_diabetes_lr$Diabetes_Prob, SplitRatio = 0.8)
training_set_prob_lr_lr = subset(data_diabetes_lr, split_diabetes_prob_lr_lr == TRUE)
test_set_prob_lr_lr = subset(data_diabetes_lr, split_diabetes_prob_lr_lr == FALSE)

regressor_lr_lr = lm(formula = Diabetes_Prob ~ Age + Daily_Sugar_g + Diabetes_Pred_lr,
               data = training_set_prob_lr_lr)

Diabetes_Prob_Pred_lr_lr = predict(regressor_lr_lr, newdata = test_set_prob_lr_lr)
Data_Diabetes_LR = cbind(test_set_prob_lr_lr, Diabetes_Prob_Pred_lr_lr)


## Linear Regression => data_diabetes_knn
split_diabetes_prob_lr_knn = sample.split(data_diabetes_knn$Diabetes_Prob, SplitRatio = 0.8)
training_set_prob_lr_knn = subset(data_diabetes_knn, split_diabetes_prob_lr_knn == TRUE)
test_set_prob_lr_knn = subset(data_diabetes_knn, split_diabetes_prob_lr_knn == FALSE)

regressor_lr_knn = lm(formula = Diabetes_Prob ~ Age + Daily_Sugar_g + Diabetes_Pred_knn,
                     data = training_set_prob_lr_knn)

Diabetes_Prob_Pred_lr_knn = predict(regressor_lr_knn, newdata = test_set_prob_lr_knn)
Data_Diabetes_kNN = cbind(test_set_prob_lr_knn, Diabetes_Prob_Pred_lr_knn)

## k-Nearest Neighbors (kNN) => data_diabetes_lr
split_diabetes_prob_knn_lr = sample.split(data_diabetes_lr$Diabetes_Prob, SplitRatio = 0.8)
training_set_prob_knn_lr = subset(data_diabetes_lr, split_diabetes_prob_knn_lr == TRUE)
test_set_prob_knn_lr = subset(data_diabetes_lr, split_diabetes_prob_knn_lr == FALSE)

Data_Diabetes_knn_lr = knn(train = training_set_prob_knn_lr[-c(3,4,5)],
                                test = test_set_prob_knn_lr[-c(3,4,5)],
                                cl = training_set_prob_knn_lr[,4],
                                k = 15)

Data_Diabetes_knn_lr = cbind(test_set_prob_knn_lr, Data_Diabetes_knn_lr)

## k-Nearest Neighbors (kNN) => data_diabetes_knn
split_diabetes_prob_knn_knn = sample.split(data_diabetes_lr$Diabetes_Prob, SplitRatio = 0.8)
training_set_prob_knn_knn = subset(data_diabetes_lr, split_diabetes_prob_knn_knn == TRUE)
test_set_prob_knn_knn = subset(data_diabetes_lr, split_diabetes_prob_knn_knn == FALSE)

Data_Diabetes_knn_knn = knn(train = training_set_prob_knn_knn[-c(3,4,5)],
                           test = test_set_prob_knn_knn[-c(3,4,5)],
                           cl = training_set_prob_knn_knn[,4],
                           k = 15)

Data_Diabetes_knn_knn = cbind(test_set_prob_knn_knn, Data_Diabetes_knn_knn)


