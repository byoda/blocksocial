#!/usr/bin/env python3

# Tool to augment a moderation list with data from an Excel spreadsheet,
# a Google Sheet or a CSV file

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
TEST_YAML = 'tests/collateral/content-moderation.yaml'


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
        )

    extension: str = os.path.splitext(args.workbook)[-1]
    if extension in ('.xlsx', '.xls'):
        mod.add_excel(args.workbook)
    if extension in ('.csv'):
        mod.add_csv(args.workbook)

    mod.save(args.output)
