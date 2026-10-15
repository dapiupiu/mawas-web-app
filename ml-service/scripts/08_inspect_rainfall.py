import pandas as pd

path = "data/idn-rainfall.csv"

df = pd.read_csv(path, low_memory=False)

print("Jumlah baris dan kolom:", df.shape)
print("\n Nama kolom:", list(df.columns))
print("\n Tipe data per kolom:")
print(df.dtypes)
print("\n 3 baris pertama:")
print(df.head(3).to_string())

print("\n Isi kolom adm_level:")
print(df["adm_level"].value_counts())

for col in ("type", "version"):
    if col in df.columns:
        print(f"\nIsi kolom {col}:")
        print(df[col].value_counts())