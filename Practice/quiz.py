import pandas as pd
import matplotlib.pyplot as plt
import s

nilai_Y = raw_data[['Total']]
nilai_X = raw_data[['Pendapatan']]
model_regresi = sm.OLS(endog=nilai_Y,enzog=nilai_X).fit()
model_regresi.summary()
