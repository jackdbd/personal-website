---
date: "2018-09-01T08:00:03.284Z"
tags:
  - pandas
  - Python
title: Reading large Excel files with Pandas
---

Last week I took part in a [Dataviz Battle on the dataisbeautiful subreddit](https://www.reddit.com/r/dataisbeautiful/comments/950j3n/battle_dataviz_battle_for_the_month_of_august/), where we had to create a visualization from the [TSA claims dataset](https://www.dhs.gov/tsa-claims-data). I like these kind of competitions because most of the time you end up learning a lot of useful things along the way.

This time the data was quite clean, but it was scattered across several PDF files and Excel files. In the process of extracting data from PDFs I got to know some tools and libraries, and in the end I used [tabula-py](https://github.com/chezou/tabula-py), a Python wrapper for the Java library [tabula](https://tabula.technology/). As for the Excel files, I found out that a one-liner - a simple `pd.read_excel` - wasn't enough.

The biggest Excel file was ~7MB and contained a single worksheet with ~100k lines. I though Pandas could read the file in one go without any issue (I have 10GB of RAM on my computer), but apparently I was wrong.

The solution was to read the file in chunks. The `pd.read_excel` function doesn't have a cursor like `pd.read_sql`, so I had to implement this logic manually. Here is what I did:

``` python
import os
import pandas as pd


HERE = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.abspath(os.path.join(HERE, '..', 'data'))


def make_df_from_excel(file_name, nrows):
    """Read from an Excel file in chunks and make a single DataFrame.

    Parameters
    ----------
    file_name : str
    nrows : int
        Number of rows to read at a time. These Excel files are too big,
        so we can't read all rows in one go.
    """
    file_path = os.path.abspath(os.path.join(DATA_DIR, file_name))
    xl = pd.ExcelFile(file_path)

    # In this case, there was only a single Worksheet in the Workbook.
    sheetname = xl.sheet_names[0]

    # Read the header outside of the loop, so all chunk reads are
    # consistent across all loop iterations.
    df_header = pd.read_excel(file_path, sheetname=sheetname, nrows=1)
    print(f"Excel file: {file_name} (worksheet: {sheetname})")

    chunks = []
    i_chunk = 0
    # The first row is the header. We have already read it, so we skip it.
    skiprows = 1
    while True:
        df_chunk = pd.read_excel(
            file_path, sheetname=sheetname,
            nrows=nrows, skiprows=skiprows, header=None)
        skiprows += nrows
        # When there is no data, we know we can break out of the loop.
        if not df_chunk.shape[0]:
            break
        else:
            print(f"  - chunk {i_chunk} ({df_chunk.shape[0]} rows)")
            chunks.append(df_chunk)
        i_chunk += 1

    df_chunks = pd.concat(chunks)
    # Rename the columns to concatenate the chunks with the header.
    columns = {i: col for i, col in enumerate(df_header.columns.tolist())}
    df_chunks.rename(columns=columns, inplace=True)
    df = pd.concat([df_header, df_chunks])
    return df


if __name__ == '__main__':
    df = make_df_from_excel('claims-2002-2006_0.xls', nrows=10000)
```

Another thing to keep in mind. When working with [Excel files in Python](https://www.python-excel.org/), you might need to use different packages whether you need to read/write data from/to `.xls` and `.xlsx` files.

This dataset contained both `.xls` and `.xlsx` files, so I had to use [xlrd](https://github.com/python-excel/xlrd) to read them. Please [be aware](https://groups.google.com/forum/#!msg/python-excel/P6TjJgFVjMI/g8d0eWxTBQAJ) that if your only concern is reading `.xlsx` files, then [openpyxl](https://openpyxl.readthedocs.io/en/stable/) is the way to go, even if xlrd [could still be faster](https://stackoverflow.com/questions/35823835/reading-excel-file-is-magnitudes-slower-using-openpyxl-compared-to-xlrd).

This time I didn't have to write any Excel files, but if you need to, then you want [xlsxwriter](https://xlsxwriter.readthedocs.io/). I remember having used it to create workbooks (i.e. Excel files) with many complex worksheets and cell comments. You can even use it to create worksheets with [sparklines](https://xlsxwriter.readthedocs.io/working_with_sparklines.html) and [VBA macros](https://xlsxwriter.readthedocs.io/working_with_macros.html)!
