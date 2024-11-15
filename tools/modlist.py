#!/usr/bin/env python3

# Tool to augment a moderation list with data from an Excel spreadsheet
# or a CSV file
#
# To generate a block list, you can either edit YAML directly or you can use
# the tools/modlist.py script to generate a block list from a CSV or an Excel
# file. The tests/collateral directory has a CSV file and an Excel file that
# you can use as a starting point.
#
# After editing the excel or csv file, you can generate the file with the
# block list.
#     pipenv install
#     pipenv run python tools/modlist.py --workbook tests/collateral/blocklist.csv --yaml my_blocklist.yaml
#
#
# If you have access to a webserver then you can upload the yaml file there.
# Alternatively, you can email the YAML file to steven+byomod@byoda.org and I
# will host it for you under https://byomod.org/lists/your_blocklist.yaml.
#
# In any case, ping me about your list so I can include it in the list-of-lists
# at https://byomod.org/lists/list-of-lists.json

import os
import sys
import logging
import argparse

from logging import Logger, getLogger

from tools.lib.lists import (
    ModerationList,
)


_LOGGER: Logger = getLogger(__name__)


FILE_DIR: str = '/mnt/c/Users/steve/OneDrive/BYODA/Engineering/moderation'
TEST_EXCEL: str = f'{FILE_DIR}/content-moderation.xlsx'
TEST_CSV: str = f'{FILE_DIR}/content-moderation - CSV.csv'
TEST_YAML = 'tests/collateral/dathes.yaml'


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--yaml', '-y', type=str, default=TEST_YAML)
    parser.add_argument(
        '--workbook', '-w', type=str, default=TEST_EXCEL
    )
    parser.add_argument('--output', '-o', type=str, default=None)
    args: argparse.Namespace = parser.parse_args(sys.argv[1:])
    if args.output is None:
        args.output = args.yaml

    logging.basicConfig(level=logging.INFO)

    mod: ModerationList
    if os.path.exists(args.yaml):
        mod = ModerationList.load(args.yaml)
    else:
        _LOGGER.info(f'Creating a new moderation list: {args.output}')
        mod = ModerationList(
            list_name='TBD',
            author_name='TBD',
            author_email='TBD',
            author_url='TBD',
            download_url='TBD',
            categories=[],
        )

    extension: str = os.path.splitext(args.workbook)[-1]
    if extension in ('.xlsx', '.xls'):
        mod.add_excel(args.workbook)
    if extension in ('.csv'):
        mod.add_csv(args.workbook)

    mod.save(args.output)
