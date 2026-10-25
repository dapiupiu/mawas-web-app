import pandas as pd

hujan = pd.read_parquet("data/rainfall/rainfall_kabupaten.parquet")
fapar = pd.read_parquet("data/fapar_zonal/fapar_kabupaten_final.parquet")

print("=== CURAH HUJAN ===")
print("Bentuk:", hujan.shape)
print("\nKolom dan tipe:")
print(hujan.dtypes.to_string())
print("\nJumlah nilai unik per kolom:")
print(hujan.nunique().to_string())
print("\n3 baris pertama:")
print(hujan.head(3).T.to_string())

print("\n=== FAPAR FINAL (pembanding) ===")
print("Bentuk:", fapar.shape)
print(fapar.dtypes.to_string())