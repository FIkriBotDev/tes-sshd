import pandas as pd
import statsmodels.api as sm

raw_data = pd.read_csv('https://storage.googleapis.com/dqlab-dataset/dataset_statistic.csv',sep=';')

nilai_Y = raw_data[['Total']]
nilai_X = raw_data[['Pendapatan']]
model_regresi = sm.OLS(endog=nilai_Y,exog=nilai_X).fit()
model_regresi.summary()
