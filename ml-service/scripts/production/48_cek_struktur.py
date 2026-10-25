import pandas as pd

t = pd.read_parquet("data/training/tabel_training.parquet")
print("TABEL TRAINING:", t.shape)
print(t.dtypes)
print(t.head(3).T)

# dtype=str: baca semua sebagai teks mentah
k = pd.read_csv("models/kebiasaan_kabupaten.csv", dtype=str)
print("\nKEBIASAAN:", k.shape)
print(k.head(5))

print("\nSKOR_META:")
print(open("models/skor_meta.json", encoding="utf-8").read())