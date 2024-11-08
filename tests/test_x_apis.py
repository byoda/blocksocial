#!/usr/bin/env python3

import re
import json

from time import sleep

import httpx

RX_QUERY_ID: re.Pattern = re.compile(
    (
        r'queryId:\"([^\"]+)\",'
        r'operationName:\"([^\"]+)\",'
        r'operationType:\"([^\"]+)\"'
    ),
    re.IGNORECASE | re.MULTILINE
)

EXTENSION_URL: str = 'chrome-extension://eonknbiiibbeipnbhlgedahcbaeomnmj'
CSRF_TOKEN: str = '7ed1c229b860295c74ceed47675ce135eac27ef4281fa7b835350ac70c13cea7f052cefd9efcf029b123d5be0f71db05d261d93b9e848ff9e966dc4757bb55653b63d3f6dbce3489a78649edfb55b99f'        # noqa: E501
AUTH_TOKEN: str = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'                                                         # noqa: E501
COOKIE_AUTH_TOKEN: str = 'aa7872d4aee299693d2444b52685268c681d6890'                                                                                                                         # noqa: E501

SCRIPT_URL: str = 'https://abs.twimg.com/responsive-web/client-web/main.df3c674a.js'


def main() -> None:
    resp: httpx.Response = httpx.get(SCRIPT_URL)
    if resp.status_code == 200:
        script: str = resp.text
        for line in script.splitlines():
            for match in RX_QUERY_ID.finditer(line):
                print(
                    f'Query ID: {match.group(1)}, '
                    f'operation name: {match.group(2)}, '
                    f'operation type: {match.group(3)}'
                )

    cookies: dict[str, str] = {
        'ct0': CSRF_TOKEN,
        'auth_token': COOKIE_AUTH_TOKEN,
    }

    headers: dict[str, str] = {
        'authorization': AUTH_TOKEN,
        'cookie': '; '.join(f'{k}={v}' for k, v in cookies.items()),
        'x-csrf-token': cookies.get('ct0', ''),
    }

    endpoint: str = 'https://api.x.com/1.1/account/settings.json'
    resp: httpx.Response = httpx.get(
        endpoint,  headers=headers
    )
    if resp.status_code == 200:
        data = resp.json()
        print(json.dumps(data, indent=2))
    else:
        print('Failure!', resp.text)

    endpoint: str = 'https://api.x.com/1.1/blocks/list.json'
    cursor: int = -1
    with httpx.Client(headers=headers) as client:
        while True:
            resp: httpx.Response = client.get(
                endpoint, params=str(cursor)
            )
            if resp.status_code == 200:
                data = resp.json()
                cursor = data.get('next_cursor', 0)

                print(
                    f'Received {len(data.get('users', []))}, '
                    f'cursor is now {cursor}'
                )
                if not cursor:
                    break

                sleep(1)
            elif resp.status_code == 429:
                print(f'Rate limited, sleeping for 15 seconds: {resp.text}')
                sleep(15)
            else:
                print('Failure!', resp.text)
                break


if __name__ == '__main__':
    main()
