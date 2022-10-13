/**
 * @depends {brs.js}
 */
var BRS = (function(BRS, $, undefined) {
    BRS.newlyCreatedAccount = false;

    BRS.allowLoginViaEnter = function() {
        $("#login_password").keypress(function(e) {
            if (e.which === '13') {
                e.preventDefault();
                var password = $("#login_password").val();
                BRS.loginWithPassphrase(password);
            }
        });
    };

    BRS.showLoginOrWelcomeScreen = function() {
        if (BRS.hasLocalStorage && localStorage.getItem("logged_in")) {
            BRS.showLoginScreen();
        }
        else {
            BRS.showWelcomeScreen();
        }
    };

    BRS.showLoginScreen = function() {
        $("#account_phrase_custom_panel, #account_phrase_generator_panel, #welcome_panel, #custom_passphrase_link").hide();
        $("#account_phrase_custom_panel :input:not(:button):not([type=submit])").val("");
        $("#account_phrase_generator_panel :input:not(:button):not([type=submit])").val("");
        $("#login_panel").show();
        
        setTimeout(function() {
            $("#login_password").focus();
        }, 10);
    };

    BRS.showWelcomeScreen = function() {
        $("#login_panel, account_phrase_custom_panel, #account_phrase_generator_panel, #account_phrase_custom_panel, #welcome_panel, #custom_passphrase_link").hide();
        $("#welcome_panel").show();
    };

    BRS.registerUserDefinedAccount = function() {
        $("#account_phrase_generator_panel, #login_panel, #welcome_panel, #custom_passphrase_link").hide();
        $("#account_phrase_custom_panel :input:not(:button):not([type=submit])").val("");
        $("#account_phrase_generator_panel :input:not(:button):not([type=submit])").val("");
        $("#account_phrase_custom_panel").show();
        $("#registration_password").focus();
    };

    BRS.registerAccount = function() {
        $("#login_panel, #welcome_panel").hide();
        $("#account_phrase_generator_panel").show();
        $("#account_phrase_generator_panel .step_3 .callout").hide();

        var $loading = $("#account_phrase_generator_loading");
        var $loaded = $("#account_phrase_generator_loaded");

        if (window.crypto || window.msCrypto) {
            $loading.find("span.loading_text").html($.t("generating_passphrase_wait"));
        }

        $loading.show();
        $loaded.hide();

        if (typeof PassPhraseGenerator === "undefined") {
            $.when(
                $.getScript("js/crypto/3rdparty/seedrandom.min.js"),
                $.getScript("js/crypto/passphrasegenerator.js")
            ).done(function() {
                $loading.hide();
                $loaded.show();

                PassPhraseGenerator.generatePassPhrase("#account_phrase_generator_panel");
            }).fail(function(jqxhr, settings, exception) {
                alert($.t("error_word_list"));
            });
        }
        else {
            $loading.hide();
            $loaded.show();

            PassPhraseGenerator.generatePassPhrase("#account_phrase_generator_panel");
        }
    };

    BRS.verifyGeneratedPassphrase = function() {
        var password = $.trim($("#account_phrase_generator_panel .step_3 textarea").val());

        if (password !== PassPhraseGenerator.passPhrase) {
            $("#account_phrase_generator_panel .step_3 .callout").show();
        }
        else {
            BRS.newlyCreatedAccount = true;
            BRS.loginWithPassphrase(password);
            PassPhraseGenerator.reset();
            $("#account_phrase_generator_panel textarea").val("");
            $("#account_phrase_generator_panel .step_3 .callout").hide();
        }
    };

    BRS.evAccountPhraseCustomPanelSubmit = function(event) {
        event.preventDefault();

        var password = $("#registration_password").val();
        var repeat = $("#registration_password_repeat").val();

        var error = "";

        if (password.length < 35) {
            error = $.t("error_passphrase_length");
        }
        else if (password.length < 50 && (!password.match(/[A-Z]/) || !password.match(/[0-9]/))) {
            error = $.t("error_passphrase_strength");
        }
        else if (password !== repeat) {
            error = $.t("error_passphrase_match");
        }

        if (error) {
            $("#account_phrase_custom_panel .callout").first().removeClass("callout-info").addClass("callout-danger").html(error);
        }
        else {
            $("#registration_password, #registration_password_repeat").val("");
            BRS.loginWithPassphrase(password);
        }
    };

    BRS.loginCommon = function () {

        if (!BRS.settings.automatic_node_selection) {
            BRS.updateSettings("prefered_node", BRS.server);
        }

        const $valueSufix=document.querySelectorAll('[data-value-suffix]');
        for (const $each of $valueSufix){
            $each.innerText = BRS.valueSuffix
        }

        if (BRS.state) {
            BRS.checkBlockHeight();
        }

        BRS.getAccountInfo(true, BRS.cacheUserAssets);

        BRS.unlock();

        if (BRS.isOutdated) {
            $.notify($.t("brs_update_available"), {
                type: 'danger',
        offset: {
            x: 5,
            y: 60
            }
            });
        }

        if (!BRS.downloadingBlockchain) {
            BRS.checkIfOnAFork();
        }

        BRS.setupClipboardFunctionality();

        BRS.loadCachedAssets();

        BRS.checkLocationHash(BRS.getEncryptionPassword());

        $(window).on("hashchange", BRS.checkLocationHash);

        BRS.getInitialTransactions();
    };

    BRS.loginWithAccount = function(account) {
        account = account.trim();
        if (!account.length) {
            $.notify($.t("error_account_required_login"), {
                type: 'danger',
                offset: 10
            });
            return;
        }

        BRS.checkSelectedNode();

        BRS.sendRequest("getBlockchainStatus", function(response) {
            if (response.errorCode) {
                $.notify($.t("error_server_connect"), {
                    type: 'danger',
                    offset: 10
                });
                return;
            }

            BRS.state = response;

            let login
            if (BRS.rsRegEx.test(account) || BRS.idRegEx.test(account)) {
                login = account
            } else {
                const foundContact = BRS.getContactByName(account)
                if (foundContact) login = foundContact.accountRS
            }
            if (!login) {
                $.notify(
                    $.t("name_not_in_contacts", { name: account }),
                    { type: 'danger', offset: 10 }
                );
                return
            }

            // Get the account information for the given address
            BRS.sendRequest("getAccount", {
                "account": login
            }, function(response) {
                if (response.errorCode) {
                    if (BRS.rsRegEx.test(login) || BRS.idRegEx.test(login)) {
                        $.notify($.t("error_account_unknow_watch_only"), {
                            type: 'danger',
                            offset: { x: 5, y: 60 }
                        });
                        return;
                    }
                    // Otherwise, show an error.  The address is in the right format perhaps, but
                    // an address does not exist on the blockchain so there's nothing to see.
                    $.notify("<strong>" + $.t("warning") + "</strong>: " + response.errorDescription, {
                        type: 'danger',
                        offset: { x: 5, y: 60 }
                    });
                    return;
                }

                BRS.updateSettings("remember_account", $("#remember_account").is(":checked"));
                BRS.updateSettings("remember_account_account", account);

                BRS.account = response.account;
                BRS.accountRS = response.accountRS;
                BRS.publicKey = response.publicKey;
                BRS.accountRSExtended = response.accountRSExtended;

                $("#login_password, #login_account, #registration_password, #registration_password_repeat").val("");
                $("#login_check_password_length").val(1);
                $.notify($.t("success_login_watch_only"), {
                    type: 'success',
                    offset: { x: 5, y: 60 }
                });
                $("#account_id").html(String(BRS.accountRS).escapeHTML());

                BRS.loginCommon();
            });

        });
    }

    BRS.loginWithPassphrase = function(passphrase) {
        if (!passphrase.length) {
            $.notify($.t("error_passphrase_required_login"), {
                type: 'danger',
                offset: 10
            });
            return;
        }

        BRS.checkSelectedNode();

        if (!BRS.isTestNet && passphrase.length < 12 && $("#login_check_password_length").val() == 1) {
            $("#login_check_password_length").val(0);
            $("#login_error .callout").html($.t("error_passphrase_login_length"));
            $("#login_error").show();
            return;
        }

        BRS.updateSettings("remember_passphrase", $("#remember_password").is(":checked"));

        BRS.sendRequest("getBlockchainStatus", function(response) {
            if (response.errorCode) {
                $.notify($.t("error_server_connect"), {
                    type: 'danger',
                    offset: 10
                });
                return;
            }

            BRS.state = response;

            // Standard login logic
            // this is done locally..  'sendRequest' has special logic to prevent
            // transmitting the passphrase to the server unncessarily via BRS.getAccountId()
            BRS.sendRequest("getAccountId", {
                "secretPhrase": passphrase
            }, function(response) {
                // this hardcoded 'getAccountId' never returns errorCode.
                BRS.account = response.account;
                BRS.accountRS = response.accountRS;
                BRS.publicKey = BRS.getPublicKey(converters.stringToHexString(passphrase));
                BRS.accountRSExtended = BRS.accountRS + '-' + new BigNumber(BRS.publicKey, 16).toString(36).toUpperCase();

                BRS.sendRequest("getAccountPublicKey", {
                    "account": BRS.account
                }, function(response) {
                    if (response && response.publicKey && response.publicKey !== BRS.publicKey) {
                        $.notify($.t("error_account_taken"), {
                            type: 'danger',
                            offset: 10
                        });
                        return;
                    }

                    let passwordNotice = "";
                    if (passphrase.length < 35) {
                        passwordNotice = $.t("error_passphrase_length_secure");
                    } else if (passphrase.length < 50 && (!passphrase.match(/[A-Z]/) || !passphrase.match(/[0-9]/))) {
                        passwordNotice = $.t("error_passphrase_strength_secure");
                    }
                    if (passwordNotice) {
                        $.notify("<strong>" + $.t("warning") + "</strong>: " + passwordNotice, {
                            type: 'danger',
                            offset: { x: 5, y: 60 }
                        });
                    }

                    if ($("#remember_password").is(":checked")) {
                        BRS.rememberPassword = true;
                        $("#remember_password").prop("checked", false);
                        BRS.setPassword(passphrase);
                        $(".secret_phrase, .show_secret_phrase").hide();
                        $(".hide_secret_phrase").show();
                    }

                    $("#login_password, #login_account, #registration_password, #registration_password_repeat").val("");
                    $("#login_check_password_length").val(1);
                    $("#account_id").html(String(BRS.accountRS).escapeHTML());
            
                    BRS.loginCommon();
                });
            });
        });
    };

    BRS.evLoginButtonClick =  function (e) {
        e.preventDefault();

        const passwd = $("#login_password").val()
        if (passwd !== '') {
            BRS.loginWithPassphrase(passwd)
            return;
        }
        const account = $("#login_account").val()
        BRS.loginWithAccount(account)
    }

    BRS.showLockscreen = function() {
        if (BRS.hasLocalStorage && localStorage.getItem("logged_in")) {
            setTimeout(function() {
                $("#login_password").focus();
            }, 10);
        }
        else {
            BRS.showWelcomeScreen();
        }

        $("#lockscreen_loading").hide();
        $("#lockscreen_content").show();
    };

    BRS.unlock = function() {
        if (BRS.hasLocalStorage && !localStorage.getItem("logged_in")) {
            localStorage.setItem("logged_in", true);
        }

        $("#lockscreen").hide();
        $("body, html").removeClass("lockscreen");

        $("#login_error").html("").hide();

        $(document.documentElement).scrollTop(0);
    };

    BRS.logout = function() {
        BRS.setDecryptionPassword("");
        BRS.setPassword("");
        window.location.reload();
    };

    BRS.setPassword = function(password) {
        BRS.setEncryptionPassword(password);
        BRS.setServerPassword(password);
    };
    return BRS;
}(BRS || {}, jQuery));
