import { Client } from 'twitter.js'

import {BlockedUsersBook} from 'twitter.js'
import { TwitterApi } from 'twitter-api-v2';


const my_user_id = '2250704250'
const my_handle = 'Byoda_org'
// let jwt = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
let jwt = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"


// const client = new Client();

// await client.loginWithBearerToken(jwt)
// console.log(`Client ready: ${client.me}`);

// const user = await client.users.fetchByUsername(my_handle);
// console.log(`User: ${JSON.stringify(user)}`);

// let book = new BlockedUsersBook(client, {max_results_per_page: 10, user: 'Byoda_org'})
// console.log(JSON.stringify(book))

const twitterClient = new TwitterApi(jwt);
const readOnlyClient = twitterClient.readOnly;
// const user = await readOnlyClient.v2.userByUsername(my_handle);
// const user = await twitterClient.currentUser()
// const user = await readOnlyClient.v2.userByUsername('jack', {'user.fields': 'username'});
// console.log(`User: ${JSON.stringify(user)}`);



//
// Failed attempt with GraphQL
//
// let auth_token = await load_auth_tokens()
// auth_token.graphql_token = 'sOj2N04S8Mbza3y5M3fOIg'
// const blocks_url = `https://x.com/i/api/graphql/${auth_token.graphql_token}/BlockedAccountsAll?variables={"count":20,"includePromotedContent":false}&features={"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"communities_web_enable_tweet_community_results_fetch":true,"c9s_tweet_anatomy_moderator_badge_enabled":true,"articles_preview_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":true,"tweet_awards_web_tipping_enabled":false,"creator_subscriptions_quote_tweet_preview_enabled":false,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"rweb_video_timestamps_enabled":true,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"responsive_web_enhance_cards_enabled":false}`
// let resp: Response = await fetch(
//     blocks_url,
//     {
//         method: 'GET',
//         headers: {
//             'Authorization': auth_token.jwt,
//             'X-Csrf-Token': auth_token.csrf_token,
//             'X-Twitter-Auth-Type': 'OAuth2Session',
//             'x-twitter-active-user': 'yes',
//             'Content-Type': 'application/json',
//             'Cookie': 'guest_id=172858272774389411; night_mode=2; guest_id_marketing=v1%3A172858272774389411; guest_id_ads=v1%3A172858272774389411; kdt=cle6SNxzBpiJ2BJbeWhGhLZQnohJnsEvAoruTudP; auth_token=da0f018d0b02064ef73dd1fe65208d1516b00a77; ct0=71b2a5982d2d016f1a61e1f83cefda588ef072a63b67c9f27201d8281208a1d390bc7f45bf876ef019f50a8c075d456c17ebb7029d3502c3098c5f0d609bf8dc8a0dc32ff54cf59adc72762d1ace4dd5; twid=u%3D2250704250; personalization_id="v1_AM4k/PVTBhDabYKjx68g5A=="; lang=en',

//         }
//     }
// )
// if (resp.status !== 200) {
//     console.error('Failed to fetch blocks: ', resp.status)
//     return
// }