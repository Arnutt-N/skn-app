# Rich menus overview

Learn about the rich menus you can display in chat rooms your LINE Official Account is participating in:

## What is rich menu 

Rich menus are the menus displayed at the bottom of a chat room with a LINE Official Account. Set rich menus with links to external sites, reservation pages, and LINE Official Account features to make your user experience more "rich". Use [tools to create rich menus](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#choosing-tool-for-creating-rich-menus) based on the [rich menu structure](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#rich-menu-structure).

<!-- note start -->

**Rich menus are unavailable on LINE for PC**

Rich menus aren't displayed on LINE for PC (macOS, Windows).

<!-- note end -->

## Rich menu structure 

Rich menus are composed of a menu image, tappable areas, and a chat bar.

![](https://developers.line.biz/media/messaging-api/rich-menu/bot-demo-rich-menu-image.png)

1. Rich menu image: A single JPEG or PNG image file that has menu items. For more information about image requirements, see [Requirements for rich menu image](https://developers.line.biz/en/reference/messaging-api/#upload-rich-menu-image-requirements) in the Messaging API reference.
1. Tappable areas: Areas you divide as menu items. Assign an [action](https://developers.line.biz/en/reference/messaging-api/#action-objects) on each menu item, such as getting a postback event and opening a URL.
1. Chat bar: A menu that opens and closes the rich menu. You can customize the text of this menu.

## Tools for setting rich menus 

To create rich menus, use [LINE Official Account Manager](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#creating-a-rich-menu-with-the-line-manager) or the [Messaging API](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#creating-a-rich-menu-using-the-messaging-api). Find which tool best suits your needs.

<!-- note start -->

**Only one tool for one rich menu**

You can't use both tools to retrieve or edit the same instance of rich menu. A rich menu created with the LINE Official Account Manager is retrievable and editable only through the LINE Official Account Manager. Likewise, you can't use the LINE Official Account Manager on the rich menu created with the Messaging API.

<!-- note end -->

| Tool | Benefits |
| --- | --- |
| [LINE Official Account Manager](https://manager.line.biz/) | <ul><li>Fast development time</li><li>Easy-to-use graphical interface</li><li>Display period is available</li><li>Statistics such as display count and click-through rate are available</li></ul><p>For more information, see [How to use the rich menus](https://www.lycbiz.com/jp/column/line-official-account/technique/20180731-01/) (only available in Japanese) and [Insight - Rich menus](https://www.lycbiz.com/jp/manual/OfficialAccountManager/insight_rich-menus/) (only available in Japanese) in LINE for Business.</p> |
| Messaging API | <ul><li>Advanced customization</li><li>You can set [postback action](https://developers.line.biz/en/reference/messaging-api/#postback-action) and [datetime picker action](https://developers.line.biz/en/reference/messaging-api/#datetime-picker-action) on a rich menu.</li><li>You can [switch between tabs on rich menus](https://developers.line.biz/en/docs/messaging-api/switch-rich-menus/).</li></ul><p>If you want to try out rich menu features, see [Play with rich menus](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/).</p> |

You can't get statistics like display count and click-through rate with Messaging API rich menus.

### Set rich menus with LINE Official Account Manager 

You can create and set a rich menu as default from the LINE Official Account Manager. Users see the default rich menu unless a different rich menu is set with a higher [display priority](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#rich-menu-display).

Using the GUI of the LINE Official Account Manager, you can set tappable areas of a rich menu based on predefined templates. For more information, see the [LINE Official Account Manager manual](https://www.lycbiz.com/jp/manual/OfficialAccountManager/rich-menus/) (only available in Japanese).

### Set rich menus with the Messaging API 

To set a rich menu with the Messaging API, the required endpoints must be called in sequence. The basic steps are as follows:

1. Prepare a rich menu image.
1. Use the [Create rich menu](https://developers.line.biz/en/reference/messaging-api/#create-rich-menu) endpoint.
1. Use the [Upload rich menu image](https://developers.line.biz/en/reference/messaging-api/#upload-rich-menu-image) endpoint.
1. Use the [Set default rich menu](https://developers.line.biz/en/reference/messaging-api/#set-default-rich-menu) endpoint.

For more information on how to set a rich menu with the Messaging API, see [Use rich menus](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/).

## Scope of rich menus 

Rich menus have two scopes, which you can set using different tools.

| Scope | Tool |
| --- | --- |
| All users who opened the chat screen of the LINE Official Account (Default rich menu) | <ul><li>LINE Official Account Manager</li><li>Messaging API</li></ul> |
| Per user (Per-user rich menu) | Messaging API |

Depending on the scope and the setting tool, the display priority of the rich menu and the timing of when the change takes effect on the user's chat screen will vary.

- [Display priority of rich menus](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#rich-menu-display)
- [When rich menu setting changes take effect](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#when-setting-change-takes-effect)

### Display priority of rich menus 

Three types of rich menus are available, different by how you set them and who they target. The display priority of the types are the order they are listed, from the highest to the lowest:

1. Per-user rich menu set with the Messaging API
1. Default rich menu set with the Messaging API
1. Default rich menu set with the [LINE Official Account Manager](https://manager.line.biz)

### When rich menu setting changes take effect 

When you change the settings of a rich menu, the change takes place at different timings, depending on the scope and the setting tool of the rich menu.

| Scope and setting tool | When change takes effect |
| --- | --- |
| Per-user rich menu set with the Messaging API | Immediately. But if you delete the rich menu without [unlinking it from the user](https://developers.line.biz/en/reference/messaging-api/#unlink-rich-menu-from-user), the deletion takes effect when the user re-opens the chat. |
| Default rich menu set with the Messaging API | When the user re-opens the chat. It may take up to a minute until the change takes effect. |
| Default rich menu set with the LINE Official Account Manager | When the user re-opens the chat |

### When users who are not friends with your LINE Official Account open the chat screen 

When users who are not friends with your LINE Official Account open the chat screen, the default rich menu set in the LINE Official Account manager or with the Messaging API will be displayed.

Note that you can't link a rich menu to a user who are not friends with your LINE Official Account. For more information, see [Conditions for linking rich menu](https://developers.line.biz/en/reference/messaging-api/#link-rich-menu-to-user-conditions) in the Messaging API reference.

## Rich menu API reference 

- [Rich menu](https://developers.line.biz/en/reference/messaging-api/#rich-menu)
- [Per-user rich menu](https://developers.line.biz/en/reference/messaging-api/#per-user-rich-menu)
- [Rich menu alias](https://developers.line.biz/en/reference/messaging-api/#rich-menu-alias)


# Use rich menus

This page explains how to set up a "default rich menu" that will be displayed to all users who have added your LINE official accounts as friends.

<!-- tip start -->

**Rich menus can also be set with LINE Official Account Manager**

You can also set a default rich menu from [LINE Official Account Manager](https://manager.line.biz/). For more information, see [Set rich menus with LINE Official Account Manager](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#creating-a-rich-menu-with-the-line-manager).

<!-- tip end -->

<!-- table of contents -->

## Set default rich menu 

To set a default rich menu with the Messaging API:

1. [Prepare a rich menu image](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/#prepare-a-rich-menu-image).
1. [Create a rich menu](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/#create-a-rich-menu) and specify tappable areas.
1. [Upload and attach the rich menu image](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/#upload-the-rich-menu-image).
1. [Set the default rich menu](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/#set-the-default-rich-menu).

### 1. Prepare a rich menu image 

Prepare a rich menu image. You need to think about how you'll place the tap area on the rich menu image.

Here we use the following template image (`richmenu-template-guide-04.png`) for the rich menu. Save it in any directory.

![The template image for rich menus used in this guide](https://developers.line.biz/media/messaging-api/rich-menu/richmenu-template-guide-04.png)

In the case of this image, it's assumed that three tap areas, A, B, and C, are defined.

<!-- tip start -->

**Rich menu template images**

You can download a template image for your rich menu from the [LINE Official Account Manager](https://manager.line.biz). From the page you create rich menus, click **Design guide**. You can log in to the LINE Official Account Manager with the same account you use for the [LINE Developers Console](https://developers.line.biz/console/).

<!-- tip end -->

For more information about image requirements, see [Requirements for rich menu image](https://developers.line.biz/en/reference/messaging-api/#upload-rich-menu-image-requirements) in the Messaging API reference.

### 2. Create a rich menu 

Create a rich menu that matches the rich menu image we prepared in step 1. Make sure that the tap areas are correctly set to A, B, and C in the image.

When you [create a rich menu with the Messaging API](https://developers.line.biz/en/reference/messaging-api/#create-rich-menu), specify a [rich menu object](https://developers.line.biz/en/reference/messaging-api/#rich-menu-object) in the request body. Run this command in your terminal. The [URI action](https://developers.line.biz/en/reference/messaging-api/#uri-action) is specified to open different URLs in each of the A, B, and C tap areas.

```sh
curl -v -X POST https://api.line.me/v2/bot/richmenu \
-H 'Authorization: Bearer {channel access token}' \
-H 'Content-Type: application/json' \
-d \
'{
    "size": {
        "width": 2500,
        "height": 1686
    },
    "selected": false,
    "name": "Test the default rich menu",
    "chatBarText": "Tap to open",
    "areas": [
        {
            "bounds": {
                "x": 0,
                "y": 0,
                "width": 1666,
                "height": 1686
            },
            "action": {
                "type": "uri",
                "label": "Tap area A",
                "uri": "https://developers.line.biz/en/news/"
            }
        },
        {
            "bounds": {
                "x": 1667,
                "y": 0,
                "width": 834,
                "height": 843
            },
            "action": {
                "type": "uri",
                "label": "Tap area B",
                "uri": "https://lineapiusecase.com/en/top.html"
            }
        },
        {
            "bounds": {
                "x": 1667,
                "y": 844,
                "width": 834,
                "height": 843
            },
            "action": {
                "type": "uri",
                "label": "Tap area C",
                "uri": "https://techblog.lycorp.co.jp/en/"
            }
        }
    ]
}'
```

<!-- tip start -->

**Tip**

- To automatically open a rich menu linked to a user, set the `selected` property in the request body to `true`.
- To set the text of the chat bar, specify the `chatBarText` property in the request body.
- Before creating a rich menu, you can [check the validity](https://developers.line.biz/en/reference/messaging-api/#validate-rich-menu-object) of the [rich menu object](https://developers.line.biz/en/reference/messaging-api/#rich-menu-object).

<!-- tip end -->

If the rich menu was created successfully, the rich menu ID is returned in the response. We'll use the rich menu ID in the following steps.

```json
{
  "richMenuId": "richmenu-88c05..."
}
```

### 3. Upload and attach the rich menu image 

[Upload and attach the image](https://developers.line.biz/en/reference/messaging-api/#upload-rich-menu-image) you prepared in step 1 to the rich menu you created in step 2. In your terminal, run the following command:

1. Move to the directory that contains the image you prepared in step 1.
1. Run this command after replacing `{richMenuId}` with the rich menu ID you obtained in step 2.

```sh
curl -v -X POST https://api-data.line.me/v2/bot/richmenu/{richMenuId}/content \
-H "Authorization: Bearer {channel access token}" \
-H "Content-Type: image/png" \
-T richmenu-template-guide-04.png
```

### 4. Set the default rich menu 

Now that we've completed the preparations, let's set the display of the rich menu. Here, [set a default rich menu](https://developers.line.biz/en/reference/messaging-api/#set-default-rich-menu). Users who are friends with your LINE Official Account sees the default rich menu, unless the user isn't linked to a per-user rich menu. Run this command in your terminal.

```sh
curl -v -X POST https://api.line.me/v2/bot/user/all/richmenu/{richMenuId} \
-H "Authorization: Bearer {channel access token}"
```

#### 4-1. Check the rich menu displa 

Check that the default rich menu set is displayed. Open the chat screen of the LINE Official Account for which you've set the rich menu. The rich menu created this time is displayed in a closed state, tap **Tap to open** to open the rich menu.

![](https://developers.line.biz/media/messaging-api/rich-menu/default-rich-menu-example.png)

## About per-user rich menu 

You can set a rich menu on a per-user basis using the Messaging API. For more information on per-user rich menus, see [Use per-user rich menus](https://developers.line.biz/en/docs/messaging-api/use-per-user-rich-menus/).


# Use per-user rich menus

This page explains how to set up a "per-user rich menu".

<!-- table of contents -->

## What is per-user rich menu 

You can set a rich menu on a per-user basis using the Messaging API. Therefore, it's possible to enhance the user experience by preparing multiple rich menus and setting a different rich menu for each user.

The per-user rich menu has the following characteristics:

1. Display priority is higher than the default rich menu
   - The per-user rich menu has a higher display priority than the default rich menu. Therefore, if you've set a default rich menu for a LINE Official Account and you set a per-user rich menu for a user, the per-user rich menu will take precedence over the default rich menu. For more information, see [Display priority of rich menus](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#rich-menu-display).
1. Setting changes take effect immediately
   - The per-user rich menu setting takes effect immediately and changes the display without the user having to re-enter the chat screen. For more information, see [When rich menu setting changes take effect](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#when-setting-change-takes-effect).

## Set a per-user rich menu 

The basic setup for the per-user rich menu is as follows:

1. [Create a rich menu and attach an image](https://developers.line.biz/en/docs/messaging-api/use-per-user-rich-menus/#create-a-rich-menu)
1. [Prepare a user ID](https://developers.line.biz/en/docs/messaging-api/use-per-user-rich-menus/#prepare-user-id)
1. [Link the rich menu to the user](https://developers.line.biz/en/docs/messaging-api/use-per-user-rich-menus/#link-the-rich-menu-to-user)
1. [Unlink the rich menu from the user](https://developers.line.biz/en/docs/messaging-api/use-per-user-rich-menus/#unlink-the-rich-menu-from-user) to stop displaying the per-user rich menu (optional)

### 1. Create a rich menu and attach an image 

First, create a rich menu. For more information on how to create a rich menu, see [Use rich menus](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/).

Here we use the following template image (`richmenu-template-guide-07.png`) for the rich menu. Save it on any directory.

![The template image for rich menus used in this guide](https://developers.line.biz/media/messaging-api/rich-menu/richmenu-template-guide-07.png)

Run this command in your terminal, to [create a rich menu](https://developers.line.biz/en/reference/messaging-api/#create-rich-menu):

```sh
curl -v -X POST https://api.line.me/v2/bot/richmenu \
-H 'Authorization: Bearer {channel access token}' \
-H 'Content-Type: application/json' \
-d \
'{
    "size": {
        "width": 2500,
        "height": 1686
    },
    "selected": true,
    "name": "Test the per-user rich menu",
    "chatBarText": "Tap to open",
    "areas": [
        {
            "bounds": {
                "x": 0,
                "y": 0,
                "width": 2500,
                "height": 1686
            },
            "action": {
                "type": "uri",
                "label": "Tap area A",
                "uri": "https://developers.line.biz/en/news/"
            }
        }
    ]
}'
```

Next, run this command in your terminal to [upload and attach an image to the rich menu](https://developers.line.biz/en/reference/messaging-api/#upload-rich-menu-image).

```sh
curl -v -X POST https://api-data.line.me/v2/bot/richmenu/{richMenuId}/content \
-H "Authorization: Bearer {channel access token}" \
-H "Content-Type: image/png" \
-T richmenu-template-guide-07.png
```

### 2. Prepare a user ID 

Prepare the user ID of a user who will display the rich menu. Here, prepare your own user ID to actually check the display.

Example of user ID: `U8189cf6745fc0d808977bdb0b9f22995`

For more information on getting user IDs, see [Developer gets their own user ID](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/#get-own-user-id) on [Get user IDs](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/).

### 3. Link the rich menu to the user 

Once the rich menu and your user ID are ready, [link the rich menu to the user](https://developers.line.biz/en/reference/messaging-api/#link-rich-menu-to-user). Run this command in your terminal.

```sh
curl -v -X POST https://api.line.me/v2/bot/user/{userId}/richmenu/{richMenuId} \
-H "Authorization: Bearer {channel access token}"
```

#### 3-1. Check the rich menu display 

Check that the per-user rich menu set in step 3 is displayed. Open the chat screen of the LINE Official Account for which you've set the rich menu.

![](https://developers.line.biz/media/messaging-api/rich-menu/per-user-rich-menu-example.png)

### 4. Unlink the rich menu from the user 

Finally, [unlink the rich menu from the user](https://developers.line.biz/en/reference/messaging-api/#unlink-rich-menu-from-user) and stop displaying the rich menu. Run this command in your terminal while displaying the chat screen opened in step 4.

```sh
curl -v -X DELETE https://api.line.me/v2/bot/user/{userId}/richmenu \
-H 'Authorization: Bearer {channel access token}'
```

The per-user rich menu display ends when execution is complete because the per-user rich menu setting takes effect immediately.

Note that if the default rich menu is set, the default rich menu will be displayed instead.

## Allow users to switch between rich menus 

You can provide users with a rich menu with tab switching using per-user rich menus. To switch between rich menus with ease, like switching between tabs, use [rich menu aliases](https://developers.line.biz/en/glossary/#rich-menu-alias) and [rich menu switch action](https://developers.line.biz/en/reference/messaging-api/#richmenu-switch-action).

![](https://developers.line.biz/media/messaging-api/rich-menu/switching-richmenu-ja.png)

For more information, see [Switch between tabs on rich menus](https://developers.line.biz/en/docs/messaging-api/switch-rich-menus/).


# Use per-user rich menus

This page explains how to set up a "per-user rich menu".

<!-- table of contents -->

## What is per-user rich menu 

You can set a rich menu on a per-user basis using the Messaging API. Therefore, it's possible to enhance the user experience by preparing multiple rich menus and setting a different rich menu for each user.

The per-user rich menu has the following characteristics:

1. Display priority is higher than the default rich menu
   - The per-user rich menu has a higher display priority than the default rich menu. Therefore, if you've set a default rich menu for a LINE Official Account and you set a per-user rich menu for a user, the per-user rich menu will take precedence over the default rich menu. For more information, see [Display priority of rich menus](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#rich-menu-display).
1. Setting changes take effect immediately
   - The per-user rich menu setting takes effect immediately and changes the display without the user having to re-enter the chat screen. For more information, see [When rich menu setting changes take effect](https://developers.line.biz/en/docs/messaging-api/rich-menus-overview/#when-setting-change-takes-effect).

## Set a per-user rich menu 

The basic setup for the per-user rich menu is as follows:

1. [Create a rich menu and attach an image](https://developers.line.biz/en/docs/messaging-api/use-per-user-rich-menus/#create-a-rich-menu)
1. [Prepare a user ID](https://developers.line.biz/en/docs/messaging-api/use-per-user-rich-menus/#prepare-user-id)
1. [Link the rich menu to the user](https://developers.line.biz/en/docs/messaging-api/use-per-user-rich-menus/#link-the-rich-menu-to-user)
1. [Unlink the rich menu from the user](https://developers.line.biz/en/docs/messaging-api/use-per-user-rich-menus/#unlink-the-rich-menu-from-user) to stop displaying the per-user rich menu (optional)

### 1. Create a rich menu and attach an image 

First, create a rich menu. For more information on how to create a rich menu, see [Use rich menus](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/).

Here we use the following template image (`richmenu-template-guide-07.png`) for the rich menu. Save it on any directory.

![The template image for rich menus used in this guide](https://developers.line.biz/media/messaging-api/rich-menu/richmenu-template-guide-07.png)

Run this command in your terminal, to [create a rich menu](https://developers.line.biz/en/reference/messaging-api/#create-rich-menu):

```sh
curl -v -X POST https://api.line.me/v2/bot/richmenu \
-H 'Authorization: Bearer {channel access token}' \
-H 'Content-Type: application/json' \
-d \
'{
    "size": {
        "width": 2500,
        "height": 1686
    },
    "selected": true,
    "name": "Test the per-user rich menu",
    "chatBarText": "Tap to open",
    "areas": [
        {
            "bounds": {
                "x": 0,
                "y": 0,
                "width": 2500,
                "height": 1686
            },
            "action": {
                "type": "uri",
                "label": "Tap area A",
                "uri": "https://developers.line.biz/en/news/"
            }
        }
    ]
}'
```

Next, run this command in your terminal to [upload and attach an image to the rich menu](https://developers.line.biz/en/reference/messaging-api/#upload-rich-menu-image).

```sh
curl -v -X POST https://api-data.line.me/v2/bot/richmenu/{richMenuId}/content \
-H "Authorization: Bearer {channel access token}" \
-H "Content-Type: image/png" \
-T richmenu-template-guide-07.png
```

### 2. Prepare a user ID 

Prepare the user ID of a user who will display the rich menu. Here, prepare your own user ID to actually check the display.

Example of user ID: `U8189cf6745fc0d808977bdb0b9f22995`

For more information on getting user IDs, see [Developer gets their own user ID](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/#get-own-user-id) on [Get user IDs](https://developers.line.biz/en/docs/messaging-api/getting-user-ids/).

### 3. Link the rich menu to the user 

Once the rich menu and your user ID are ready, [link the rich menu to the user](https://developers.line.biz/en/reference/messaging-api/#link-rich-menu-to-user). Run this command in your terminal.

```sh
curl -v -X POST https://api.line.me/v2/bot/user/{userId}/richmenu/{richMenuId} \
-H "Authorization: Bearer {channel access token}"
```

#### 3-1. Check the rich menu display 

Check that the per-user rich menu set in step 3 is displayed. Open the chat screen of the LINE Official Account for which you've set the rich menu.

![](https://developers.line.biz/media/messaging-api/rich-menu/per-user-rich-menu-example.png)

### 4. Unlink the rich menu from the user 

Finally, [unlink the rich menu from the user](https://developers.line.biz/en/reference/messaging-api/#unlink-rich-menu-from-user) and stop displaying the rich menu. Run this command in your terminal while displaying the chat screen opened in step 4.

```sh
curl -v -X DELETE https://api.line.me/v2/bot/user/{userId}/richmenu \
-H 'Authorization: Bearer {channel access token}'
```

The per-user rich menu display ends when execution is complete because the per-user rich menu setting takes effect immediately.

Note that if the default rich menu is set, the default rich menu will be displayed instead.

## Allow users to switch between rich menus 

You can provide users with a rich menu with tab switching using per-user rich menus. To switch between rich menus with ease, like switching between tabs, use [rich menu aliases](https://developers.line.biz/en/glossary/#rich-menu-alias) and [rich menu switch action](https://developers.line.biz/en/reference/messaging-api/#richmenu-switch-action).

![](https://developers.line.biz/media/messaging-api/rich-menu/switching-richmenu-ja.png)

For more information, see [Switch between tabs on rich menus](https://developers.line.biz/en/docs/messaging-api/switch-rich-menus/).


# Play with rich menus

Rich Menu Playground is a LINE Official Account where you can test rich menu features. This account is serviced only in Japanese. You can get your hands on rich menu features, such as date selection with the [datetime picker action](https://developers.line.biz/en/reference/messaging-api/#datetime-picker-action) and switching between rich menus with [rich menu aliases](https://developers.line.biz/en/docs/messaging-api/switch-rich-menus/).

<!-- tip start -->

**Why use rich menu?**

Visit [LINE API Use Case](https://lineapiusecase.com/en/api/msgapi.html) and learn the benefits of rich menus, from the perspective of service providers and end users.

<!-- tip end -->

![Rich Menu Playground main screen](https://developers.line.biz/media/messaging-api/rich-menu-playground/richmenu-playground-bot-overview.png)

## Add Rich Menu Playground 

Add Rich Menu Playground as a friend to your LINE account, to test rich menu features. You have different ways to add Rich Menu Playground as instructed below.

<!-- tip start -->

**Use Rich Menu Playground on smartphone**

Rich menus aren't displayed on LINE for PC (macOS, Windows). Use a smartphone to try Rich Menu Playground.

<!-- tip end -->

| Add through | How to add |
| --- | --- |
| URL | Open [https://lin.ee/7ALASDvA](https://lin.ee/7ALASDvA) on your smartphone browser and add. |
| QR code | Scan this QR code for Rich Menu Playground and add. [^qrcode]</br></br>![QR code of Rich Menu Playground](https://qr-official.line.me/sid/M/976nukmg.png) |
| ID | Search for the ID `@try_richmenu` from LINE and add the account.[^search-line-id] |

[^qrcode]: Learn [how to add a friend via link or QR code](https://guide.line.me/ja/friends-and-groups/add-qrurl.html) (only available in Japanese) in the LINE user's guide.
[^search-line-id]: Learn [how to add a friend from ID search](https://guide.line.me/ja/friends-and-groups/search-line-id.html) (only available in Japanese) in the LINE user's guide.

## Common features of Rich Menu Playground 

If you added Rich Menu Playground as a friend, now you can try the actions set on the rich menus. Learn the [layout of the rich menus](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/#main-rich-menu) and how to check the [action detail](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/#message-from-rich-menu-playground) after you try an action.

### Rich menu layout 

The rich menus of Rich Menu Playground have four main components:

1. Tabs: Contains menus to try different actions.
2. Navigation button: Moves between tab groups.
3. Action button: Triggers the action set on the button. If an action requires parameters, a parameter gets a button each for you to try.
4. Help button: Opens the document for the target action.

![Main Menu](https://developers.line.biz/media/messaging-api/rich-menu-playground/menu-descriptions.png)

### Action detail 

When you trigger an action, Rich Menu Playground does the action and then shows you the detail of the action you triggered. This helps you to know that the action was triggered, especially when the action doesn't render any visual result. The action detail includes the description of the action, action settings (parameters) and the webhook events the LINE Platform sent to the bot server.

![Message after the action is executed](https://developers.line.biz/media/messaging-api/rich-menu-playground/message.png)

## Actions available on Rich Menu Playground 

With Rich Menu Playground you can test:

- [Message action](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/#try-message-action)
- [Postback action (1)](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/#try-postback-1-action)
- [Postback action (2)](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/#try-postback-2-action)
- [Postback action (3)](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/#try-postback-3-action)
- [URI action](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/#try-uri-action)
- [Datetime picker action](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/#try-datetime-picker-action)
- [Rich menu switch action](https://developers.line.biz/en/docs/messaging-api/try-rich-menu/#try-richmenu-switch-action)

### Test message action 

This tab lets you trigger a [message action](https://developers.line.biz/en/reference/messaging-api/#message-action) to send a message from the rich menu.

![Try Message Action](https://developers.line.biz/media/messaging-api/rich-menu-playground/01-message-action-ja.png)

<!-- tip start -->

**Message action**

When a user sends a message through the rich menu in a chat with your LINE Official Account, the LINE Platform sends a corresponding [message event](https://developers.line.biz/en/reference/messaging-api/#message-event) to your bot server. Your bot server can then send a [reply message](https://developers.line.biz/en/reference/messaging-api/#send-reply-message) with the reply token returned through the message event.

<!-- tip end -->

| Button label | Action | Action object |
| --- | --- | --- |
| Send message | Sends a message | `{"type":"message", "label":"メッセージを送信する","text":"message sent successfully!"}` |

### Test postback action (1) 

This tab lets you trigger a [postback action](https://developers.line.biz/en/reference/messaging-api/#postback-action) from the rich menu. When you trigger this action, the LINE Platform sends the bot server a [postback event](https://developers.line.biz/en/reference/messaging-api/#postback-event) with the string specified in the `data` property of the postback action object.

![Try Postback Action (1)](https://developers.line.biz/media/messaging-api/rich-menu-playground/02-postback-action-ja.png)

<!-- tip start -->

**Postback action**

When a user taps on a rich menu with a [postback action](https://developers.line.biz/en/reference/messaging-api/#postback-action), the LINE Platform sends a [postback event](https://developers.line.biz/en/reference/messaging-api/#postback-event) to your bot server. This postback event has the string you specify in the `data` property of the postback action.

The content you specify in the `data` property is not shown to the user. This guarantees that data such as unique parameters and identifiers is sent securely to your bot server. You can send a [response message](https://developers.line.biz/en/reference/messaging-api/#send-reply-message) with the reply token you get from the postback event.

<!-- tip end -->

| Button label | Action | Action object |
| --- | --- | --- |
| With `displayText` | Triggers a postback action and shows a text in the chat | `{"type":"postback","label":"ディスプレイテキストあり","data":"actionId=21","displayText":"ディスプレイテキストです。トーク画面に表示されます。"}` |
| No `displayText` | Triggers a postback action and shows no text in the chat | `{"type":"postback","label":"ディスプレイテキストなし","data":"actionId=22"}` |

<!-- tip start -->

**Text in the chat (displayText)**

To show text in a chat as a message from the user when a postback action is triggered, specify the `displayText` property in the postback action object. The text is displayed in the chat but not sent as a [message event](https://developers.line.biz/en/reference/messaging-api/#message-event) to the bot server.

<!-- tip end -->

### Test postback action (2) 

In this tab you can try the [postback actions](https://developers.line.biz/en/reference/messaging-api/#postback-action) of opening and closing the rich menu. When the postback action is executed, a [postback event](https://developers.line.biz/en/reference/messaging-api/#postback-event) containing the string specified in the `data` property is sent from the LINE Platform to the bot server.

![Try Postback Action (2)](https://developers.line.biz/media/messaging-api/rich-menu-playground/02-2-postback-action-ja.png)

| Button label | Action | Action object |
| --- | --- | --- |
| Open rich menu | Executes a postback action with `inputOption:openRichMenu` set. | `{"type":"postback","label":"リッチメニューを開く","data":"actionId=","inputOption":"openRichMenu"}` |
| Close rich menu | Executes a postback action with `inputOption:closeRichMenu` set. | `{"type":"postback","label":"リッチメニューを閉じる","data":"actionId=","inputOption":"closeRichMenu"}` |

### Test postback action (3) 

In this tab, you can try out the rich menu with [postback actions](https://developers.line.biz/en/reference/messaging-api/#postback-action) set to open keyboard and voice message input modes. Once the postback action is executed, a [postback event](https://developers.line.biz/en/reference/messaging-api/#postback-event) containing the string specified in the `data` property is sent from the LINE Platform to the bot server.

![Try Postback Action (3)](https://developers.line.biz/media/messaging-api/rich-menu-playground/02-3-postback-action-ja.png)

| Button label | Action | Action object |
| --- | --- | --- |
| Open keyboard | Executes a postback action with `inputOption:openKeyboard` set. | `{"type":"postback","label":"キーボードを開く","data":"actionId=","inputOption":"openKeyboard"}` |
| Open keyboard with fillinText | Executes a postback action with `inputOption:openKeyboard` and `fillInText` set. | `{"type":"postback","label":"キーボードを開くフィルインテキストあり","data":"actionId=","inputOption":"openKeyboard","fillInText":"---\予約番号: \予約メニュー番号: \n予約日時: \n---"}` |
| Open voice message input mode | Executes a postback action with `inputOption:openVoice` set. | `{"type":"postback","label":"ボイスメッセージ入力モードを開く","data":"actionId=","inputOption":"openVoice"}` |

### Test URI Action 

In this tab, you can trigger a [URI action](https://developers.line.biz/en/reference/messaging-api/#uri-action) from the rich menu. When you trigger this action, the `uri` set for the action is opened in a web browser.

![Try URI action](https://developers.line.biz/media/messaging-api/rich-menu-playground/03-uri-action-ja.png)

| Button label | Action | Action object |
| --- | --- | --- |
| Open a URL | Opens the specified URI | `{"type":"uri","label":"URLを開く","uri":"https://developers.line.biz/docs/messaging-api/actions/#uri-action"}` |
| Open in an external browser | Opens the URI in an [external browser](https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/#opening-url-in-external-browser) (`openExternalBrowser=0`) | `{"type":"uri","label":"外部ブラウザで開く","uri":"https://developers.line.biz/docs/messaging-api/actions/?openExternalBrowser=1#uri-action"}` |
| Open in a Chrome custom tab (Android only) | Opens the URI in the [in-app browser](https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/#opening-url-in-external-browser), if supported (`openInAppBrowser=0`) | `{"type":"uri","label":"Chromeカスタムタブで開く","uri":"https://developers.line.biz/docs/messaging-api/actions/?openInAppBrowser=0#uri-action"}` |
| Check configuration (The white buttons) | Doesn't open a URI but shows you the values set in the URI action object | Not applicable |

<!-- tip start -->

**About openInAppBrowser**

The `openInAppBrowser` parameter opens LINE's in-app browser only in LINE for Android. For the specification on the `openInAppBrowser` parameter, see [Opening a URL in an external browser](https://developers.line.biz/en/docs/messaging-api/using-line-url-scheme/#opening-url-in-external-browser).

<!-- tip end -->

### Test datetime picker action 

In this tab, you can trigger a [datetime picker action](https://developers.line.biz/en/reference/messaging-api/#datetime-picker-action) from the rich menu. When you trigger this action, the date and time selection dialog is displayed. Once you select a date, the LINE Platform sends your bot server a [postback event](https://developers.line.biz/en/reference/messaging-api/#postback-event) with selected date and time.

![Try Datetime Picker Action](https://developers.line.biz/media/messaging-api/rich-menu-playground/04-datetime-picker-action-ja.png)

| Button label | Action | Action object |
| --- | --- | --- |
| Date and time selection (datetime mode) | Opens the date time picker set to the current date and time (`mode` set to `datetime`) | `{"type":"datetimepicker","label":"datetimeモード","data":"actionId=31","mode":"datetime"}` |
| With initial value set (with `initial` property) | Opens the date time picker set to the value of the `initial` property | `{"type":"datetimepicker","label":"初期値設定あり","data":"actionId=32","initial:"2021-11-01t00:00","mode":"datetime"}` |
| With max and min values set (with `min`, `max` properties) | Opens the date time picker with min and max dates set | `{"type":"datetimepicker","label":"最大・最小値設定あり","data":"actionId=33","mode":"datetime","max":"2021-12-31t23:59","min":"2021-11-01t00:00"}` |
| Select date (date mode) | Opens the date time picker set to the current date | `{"type":"datetimepicker","label":"dateモード","data":"actionId=34","mode":"date"}` |
| Select time (time mode) | Opens the date time picker set to the current time | `{"type":"datetimepicker","label":"timeモード","data":"actionId=35","mode":"time"}` |

### Test rich menu switch action 

In this tab, you can trigger a [rich menu switch action](https://developers.line.biz/en/reference/messaging-api/#richmenu-switch-action) from the rich menu. When you trigger this action, the rich menu is switched to the menu defined in [rich menu aliases](https://developers.line.biz/en/docs/messaging-api/switch-rich-menus/). When the rich menu is switched, the LINE Platform sends your bot server a [postback event](https://developers.line.biz/en/reference/messaging-api/#postback-event). This event has values you specify for the `data` property and `postback.params` object in the postback action object.

![Try Rich Menu Switching Action](https://developers.line.biz/media/messaging-api/rich-menu-playground/05-rich-menu-switch-action-ja.png)

| Button label | Action | Action object |
| --- | --- | --- |
| Switch rich menu | Switches the rich menu | `{"type":"richmenuswitch","label":"リッチメニューを切り替える","richMenuAliasId":"richmenu-richmenuswitch_2","data":"actionId=42"}` |
| Switch rich menu to a smaller size | Switches the rich menu to the smaller size specified by the `height` of the `size` property in the rich menu object | `{"type":"richmenuswitch","label":"小さいサイズのリッチメニューに切り替える","richMenuAliasId":"richmenu-richmenuswitch_3","data":"actionId=43"}` |
