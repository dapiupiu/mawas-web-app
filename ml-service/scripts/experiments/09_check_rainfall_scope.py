import pandas as pd

path = "data/idn-rainfall.csv"

df = pd.read_csv(path, low_memory=False)
df["date"] = pd.to_datetime(df["date"])

print("Rentang tanggal seluruh file:", df["date"].min().date(), "sampai", df["date"].max().date())
print("Jumlah tanggal unik:", df["date"].nunique())

kab = df[(df["adm_level"] == 2) & (df["date"] >= "2021-01-01")].copy()

print("\nBaris kabupaten sejak 2021:", len(kab))
print("Jumlah PCODE kabupaten unik:", kab["PCODE"].nunique())
print("Jumlah tanggal unik sejak 2021:", kab["date"].nunique())

print("\nBaris prelim per tanggal (seluruh file):")
print(df[df["version"] == "prelim"].groupby("date").size())

print("\nJumlah NaN per kolom (kabupaten sejak 2021):")
print(kab[["n_pixels", "rfh", "rfh_avg", "r1h", "r3h", "rfq", "r1q", "r3q"]].isna().sum())

print("\nRingkasan n_pixels per kabupaten:")
print(kab.groupby("PCODE")["n_pixels"].first().describe())

print("\n5 contoh PCODE kabupaten:", sorted(kab["PCODE"].unique())[:5])