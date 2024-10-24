import { SocialNetwork } from './social_network';

export const DEFAULT_LIST: string = 'https://byomod.org/lists/dathes.yaml'
export const EXTENSION_ID: string = 'eonknbiiibbeipnbhlgedahcbaeomnmj'

export const SOCIAL_NETWORKS_BY_DOMAIN: Map<string, SocialNetwork> = new Map(
    [
        ['x.com', new SocialNetwork('Twitter', 'x.com', true)],
        ['youtube.com', new SocialNetwork('YouTube', 'youtube.com')],
        ['facebook.com', new SocialNetwork('Facebook', 'facebook.com')],
        ['instagram.com', new SocialNetwork('Instagram', 'instagram.com')],
        ['tiktok.com', new SocialNetwork('TikTok', 'tiktok.com')],
        ['rumble.com', new SocialNetwork('Rumble', 'rumble.com')],
        ['parler.com', new SocialNetwork('Parler', 'parler.com')],
        ['gab.com', new SocialNetwork('Gab', 'gab.com')],
        ['mewe.com', new SocialNetwork('MeWe', 'mewe.com')],
        ['truthsocial.com', new SocialNetwork('Truth Social', 'truthsocial.com')],
        ['bitchute.com', new SocialNetwork('BitChute', 'bitchute.com')],
        ['telegram.org', new SocialNetwork('Telegram', 'telegram.org')],
        ['reddit.com', new SocialNetwork('Reddit', 'reddit.com')],
        ['bsky.com', new SocialNetwork('Bluesky', 'bsky.com')],
        ['threads.met', new SocialNetwork('Threads', 'threads.net')],
        ['mastodon.org', new SocialNetwork('Mastodon', 'mastodon.online')],
        ['twitch.com', new SocialNetwork('Twitch', 'twitch.com')],
        ['kick.com', new SocialNetwork('Kick', 'kick.com')],
        ['snapchat.com', new SocialNetwork('Snapchat', 'snapchat.com')],
        ['odysee.com', new SocialNetwork('Odysee', 'odysee.com')],
        ['discord.com', new SocialNetwork('Discord', 'discord.com')],
    ]
);

export const SOCIAL_NETWORKS_BY_PLATFORM: Map<string,SocialNetwork | undefined> = new Map(
    [
        ['twitter', SOCIAL_NETWORKS_BY_DOMAIN.get('x.com')],
        ['youtube', SOCIAL_NETWORKS_BY_DOMAIN.get('youtube.com')],
        ['facebook', SOCIAL_NETWORKS_BY_DOMAIN.get('facebook.com')],
        ['instagram', SOCIAL_NETWORKS_BY_DOMAIN.get('instagram.com')],
        ['tiktok', SOCIAL_NETWORKS_BY_DOMAIN.get('tiktok.com')],
        ['rumble', SOCIAL_NETWORKS_BY_DOMAIN.get('rumble.com')],
        ['parler', SOCIAL_NETWORKS_BY_DOMAIN.get('parler.com')],
        ['gab', SOCIAL_NETWORKS_BY_DOMAIN.get('gab.com')],
        ['mewe', SOCIAL_NETWORKS_BY_DOMAIN.get('mewe.com')],
        ['truthsocial', SOCIAL_NETWORKS_BY_DOMAIN.get('truthsocial.com')],
        ['bitchute', SOCIAL_NETWORKS_BY_DOMAIN.get('bitchute.com')],
        ['telegram', SOCIAL_NETWORKS_BY_DOMAIN.get('telegram.org')],
        ['reddit', SOCIAL_NETWORKS_BY_DOMAIN.get('reddit.com')],
        ['bluesky', SOCIAL_NETWORKS_BY_DOMAIN.get('bsky.com')],
        ['threads', SOCIAL_NETWORKS_BY_DOMAIN.get('threads.met')],
        ['mastodon', SOCIAL_NETWORKS_BY_DOMAIN.get('mastodon.org')],
        ['twitch', SOCIAL_NETWORKS_BY_DOMAIN.get('twitch.com')],
        ['kick', SOCIAL_NETWORKS_BY_DOMAIN.get('kick.com')],
        ['snapchat', SOCIAL_NETWORKS_BY_DOMAIN.get('snapchat.com')],
        ['odysee', SOCIAL_NETWORKS_BY_DOMAIN.get('odysee.com')],
        ['discord', SOCIAL_NETWORKS_BY_DOMAIN.get('discord.com')],
    ]
);