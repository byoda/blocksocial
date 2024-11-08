/**
 * @jest-environment jsdom
 */

const https = require('https');

import { describe, test, expect } from '@jest/globals';

import BlockList from './../../src/lib/list';
import {SOCIAL_NETWORKS_BY_DOMAIN} from '../../src/lib/constants';

const TestList: string = 'https://byomod.org/lists/dathes.yaml';
const TestFile: string = 'tests/collateral/content-moderation.yaml';


describe(
    'testing BlockList class', () => {
        test(
            'should return a BlockList', () => {
                const byo_list = new BlockList(
                    SOCIAL_NETWORKS_BY_DOMAIN['x.com'], TestList
                );
                expect(byo_list).toBeInstanceOf(ByoList);
            }
        );
        test(
            'should load BlockList from file', () => {
                const byo_list = new BlockList(TestList);
                expect(byo_list).toBeInstanceOf(ByoList);
                let entries: number = byo_list.from_file(TestFile);
                expect(entries).toBe(992);
                expect(byo_list.list!.block_list).toHaveLength(992);
            }
        );
        // jsdom does not support fetch. This
        // https://github.com/mswjs/jest-fixed-jsdom does but can't get it to
        // work
        // test(
        //     'should download BlockList from the network', async () => {
        //         const byo_list = new BlockList(
        //             SOCIAL_NETWORKS_BY_DOMAIN'x.com'], TestList
        //         );
        //         expect(byo_list).toBeInstanceOf(ByoList);
        //         await byo_list.download();
        //         expect(byo_list.list).toBeDefined();
        //         expect(byo_list.list!.block_list).toHaveLength(992);
        //     }
        // );
        test(
            'should load BlockList from file and store', async () => {
                const byo_list = new BlockList(
                    SOCIAL_NETWORKS_BY_DOMAIN.get('x.com'), TestList
                );
                expect(byo_list).toBeInstanceOf(ByoList);
                let entries: number = byo_list.from_file(TestFile);
                expect(entries).toBe(992);
                expect(byo_list.list!.block_list).toHaveLength(992);
                await byo_list.save();
            }
        );
        test(
            'should load BlockList from file and store and retrieve',
            async () => {
                const byo_list = new BlockList(TestList);
                expect(byo_list).toBeInstanceOf(ByoList);
                let entries: number = byo_list.from_file(TestFile);
                expect(entries).toBe(992);
                expect(byo_list.list!.block_list).toHaveLength(992);
                await byo_list.save();

                const new_list = new BlockList(TestList)
                let count: number = await new_list.load();
                expect(count).toBe(992);
                expect(new_list!.list!.block_list).toHaveLength(992);
            }
        );
    }
);