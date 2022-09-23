/**
 * @depends {brs.js}
 */
var BRS = (function(BRS, $, undefined) {
    BRS.defaultSettings = {
        "submit_on_enter": 0,
        "news": -1,
        "console_log": 0,
        "fee_warning": "100000000000",
        "amount_warning": "10000000000000",
        "asset_transfer_warning": "10000",
        "24_hour_format": 1,
        "remember_passphrase": 0,
        "remember_account": 0,
        "prefered_node": "",
        "language": "en"
    };

    BRS.pages.settings = function() {
        for (const key in BRS.settings) {
            if (/_warning/i.test(key) && key != "asset_transfer_warning") {
                if ($("#settings_" + key).length) {
                    $("#settings_" + key).val(BRS.convertToNXT(BRS.settings[key]));
                }
            }
            else if (!/_color/i.test(key)) {
                if ($("#settings_" + key).length) {
                    $("#settings_" + key).val(BRS.settings[key]);
                }
            }
        }

        if (BRS.settings.news != -1) {
            $("#settings_news_initial").remove();
        }

        if (BRS.inApp) {
            $("#settings_console_log_div").hide();
        }

        BRS.pageLoaded();
    };

    BRS.getSettings = function() {
        if (BRS.databaseSupport) {
            BRS.database.select("data", [{
                "id": "settings"
            }], function(error, result) {
                if (result && result.length) {
                    BRS.settings = $.extend({}, BRS.defaultSettings, JSON.parse(result[0].contents));
                } else {
                    BRS.database.insert("data", {
                        id: "settings",
                        contents: "{}"
                    });
                    BRS.settings = BRS.defaultSettings;
                }
                BRS.applySettings();
            });
        } else {
            BRS.settings = BRS.defaultSettings;
            BRS.applySettings();
        }
    };

    BRS.applySettings = function(key) {
        if (!key || key == "language") {
            $.i18n.setLng(BRS.settings.language, null, function() {
                $("[data-i18n]").i18n();
            });
            if (BRS.inApp) {
                parent.postMessage({
                    "type": "language",
                    "version": BRS.settings.language
                }, "*");
            }
        }

        if (!key || key == "submit_on_enter") {
            if (BRS.settings.submit_on_enter) {
                $(".modal form:not('#decrypt_note_form_container')").on("submit.onEnter", function(e) {
                    e.preventDefault();
                    BRS.submitForm($(this).closest(".modal"));
                });
            } else {
                $(".modal form").off("submit.onEnter");
            }
        }

        if (!key || key == "news") {
            if (BRS.settings.news === 0) {
                $("#news_link").hide();
            } else if (BRS.settings.news == 1) {
                $("#news_link").show();
            }
        }

        if (!key || key == "console_log") {
            if (BRS.inApp) {
                $("#show_console").hide();
            } else {
                if (BRS.downloadingBlockchain || BRS.settings.console_log === 0) {
                    $("#show_console").hide();
                } else {
                    $("#show_console").show();
                }
            }
            }

        if (!key || key == "prefered_node") {
            $("#prefered_node").val(BRS.settings.prefered_node);
        }

        if (key == "24_hour_format") {
            var $dashboard_dates = $("#dashboard_transactions_table a[data-timestamp], #dashboard_blocks_table td[data-timestamp]");
            $.each($dashboard_dates, function(key, value) {
                $(this).html(BRS.formatTimestamp($(this).data("timestamp")));
            });
        }

        if (!key || key == "remember_passphrase") {
            if (BRS.settings.remember_passphrase) {
                $("#remember_password").prop("checked", true);
            } else {
                $("#remember_password").prop("checked", false);
            }
        }

        if (!key || key == "remember_account") {
            if (BRS.settings.remember_account) {
                $("#remember_account").prop("checked", true);
                $("#login_account").val(BRS.settings.remember_account_account);
            } else {
                $("#remember_account").prop("checked", false);
                $("#login_account").val("");
            }
        }
    };

    BRS.updateSettings = function(key, value) {
        if (key) {
            BRS.settings[key] = value;
        }

        if (BRS.databaseSupport) {
            BRS.database.update("data", {
                contents: JSON.stringify(BRS.settings)
            }, [{
                id: "settings"
            }]);
        }

        BRS.applySettings(key);
    };

    $("#settings_box select").on("change", function(e) {
        e.preventDefault();

        var key = $(this).attr("name");
        var value = $(this).val();

        BRS.updateSettings(key, value);
    });

    $("#settings_box input[type=text]").on("input", function(e) {
        var key = $(this).attr("name");
        var value = $(this).val();

        if (/_warning/i.test(key) && key != "asset_transfer_warning") {
            value = BRS.convertToNQT(value);
        }
        BRS.updateSettings(key, value);
    });

    return BRS;
}(BRS || {}, jQuery));
