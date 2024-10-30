#!/usr/bin/env python3

'''
Updates the List of Lists file with data downloaded from the URLs

:maintainer: Steven Hessing
:copyright: Copyright 2024
:licence: GPLv3.0
'''

import os
import sys
import logging
import argparse

from logging import Logger, getLogger

from tools.lib.lists import ListOfLists


_LOGGER: Logger = getLogger(__name__)

LIST_OF_LISTS: str = 'tests/collateral/list-of-lists.json'


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', '-f', type=str, default=LIST_OF_LISTS)
    parser.add_argument('--output', '-o', type=str, default=None)
    parser.add_argument(
        '--cache-dir', '-c', type=str, default='/tmp/list_of_lists'
    )
    args: argparse.Namespace = parser.parse_args(sys.argv[1:])
    if args.output is None:
        args.output = args.file

    logging.basicConfig(level=logging.INFO)

    if args.cache_dir and not os.path.exists(args.cache_dir):
        os.makedirs(args.cache_dir)
    lol: ListOfLists = ListOfLists.load(args.file, args.cache_dir)
    lol.save(args.output)
