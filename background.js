'use strict';

import { configs } from './configs.js';
const kTST_ID = 'treestyletab@piro.sakura.ne.jp';

browser.runtime.onMessageExternal.addListener((aMessage, aSender) => {
    switch (aSender.id) {
        case kTST_ID:
            switch (aMessage.type) {
                case 'ready':
                    init();
                    break;
            }
            break;
    }
});

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if ("updateFadedTabsConfigs" in request) {
        applyConfigs(request["updateFadedTabsConfigs"]);
        applyFadeToTabs();
    }
});

async function registerToTST(css) {
    try {
        const self = await browser.management.getSelf();

        let success = await browser.runtime.sendMessage(kTST_ID, {
            type: 'register-self',
            name: self.id,
            style: css,
        });

        return success;
    } catch (e) {
        // TST is not available
    }
}

function init() {
    /// Load settings
    browser.storage.local.get().then(function (settingsStored) {
        applyConfigs(settingsStored);

        /// Register CSS
        let css = `
        .tab.recent-tab { opacity: ${configs.recentTabsOpacity} !important; }
        .tab.older-tab { opacity: ${configs.olderTabOpacity} !important; }
        .tab.oldest-tab { opacity: ${configs.oldestTabOpacity} !important; }
        `;

        registerToTST(css).then(res => {
            browser.tabs.onActivated.addListener(applyFadeToTabs);
            applyFadeToTabs();
        });
    });
}

init();

function applyConfigs(settingsStored) {
    if (settingsStored !== undefined)
        Object.keys(settingsStored).forEach((key) => configs[key] = settingsStored[key]);
}

async function applyFadeToTabs() {
    const recentTabs = [], olderTabs = [], oldestTabs = [];
    const lastRecentTabIndex = parseInt(configs.recentTabsAmount);
    const lastOlderTabIndex = parseInt(configs.recentTabsAmount) + parseInt(configs.olderTabsAmount);

    const sortedTabs = await getSortedWinTabs();
    const allTabsIDs = [];

    for (let i = 0, l = sortedTabs.length; i < l; i++) {
        const tabId = sortedTabs[i].id;
        allTabsIDs.push(tabId);

        if (i >= 0 && i < lastRecentTabIndex) {
            recentTabs.push(tabId);
        } else if (i >= lastRecentTabIndex && i < lastOlderTabIndex) {
            olderTabs.push(tabId);
        } else {
            oldestTabs.push(tabId);
        }
    }

     /// Reset opacity states for all tabs
     browser.runtime.sendMessage(kTST_ID, {
        type: 'remove-tab-state',
        tabs: allTabsIDs,
        state: ['recent-tab', 'older-tab', 'oldest-tab']
    });

    /// Apply opacity states
    browser.runtime.sendMessage(kTST_ID, {
        type: 'add-tab-state',
        tabs: recentTabs,
        state: 'recent-tab',
    });

    browser.runtime.sendMessage(kTST_ID, {
        type: 'add-tab-state',
        tabs: olderTabs,
        state: 'older-tab',
    });

    browser.runtime.sendMessage(kTST_ID, {
        type: 'add-tab-state',
        tabs: oldestTabs,
        state: 'oldest-tab',
    });
}

async function getSortedWinTabs() {
    const tabs = await browser.tabs.query({ currentWindow: true });
    tabs.sort((a, b) => (a.lastAccessed < b.lastAccessed ? 1 : -1));
    return tabs;
}