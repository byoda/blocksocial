#!/usr/bin/env python3

# Tool to augment a moderation list with data from an Excel spreadsheet,
# a Google Sheet or a CSV file

import os
import sys
import csv
import logging
import argparse
import warnings

from typing import Self
from datetime import UTC
from datetime import datetime
from logging import Logger, getLogger
from collections import OrderedDict

from ruamel.yaml import YAML

from openpyxl import Workbook
from openpyxl import load_workbook as load_excel_workbook
from openpyxl.cell.cell import Cell
from openpyxl.worksheet.worksheet import Worksheet

_LOGGER: Logger = getLogger(__name__)

ColumnMap = dict[str, set[int] | int]


class SocialPlatform:
    def __init__(self, name: str, url: str,
                 social_url_prefix: str | None = None) -> None:
        self.name: str = name
        self.url: str = url
        self.social_url_prefix: str = social_url_prefix or url


SOCIAL_PLATFORMS: dict[str, SocialPlatform] = {
    'facebook': SocialPlatform('Facebook', 'https://www.facebook.com/'),
    'instagram': SocialPlatform('Instagram', 'https://www.instagram.com/'),
    'twitter': SocialPlatform('Twitter', 'https://x.com/'),
    'youtube': SocialPlatform(
        'YouTube', 'https://www.youtube.com/', 'https://www.youtube.com/@'
    ),
    'tiktok': SocialPlatform('TikTok', 'https://www.tiktok.com/'),
    'truthsocial': SocialPlatform(
        'Truth Social', 'https://www.truthsocial.com/'
    ),
    'parler': SocialPlatform('Parler', 'https://www.parler.com/'),
    'rumble': SocialPlatform('Rumble', 'https://rumble.com/'),
    'odysee': SocialPlatform('Odysee', 'https://odysee.com/'),
    'gab': SocialPlatform('Gab', 'https://gab.com/'),
    'telegram': SocialPlatform('Telegram', 'https://t.me/'),
    'bitchute': SocialPlatform(
        'BitChute', 'https://www.bitchute.com/',
        'https://www.bitchute.com/channel/'
    ),
    'bsky': SocialPlatform(
        'Bluesky', 'https://www.bsky.com/', 'https://www.bsky.com/@'
    ),
    'mastodon': SocialPlatform('Mastodon', 'https://mastodon.social/'),
    'threads': SocialPlatform('Threads', 'https://www.threads.net/'),
    'twitch': SocialPlatform('Twitch', 'https://www.twitch.tv/'),
    'reddit': SocialPlatform(
        'Reddit', 'https://www.reddit.com/', 'https://www.reddit.com/r/'
    ),
    'discord': SocialPlatform('Discord', 'https://discord.com/'),
}


class AccountStat:
    def __init__(self, timestamp: int | float | datetime | None = None,
                 followers: int | None = None,
                 assets: int | None = None,
                 views: int | None = None) -> None:
        '''
        A data point with one or more statistics for the account
        '''

        if not timestamp:
            timestamp = datetime.now(tz=UTC)
        elif type(timestamp) in (int, float):
            timestamp = datetime.fromtimestamp(timestamp, tz=UTC)
        self.timestamp: datetime = timestamp

        if followers is None and assets is None and views is None:
            raise ValueError(
                'Either followers,assets, or views must be provided'
            )

        self.followers: int | None = followers
        self.assets: int | None = assets
        self.views: int | None = views

    def as_dict(self) -> dict[str, int | datetime]:
        return {
            'timestamp': self.timestamp,
            'followers': self.followers,
            'assets': self.assets,
            'views': self.views
        }

    @staticmethod
    def from_dict(stat_data: dict) -> Self:
        return AccountStat(
            timestamp=stat_data.get('timestamp'),
            followers=stat_data.get('followers'),
            assets=stat_data.get('assets'),
            views=stat_data.get('views')
        )


class SocialAccount:
    def __init__(self, platform: str | SocialPlatform, handle: str,
                 url: str, followers: int | None = None,
                 assets: int | None = None, views: int | None = None,
                 last_active: datetime | str | None = None,
                 status: str = 'active',
                 is_primary: bool | None = None) -> None:
        '''
        An account on a social network platform

        :param platform: The social network platform
        :param handle: The account handle
        :param url: The URL for the account on the social network
        :param followers: The number of followers for the account
        :param assets: The number of assets for the account
        :param views: The number of views for the account
        :param last_active: The last time the account was active
        :param is_primary: Whether the account is the primary account on the
        platform. If a moderation entry has multiple accounts on the same
        platform, one account should be marked as the primary account.
        '''

        if isinstance(platform, str):
            platform = SOCIAL_PLATFORMS[platform.lower().replace(' ', '')]

        self.platform: SocialPlatform = platform
        self.handle: str = handle

        self.url: str = url

        # Why do platforms change their domain? This is a hack to fix
        if 'twitter.com' in url:
            self.url = url.replace('twitter.com', 'x.com')

        self.account_stats: list[AccountStat] = []
        if followers or assets or views:
            self.account_stats.append(
                AccountStat(
                    followers=followers,
                    assets=assets,
                    views=views
                )
            )

        self.is_primary: bool | None = is_primary
        self.status: str = status
        self.last_active: datetime | None
        if isinstance(last_active, str) and last_active == 'unknown':
            self.last_active = None
        else:
            self.last_active: datetime | None = last_active

    def __repr__(self) -> str:
        return f'{self.platform.name.lower()} {self.url.lower()}'

    def __eq__(self, other: Self) -> bool:
        if isinstance(other, SocialAccount):
            return (
                self.platform == other.platform and self.handle == other.handle
            )

        return False

    def __ne__(self, other: Self) -> bool:
        return not self.__eq__(other)

    def __hash__(self) -> int:
        return hash((self.platform, self.handle))

    def as_dict(self) -> dict[str, str | int | datetime | None]:
        stats: list[dict[str, datetime | int]] = [
            account_stat.as_dict() for account_stat in self.account_stats
        ]
        return {
            'platform': self.platform.name,
            'handle': self.handle,
            'url': self.url,
            'is_primary': self.is_primary,
            'stats': stats,
            'status': self.status,
            'last_active': self.last_active or 'unknown'
        }

    @staticmethod
    def from_dict(account_data: dict) -> Self:
        account: SocialAccount = SocialAccount(
            platform=account_data.get('platform'),
            handle=account_data.get('handle'),
            url=account_data.get('url'),
            followers=account_data.get('followers'),
            assets=account_data.get('assets'),
            views=account_data.get('views'),
            last_active=account_data.get('last_active'),
            is_primary=account_data.get('is_primary'),
            status=account_data.get('status')
        )

        for stats_data in account_data.get('stats' or [], []):
            stats: AccountStat = AccountStat.from_dict(stats_data)
            account.account_stats.append(stats)

        return account


class ModerationEntry:
    def __init__(
        self, first_name: str | None, last_name: str | None,
        business_name: str | None, business_type: str | None,
        languages: str | list[str] | None, categories: str | set[str],
        annotations: str | list[str] | None, urls: str | list[str] | None
    ) -> None:
        '''
        '''

        self.first_name: str | None = first_name
        self.last_name: str | None = last_name
        self.business_name: str | None = business_name
        self.business_type: str | None = business_type

        self.social_accounts: set[SocialAccount] = set()

        self.languages: set[str] = \
            ModerationEntry._string_to_set(languages) or set(['en'])

        self.urls: set[str] = ModerationEntry._string_to_set(
            urls, convert_case=False
        )
        self.categories: set[str] = ModerationEntry._string_to_set(categories)
        self.annotations: set[str] = ModerationEntry._string_to_set(
            annotations
        )

    def __repr__(self) -> str:
        for platform in 'twitter', 'youtube', 'facebook', 'instagram':
            account: SocialAccount | None = self.get_account(platform)
            if account and account.url:
                return f'{platform.lower()} {account.url.lower()}'

        name: str = self.get_name()
        if name:
            return name

        return 'unknown'

    def __eq__(self, other: Self) -> bool:
        '''
        Two block entries are the same if they share one or more
        Twitter/X, YouTube, FaceBook or Instagram accounts,
        and if their names are defined for both entries and they match.
        This allows for social accounts that are shared by multiple
        people to be considered separate.
        '''

        match_found: bool = False
        if isinstance(other, ModerationEntry):
            for platform in 'twitter', 'youtube', 'facebook', 'instagram':
                if self.get_accounts(platform) & other.get_accounts(platform):
                    match_found = True
                    break

        if match_found:
            if ((self.first_name and other.first_name)
                    and (self.first_name != other.first_name)):
                return False
            if ((self.last_name and other.last_name)
                    and (self.first_name != other.first_name)):
                return False
            if ((self.business_name and other.business_name)
                    and (self.business_name != other.business_name)):
                return False
            return True

        return False

    def __ne__(self, other: Self) -> bool:
        return not self.__eq__(other)

    def __hash__(self) -> int:
        return hash((self.first_name, self.last_name, self.business_name))

    def __lt__(self, other: Self) -> bool:
        return self.get_name() < other.get_name()

    @staticmethod
    def _string_to_set(value: str | set[str], convert_case: bool = True
                       ) -> set[str]:
        if isinstance(value, str):
            value = value.split(',')

        values: set[str] = set([])
        item: str
        for item in value:
            if not item:
                continue
            if not isinstance(item, str):
                continue

            item = item.strip()
            if convert_case:
                item = item.lower()

            values.add(item.replace(' ', ''))

        return values

    def as_dict(self) -> dict[str, str | dict]:
        accounts: list[dict[str, str | int | datetime | None]] = [
            account.as_dict() for account in self.social_accounts
        ]

        return {
            'first_name': self.first_name,
            'last_name': self.last_name,
            'business_name': self.business_name,
            'business_type': self.business_type,
            'urls': list(self.urls),
            'categories': list(self.categories),
            'annotations': list(self.annotations),
            'languages': list(self.languages) or ['en'],
            'social_accounts': accounts
        }

    def get_name(self) -> str:
        if self.first_name or self.last_name:
            return f'{self.first_name} {self.last_name}'
        if self.business_name:
            return self.business_name

        if self.social_accounts:
            for platform in ['twitter', 'youtube', 'facebook', 'instagram']:
                account: SocialAccount | None = self.get_account(platform)
                if account:
                    return account.handle

            return list(self.social_accounts)[0].handle

        return 'unknown'

    @staticmethod
    def from_dict(entry_data: dict) -> None:
        entry: ModerationEntry = ModerationEntry(
            first_name=entry_data.get('first_name'),
            last_name=entry_data.get('last_name'),
            business_name=entry_data.get('business_name'),
            business_type=entry_data.get('business_type'),
            languages=entry_data.get('languages'),
            categories=set(entry_data.get('categories', set())),
            annotations=set(entry_data.get('annotations', set())),
            urls=entry_data.get('urls')
        )

        for account_data in entry_data.get('social_accounts', []):
            account: SocialAccount = SocialAccount.from_dict(account_data)
            entry.social_accounts.add(account)

        return entry

    def merge(self, other: Self) -> None:
        '''
        Merge an entry into the list
        '''

        if not self.first_name and other.first_name:
            self.first_name = other.first_name
        if not self.last_name and other.last_name:
            self.last_name = other.last_name
        if not self.business_name and other.business_name:
            self.business_name = other.business_name
        if not self.business_type and other.business_type:
            self.business_type = other.business_type

        _LOGGER.info(f'Merging {self.get_name()} with {other.get_name()}')
        self.categories.update(other.categories)
        self.languages.update(other.languages)
        self.annotations.update(other.annotations)
        self.urls.update(other.urls)

        for social in other.social_accounts:
            if social not in self.social_accounts:
                self.social_accounts.add(social)

    def add_account(
        self, platform: str | SocialPlatform, handle: str, url: list[str],
        followers: int | None = None, assets: int | None = None,
        views: int | None = None, last_active: datetime | str | None = None,
        is_primary: bool | None = None, status: str = 'active'
    ) -> None:
        '''
        Add a social account to the moderation entry
        '''

        if isinstance(platform, str):
            platform = SOCIAL_PLATFORMS[platform.lower().replace(' ', '')]
        self.social_accounts.add(
            SocialAccount(
                platform=platform, handle=handle, url=url,
                followers=followers, assets=assets, views=views,
                last_active=last_active, is_primary=is_primary, status=status
            )
        )

    def get_account(self, platform: str | SocialPlatform
                    ) -> SocialAccount | None:
        '''
        Get the (primary) social account for the platform

        :param platform: The social platform
        :param primary_only: Whether to return only the primary account
        '''

        if isinstance(platform, str):
            platform = SOCIAL_PLATFORMS[platform.lower()]

        accounts: set[SocialAccount] = self.get_accounts(platform)

        if not accounts:
            return None
        elif len(accounts) == 1:
            return next(iter(accounts))
        else:
            for account in accounts:
                if account.is_primary:
                    return account
            return accounts[0]

    def get_accounts(self, platform: str | SocialPlatform
                     ) -> set[SocialAccount]:
        '''
        Get all social accounts for the platform

        :param platform: The social platform
        '''

        if isinstance(platform, str):
            platform = SOCIAL_PLATFORMS[platform.lower()]

        accounts: set[SocialAccount] = set()
        account: SocialAccount
        for account in self.social_accounts:
            if account.platform.name == platform.name:
                accounts.add(account)

        return accounts


class UserEntry:
    def __init__(self, name: str, email: str, url: str) -> None:
        self.name: str = name
        self.email: str = email
        self.url: str = url

    def as_dict(self) -> dict[str, str]:
        return {
            'name': self.name,
            'email': self.email,
            'url': self.url
        }

    def from_dict(user_data: dict) -> Self:
        return UserEntry(
            name=user_data.get('name'),
            email=user_data.get('email'),
            url=user_data.get('url')
        )


class ModerationList:
    def __init__(self, list_name: str, author_name: str, author_email: str,
                 author_url: str, list_url: str, download_url: str,
                 categories: dict[str, str],
                 last_updated: int | float | datetime | None) -> None:
        self.list_name: str = list_name
        self.author_name: str = author_name
        self.author_email: str = author_email
        self.author_url: str = author_url
        self.email: str = author_email
        self.categories: dict[str, str] = categories

        self.disclaimer: str = (
            'This list reflects the opinions of the author and the author '
            'shares these opinions with those who are interested in them. '
            'No information in this list should be considered as fact.'
        )
        self.list_url: str = list_url
        self.download_url: str = download_url

        if not last_updated:
            last_updated = datetime.now(tz=UTC)
        elif type(last_updated) in (int, float):
            last_updated = datetime.fromtimestamp(last_updated, tz=UTC)
        self.last_updated: datetime = last_updated

        self.blocks: dict[ModerationEntry] = {}
        self.trusts: list[UserEntry] = []
        self.recommends: list[UserEntry] = []

    def __len__(self) -> int:
        return len(self.blocks)

    def add_block(self, entry: ModerationEntry) -> None:
        # name: str = entry.get_name()
        repr: str = entry.__repr__()

        if repr not in self.blocks:
            self.blocks[repr] = entry
        else:
            existing_entry: ModerationEntry = self.blocks[repr]
            existing_entry.merge(entry)

        self.last_updated = datetime.now(tz=UTC)

    def add_trust(self, entry: UserEntry) -> None:
        self.trusts.append(entry)
        self.last_updated = datetime.now(tz=UTC)

    def add_recommend(self, entry: UserEntry) -> None:
        self.recommends.append(entry)
        self.last_updated = datetime.now(tz=UTC)

    def as_dict(self) -> dict[str, list[dict[str, str | dict]]]:
        data: OrderedDict[str, dict[str, any]] = {
            'meta': {
                'last_updated': self.last_updated,
                'list_name': self.list_name,
                'author_name': self.author_name,
                'author_email': self.author_email,
                'author_url': self.author_url,
                'download_url': self.download_url,
                'disclaimer': self.disclaimer,
                'categories': self.categories,
            },
            'block_list': [
                entry.as_dict() for entry in self.blocks.values()
            ],
            'trust_list': [
                entry.as_dict() for entry in self.trusts
            ],
            'recommend_list': [
                entry.as_dict() for entry in self.recommends
            ],

        }
        return data

    @staticmethod
    def from_dict(raw_data) -> Self:
        modlist = ModerationList(
            list_name=raw_data['meta'].get('list_name'),
            list_url=raw_data['meta'].get('list_url'),
            author_name=raw_data['meta'].get('author_name'),
            author_email=raw_data['meta'].get('author_email'),
            author_url=raw_data['meta'].get('author_url'),
            download_url=raw_data['meta'].get('download_url'),
            categories=raw_data['meta'].get('categories'),
            last_updated=raw_data['meta'].get('last_updated')
        )

        for entry_data in raw_data.get('block_list', []):
            entry: ModerationEntry = ModerationEntry.from_dict(entry_data)
            modlist.add_block(entry)

        for user_entry in raw_data.get('trust_list', []):
            entry: UserEntry = UserEntry.from_dict(user_entry)
            modlist.add_trust(entry)

        for user_entry in raw_data.get('recommend_list', []):
            entry: UserEntry = UserEntry.from_dict(user_entry)
            modlist.add_recommend(entry)

        return modlist

    def save(self, filename: str) -> None:
        yaml: YAML = YAML(typ='safe')
        yaml.default_flow_style = False
        yaml.indent(mapping=2, sequence=4, offset=2)
        yaml.explicit_start = True
        yaml.explicit_end = True
        yaml.allow_unicode = True
        yaml.default_style = None

        data: dict[str, list[dict[str, str | dict]]] = self.as_dict()
        with open(filename, 'w') as file_desc:
            yaml.dump(data, file_desc)

    @staticmethod
    def load(filename: str) -> Self:
        yaml: YAML = YAML(typ='safe')
        with open(filename, 'r') as file_desc:
            raw_data: dict[str, dict[str, str | list[dict[str, any]]]] = \
                yaml.load(file_desc)

        modlist: ModerationList = ModerationList.from_dict(raw_data)

        return modlist

    @staticmethod
    def from_workbook(filename: str, list_name: str, list_url: str | None,
                      author_name: str | None, author_email: str | None,
                      author_url: str | None, download_url: str | None
                      ) -> Self:
        '''
        Factory to create a new moderation list from an Excel workbook
        '''

        mod_list: ModerationList = ModerationList(
            list_name=list_name,
            list_url=list_url,
            author_name=author_name,
            author_email=author_email,
            author_url=author_url,
            download_url=download_url,
            categories={},
            last_updated=os.path.getmtime(filename)
        )

        mod_list.add_excel(filename)

        return mod_list

    def add_csv(self, filename: str) -> None:
        '''
        Adds entries from a CSV file to the moderation list

        :param filename: The CSV file to load
        '''

        with open(filename) as csv_file:
            csv_reader = csv.reader(csv_file)
            headers: list[str] = next(csv_reader)
            column_map: ColumnMap = ModerationList.discover_columns(headers)
            for row in csv_reader:
                for index in range(len(row)):
                    if row[index] == '':
                        row[index] = None
                self.add_row(column_map, row)

    def add_excel(self, filename: str) -> None:
        '''
        Adds entries from an Excel workbook to the moderation list

        Supported column names for columns with max 1 column:
        First Name, Last Name, Business Name, Business Type,
        languages, categories, politician, journalist,

        Supported column names where the column name can be
        appended with '-<number>' to indicate multiple columns:
        web, youtube, twitter, facebook, instagram, tiktok,
        truth social, rumble, bitchute, telegram, reddit,
        bluesky, threads, mastodon, twitch, gab, discord, kick, odyssey

        Column names are case-insensitive and whitespace are ignored

        :param filename: The Excel file to load
        '''

        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=UserWarning)
            wb: Workbook = load_excel_workbook(filename=filename)
            sheet: Worksheet = wb['moderation']

            row_columns: list[Cell]
            column_map: ColumnMap = ModerationList.discover_excel_columns(
                next(sheet.rows)
            )
            for row_columns in sheet.rows:
                self.add_excel_row(column_map, row_columns)

    @staticmethod
    def discover_excel_columns(row_columns: list[Cell]) -> ColumnMap:
        column: Cell
        columns: list[str] = []
        for column in row_columns:
            column_name: str = column.value
            columns.append(column_name)

        return ModerationList.discover_columns(columns)

    @staticmethod
    def discover_columns(columns: list[str]) -> ColumnMap:
        column_map: dict[str, set[int]] = {}
        index: int = 0
        column_name: str
        for column_name in columns:
            if '-' in column_name:
                counter: int
                try:
                    social_name: str
                    social_name, counter = column_name.split('-', maxsplit=1)
                    counter = int(counter)
                    column_name = social_name
                except ValueError:
                    pass

            column_name = column_name.strip().lower().replace(' ', '')
            if column_name in SOCIAL_PLATFORMS:
                if column_name not in column_map:
                    column_map[column_name] = set([index])
                else:
                    column_map[column_name].add(index)
            else:
                column_map[column_name] = set([index])

            index += 1

        return column_map

    def add_excel_row(self, column_map: ColumnMap, row_columns: list[Cell]
                      ) -> None:

        columns: list[str] = []
        for column in row_columns:
            if isinstance(column, Cell):
                if column.hyperlink:
                    columns.append(column.hyperlink.target)
                else:
                    columns.append(column.value)
            else:
                columns.append(column)

        self.add_row(column_map, columns)

    def add_row(self, column_map: ColumnMap, row_columns: list[str]) -> None:
        first_name: str | None = None
        last_name: str | None = None
        business_name: str | None = None
        if 'firstname' in column_map:
            first_name = row_columns[next(iter(column_map['firstname']))]
        if 'lastname' in column_map:
            last_name = row_columns[next(iter(column_map['lastname']))]
        if 'businessname' in column_map:
            business_name = row_columns[next(iter(column_map['businessname']))]

        name: str = ''
        if not business_name:
            if first_name:
                name = first_name
                if last_name:
                    name = f'{name} {last_name}'
            else:
                if last_name:
                    name = last_name
                else:
                    name = '(N/A)'
        else:
            if first_name and last_name:
                name = f'{first_name} {last_name}'
            else:
                name = business_name

        business_type: str | None = None
        if 'businesstype' in column_map:
            business_type = row_columns[next(iter(column_map['businesstype']))]

        languages: str | set[str] = ['en']
        if 'languages' in row_columns:
            languages = row_columns[next(iter(column_map['languages']))]
            if isinstance(languages, str):
                languages = set(
                    [
                        language.strip() for language in languages.split(',')
                        if language and isinstance(language, str)
                    ]
                )

        categories: str | list[str] = \
            row_columns[next(iter(column_map.get('categories', set())))]
        if (not categories
                or (isinstance(categories, str) and '?' in categories)):
            if name != '(N/A)':
                _LOGGER.info(
                    f'Skipping entry {name} with no categories'
                )
            return

        categories: set[str] = ModerationEntry._string_to_set(categories)

        # Add the meta level we maintain a list of categories and our
        # description for them. Here we make sure any category for an entry
        # is added to the list of categories at that meta level.
        for category in categories:
            if category not in self.categories:
                self.categories[category] = ''

        annotations: set[str] = set()
        if 'politician' in column_map:
            if row_columns[next(iter(column_map['politician']))]:
                annotations.add('politician')

        if 'journalist' in column_map:
            if row_columns[next(iter(column_map['journalist']))]:
                annotations.add('journalist')

        urls: set[str] = set()
        for index in iter(column_map.get('web', set())):
            if row_columns[index]:
                urls.add(row_columns[index])

        entry = ModerationEntry(
            first_name=first_name,
            last_name=last_name,
            business_name=business_name,
            business_type=business_type,
            languages=languages,
            categories=categories,
            annotations=annotations,
            urls=urls,
        )

        social: str
        columns: list[int]
        # for social, columns in column_map.items():
        for social in SOCIAL_PLATFORMS:
            columns = column_map.get(social, set([]))
            self.add_social_from_row(
                entry, row_columns, social, columns
            )

        if len(entry.social_accounts):
            self.add_block(entry)
        else:
            _LOGGER.debug(
                f'Skipping entry without social accounts: {name}'
            )

    def add_social_from_row(self, entry: ModerationEntry,
                            row_columns: list[int], social: str,
                            columns: set[int]) -> None:
        '''
        Adds a social account to the entry, if it exists in the row

        :param entry: The moderation entry to add the social account to
        :param row_columns: The row of columns from the workbook
        :param social: The social platform
        :param columns: The columns in the row that contain the social accounts
        '''

        for column_index in columns:
            value: str = row_columns[column_index]
            if not value:
                continue

            account_status: str = 'active'
            if ' - ' in value:
                value, account_status = value.split(' - ')
                if ' ' in account_status:
                    account_status = account_status.split(' ')[-1].strip()  # noqa

            link: str = value
            if not value.startswith('https://'):
                # Let's assume cell value is the handle for
                # the social account
                link = \
                    SOCIAL_PLATFORMS[social].social_url_prefix + value

            entry.add_account(
                platform=social,
                handle=row_columns[column_index],
                url=link,
                status=account_status,
                is_primary=column_index == sorted(columns)[0]
            )
            name: str = entry.get_name()
            _LOGGER.debug(f'Added {social} account for {name}')


FILE_DIR: str = '/mnt/c/Users/steve/OneDrive/BYODA/Engineering'
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
