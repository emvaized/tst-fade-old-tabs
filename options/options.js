import { configs } from '../configs.js';

browser.storage.local.get().then(function (settingsStored) {
    Object.keys(settingsStored).forEach((key) => configs[key] = settingsStored[key]);

    Object.keys(configs).forEach(function (key) {
        let input = document.getElementById(key.toString());

        /// Set input value
        if (input !== null && input !== undefined) {
            input.setAttribute('value', configs[key]);

            /// Set translated label for input
            if (!input.parentNode.innerHTML.includes(chrome.i18n.getMessage(key))) {
                input.parentNode.innerHTML = chrome.i18n.getMessage(key) + '<br/>' + input.parentNode.innerHTML;
            }

            input = document.getElementById(key.toString());

            /// Set event listener
            input.addEventListener("input", function (e) {
                var id = input.getAttribute('id');
                let inputValue = input.value;
                configs[id] = inputValue;

                browser.storage.local.set(configs);
                browser.runtime.sendMessage({
                    updateFadedTabsConfigs: configs
                });
            });
        }
    });
});
