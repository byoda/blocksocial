import type {IBlockEntry, ISocialAccountListStat} from './datatypes';

export default class BlockEntry {
    first_name: string
    last_name: string
    business_name: string
    business_type: string
    status: string
    languages: string[]
    categories: string[]
    annotations: string[]
    urls: string[]
    social_accounts: Map<string,ISocialAccountListStat[]>
    twitter_handle: string | undefined
    youtube_handle: string | undefined
    tiktok_handle: string | undefined

    constructor(entry: IBlockEntry) {
        this.first_name = entry.first_name;
        this.last_name = entry.last_name;
        this.business_name = entry.business_name;
        this.business_type = entry.business_type;
        this.status = entry.status;
        this.languages = entry.languages;
        this.annotations = entry.annotations;
        this.urls = entry.urls;
        this.categories = entry.categories;

        this.social_accounts = new Map<string,ISocialAccountListStat[]>();
        for (let account_object of entry.social_accounts) {
            let platform: string | undefined = account_object.platform.toLowerCase();
            if (platform === undefined) {
                continue;
            }
            if (!this.social_accounts.has(platform)) {
                this.social_accounts.set(platform, []);
            }
            this.social_accounts.get(platform)!.push(account_object);
        }
        this.twitter_handle = this.get_primary_account('twitter')?.handle;
        this.youtube_handle = this.get_primary_account('youtube')?.handle;
        this.tiktok_handle = this.get_primary_account('tiktok')?.handle;
    }

    get_primary_account(platform: string): ISocialAccountListStat | undefined {
        if (! this.social_accounts.has(platform)) {
            return undefined
        }
        for (let account of this.social_accounts.get(platform)!) {
            if (account.is_primary) {
                return account;
            }
        }
        return this.social_accounts.get(platform)![0];
    }

    get_accounts(platform: string): ISocialAccountListStat[] {
        if (! this.social_accounts.has(platform)) {
            return []
        }
        return this.social_accounts.get(platform)!
    }
}