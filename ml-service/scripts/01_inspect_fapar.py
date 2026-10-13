import rasterio

path = "data/FAPAR/2021/fpanv_m_gdo_20210101_t_300_z03.tif"

with rasterio.open(path) as src:
    print("Lebar x tinggi (piksel):", src.width, "x", src.height)
    print("Jumlah band:", src.count)
    print("Tipe data:", src.dtypes)
    print("CRS:", src.crs)
    print("Bounds:", src.bounds)
    print("Resolusi piksel:", src.res)
    print("Nodata", src.nodata)
    print("Transformasi:", src.transform)
