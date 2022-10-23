/**
 * @depends {brs.js}
 */
var BRS = (function(BRS, $, undefined) {
    BRS.confirmedFormWarning = false;

    BRS.forms = {};



    function getSuccessMessage(requestType) {
        var ignore = ["asset_exchange_change_group_name", "asset_exchange_group", "add_contact", "update_contact", "delete_contact",
            "send_message", "decrypt_messages", "generate_token", "send_money", "set_alias", "add_asset_bookmark", "sell_alias"
        ];

        if (ignore.indexOf(requestType) !== -1) {
            return "";
        } else {
            var key = "success_" + requestType;

            if ($.i18n.exists(key)) {
                return $.t(key);
            } else {
                return "";
            }
        }
    }

    function getErrorMessage(requestType) {
        const key = "error_" + requestType;

        if ($.i18n.exists(key)) {
            return $.t(key);
        } else {
            return "";
        }
    }

    BRS.addMessageData = function(data, requestType) {
        var encrypted;
        if (requestType === "sendMessage") {
            data.add_message = true;
        }

        if (!data.add_message && !data.add_note_to_self) {
            delete data.message;
            delete data.note_to_self;
            delete data.encrypt_message;
            delete data.add_message;
            delete data.add_note_to_self;

            return data;
        } else if (!data.add_message) {
            delete data.message;
            delete data.encrypt_message;
            delete data.add_message;
        } else if (!data.add_note_to_self) {
            delete data.note_to_self;
            delete data.add_note_to_self;
        }

        data._extra = {
            "message": data.message,
            "note_to_self": data.note_to_self
        };

        if (data.add_message && data.message) {
            if (data.encrypt_message) {
                try {
                    var options = {};

                    if (data.recipient) {
                        options.account = data.recipient;
                    } else if (data.encryptedMessageRecipient) {
                        options.account = data.encryptedMessageRecipient;
                        delete data.encryptedMessageRecipient;
                    }

                    if (data.recipientPublicKey) {
                        options.publicKey = data.recipientPublicKey;
                    }

                    encrypted = BRS.encryptNote(data.message, options, data.secretPhrase);

                    data.encryptedMessageData = encrypted.message;
                    data.encryptedMessageNonce = encrypted.nonce;
                    data.messageToEncryptIsText = "true";

                    delete data.message;
                } catch (err) {
                    throw err;
                }
            } else {
                data.messageIsText = "true";
            }
        } else {
            delete data.message;
        }

        if (data.add_note_to_self && data.note_to_self) {
            try {
                encrypted = BRS.encryptNote(data.note_to_self, {
                    "publicKey": converters.hexStringToByteArray(BRS.generatePublicKey(data.secretPhrase))
                }, data.secretPhrase);

                data.encryptToSelfMessageData = encrypted.message;
                data.encryptToSelfMessageNonce = encrypted.nonce;
                data.messageToEncryptToSelfIsText = "true";

                delete data.note_to_self;
            } catch (err) {
                throw err;
            }
        } else {
            delete data.note_to_self;
        }

        delete data.add_message;
        delete data.encrypt_message;
        delete data.add_note_to_self;

        return data;
    };

    function checkInvalidFormFields ($form) {
        let errorMessage = ''

        $form.find(":input").each(function () {
            if (!$(this).is(":invalid")) {
                return;
            }
            const name = String($(this).attr("name")).replace("NXT", "").replace("NQT", "").capitalize();
            const value = $(this).val();
            if ($(this).hasAttr("max")) {
                if (!/^[\-\d\.]+$/.test(value)) {
                    errorMessage = $.t("error_not_a_number", {
                        "field": BRS.getTranslatedFieldName(name).toLowerCase()
                    }).capitalize();
                    return
                } else {
                    const max = $(this).attr("max");
                    if (value > max) {
                        errorMessage = $.t("error_max_value", {
                            "field": BRS.getTranslatedFieldName(name).toLowerCase(),
                            "max": max
                        }).capitalize();
                        return
                    }
                }
            }
            if ($(this).hasAttr("min")) {
                if (!/^[\-\d\.]+$/.test(value)) {
                    errorMessage = $.t("error_not_a_number", {
                        "field": BRS.getTranslatedFieldName(name).toLowerCase()
                    }).capitalize();
                    return
                } else {
                    const min = $(this).attr("min");
                    if (value < min) {
                        errorMessage = $.t("error_min_value", {
                            "field": BRS.getTranslatedFieldName(name).toLowerCase(),
                            "min": min
                        }).capitalize();
                        return
                    }
                }
            }
            if (!errorMessage) {
                errorMessage = $.t("error_invalid_field", {
                    "field": BRS.getTranslatedFieldName(name).toLowerCase()
                }).capitalize();
            }
        })

        return errorMessage
    }

    /** Returns error message or empty string on success */
    function checkMerchantField(requestType, data) {
        if (requestType !== "sendMoney" && requestType !== "transferAsset") {
            return ""
        }
        let merchantInfo = data.merchant_info;
        const result = merchantInfo.match(/#merchant:(.*)#/i);
        if (result === null || result[1] === undefined) {
            return ""
        }
        let regexp;
        merchantInfo = $.trim(result[1]);
        if (!data.add_message || !data.message) {
            return $.t("info_merchant_message_required")
        }
        if (merchantInfo === "numeric") {
            merchantInfo = "[0-9]+";
        } else if (merchantInfo === "alphanumeric") {
            merchantInfo = "[a-zA-Z0-9]+";
        }
        let regexParts = merchantInfo.match(/^\/(.*?)\/(.*)$/);
        if (!regexParts) {
            regexParts = ["", merchantInfo, ""];
        }
        let strippedRegex = regexParts[1].replace(/^[\^\(]*/, "").replace(/[\$\)]*$/, "");
        if (regexParts[1].charAt(0) != "^") {
            regexParts[1] = "^" + regexParts[1];
        }
        if (regexParts[1].slice(-1) != "$") {
            regexParts[1] = regexParts[1] + "$";
        }
        if (regexParts[2].indexOf("i") !== -1) {
            regexp = new RegExp(regexParts[1], "i");
        } else {
            regexp = new RegExp(regexParts[1]);
        }
        if (regexp.test(data.message)) {
            // Message is OK!
            return ''
        }
        let regexType;
        let lengthRequirement = strippedRegex.match(/\{(.*)\}/);
        if (lengthRequirement) {
            strippedRegex = strippedRegex.replace(lengthRequirement[0], "+");
        }
        if (strippedRegex === "[0-9]+") {
            regexType = "numeric";
        } else if (strippedRegex === "[a-z0-9]+" || strippedRegex.toLowerCase() === "[a-za-z0-9]+" || strippedRegex === "[a-z0-9]+") {
            regexType = "alphanumeric";
        } else {
            regexType = "custom";
        }
        if (lengthRequirement) {
            let minLength, maxLength, requiredLength;
            if (lengthRequirement[1].indexOf(",") !== -1) {
                lengthRequirement = lengthRequirement[1].split(",");
                minLength = parseInt(lengthRequirement[0], 10);
                if (lengthRequirement[1]) {
                    maxLength = parseInt(lengthRequirement[1], 10);
                    return $.t("error_merchant_message_" + regexType + "_range_length", {
                        "minLength": minLength,
                        "maxLength": maxLength
                    });
                }
                return $.t("error_merchant_message_" + regexType + "_min_length", {
                    "minLength": minLength
                });
            }
            requiredLength = parseInt(lengthRequirement[1], 10);
            return $.t("error_merchant_message_" + regexType + "_length", {
                "length": requiredLength
            });
        }
        return $.t("error_merchant_message_" + regexType);
    }


    /** Function called when a submit button is clicked on modals.
     * Checks for all kinds of modals.
     * Specific modals are coded at BRS.forms.FORMNAME and form data
     * is passed as parameter.
     */
    BRS.submitForm = function($btn) {
        let formFunction
        let formErrorFunction
        let $form
        let data
        const $modal = $btn.closest(".modal");

        BRS.lockForm($modal, $btn)

        if ($btn.data("form")) {
            $form = $modal.find("form#" + $btn.data("form"));
            if (!$form.length) {
                $form = $modal.find("form:first");
            }
        } else {
            $form = $modal.find("form:first");
        }

        function endWithError(errorMsg) {
            $form.find(".error_message").html(errorMsg).show();
            if (formErrorFunction) {
                formErrorFunction(false, data);
            }
            BRS.unlockForm($modal, $btn);
            return
        }

        let requestType = $form.find("input[name=request_type]").val();
        const requestTypeKey = requestType.replace(/([A-Z])/g, function($1) {
            return "_" + $1.toLowerCase();
        });

        let successMessage = getSuccessMessage(requestTypeKey);
        let errorMessage = getErrorMessage(requestTypeKey);

        let errorStr = ''
        formFunction = BRS.forms[requestType];
        formErrorFunction = BRS.forms[requestType + "Error"];

        if (typeof formErrorFunction !== "function") {
            formErrorFunction = false;
        }

        const originalRequestType = requestType;

        if (BRS.downloadingBlockchain) {
            endWithError($.t("error_blockchain_downloading"))
            return;
        } else if (BRS.state.isScanning) {
            endWithError($.t("error_form_blockchain_rescanning"))
            return;
        }

        errorStr = checkInvalidFormFields($form)
        if (errorStr) {
            endWithError(errorStr)
            return;
        }

        data = BRS.getFormData($form);

        if (typeof formFunction === "function") {
            const output = formFunction(data);
            if (output.error) {
                endWithError(output.error.escapeHTML())
                return;
            }
            if (output.requestType) {
                requestType = output.requestType;
            }
            if (output.data) {
                data = output.data;
            }
            if ("successMessage" in output) {
                successMessage = output.successMessage;
            }
            if ("errorMessage" in output) {
                errorMessage = output.errorMessage;
            }
            if (output.stop) {
                BRS.unlockForm($modal, $btn, true);
                return;
            }
        }

        if (data.recipient) {
            data.recipient = $.trim(data.recipient);
            if (BRS.idRegEx.test(data.recipient) === false && 
                BRS.rsRegEx.test(data.recipient) === false) {
                if (data.converted_account_id && (BRS.idRegEx.test(data.converted_account_id) || BRS.rsRegEx.test(data.converted_account_id))) {
                    data.recipient = data.converted_account_id;
                    data._extra = {
                        "convertedAccount": true
                    };
                } else {
                    endWithError($.t("error_account_id"))
                    return;
                }
            }
        }

        errorStr = checkMerchantField(requestType, data)
        if (errorStr) {
            endWithError(errorStr);
            return;
        }

        try {
            data = BRS.addMessageData(data, requestType);
        } catch (err) {
            errorStr = err.message
            if (!errorStr) {
                errorStr = err
            }
            endWithError(String(errorStr).escapeHTML())
            return;
        }

        if (data.deadline) {
            data.deadline = String(data.deadline * 60); //hours to minutes
        }
        
        if (data.doNotBroadcast) {
            data.broadcast = "false";
            delete data.doNotBroadcast;
            if (data.secretPhrase === "") {
                delete data.secretPhrase;
            }
        }

        if ("secretPhrase" in data && !data.secretPhrase.length && !BRS.rememberPassword) {
            endWithError($.t("error_passphrase_required"))
            return;
        }

        if ("amountNXT" in data && data.amountNXT === "") {
            data.amountNXT = "0";
        }

        if (!BRS.showedFormWarning) {
            if ("amountNXT" in data && BRS.settings.amount_warning && BRS.settings.amount_warning !== "0") {
                if (new BigInteger(BRS.convertToNQT(data.amountNXT)).compareTo(new BigInteger(BRS.settings.amount_warning)) > 0) {
                    BRS.showedFormWarning = true;
                    endWithError($.t("error_max_amount_warning", {
                        "burst": BRS.formatAmount(BRS.settings.amount_warning),
                        "valueSuffix": BRS.valueSuffix
                    }));
                    return;
                }
            }

            if ("feeNXT" in data && BRS.settings.fee_warning && BRS.settings.fee_warning !== "0") {
                if (new BigInteger(BRS.convertToNQT(data.feeNXT)).compareTo(new BigInteger(BRS.settings.fee_warning)) > 0) {
                    BRS.showedFormWarning = true;
                    endWithError($.t("error_max_fee_warning", {
                        "burst": BRS.formatAmount(BRS.settings.fee_warning),
                        "valueSuffix": BRS.valueSuffix
                    }));
                    return;
                }
            }
        }

        delete data.request_type;
        delete data.converted_account_id;
        delete data.merchant_info;

        BRS.sendRequest(requestType, data, function(response) {
            //todo check again.. response.error
            var formCompleteFunction;
            if (response.fullHash) {
                BRS.unlockForm($modal, $btn);

                if (!$modal.hasClass("modal-no-hide")) {
                    $modal.modal("hide");
                }

                if (successMessage) {
                    $.notify(successMessage.escapeHTML(), { type: 'success' });
                }

                formCompleteFunction = BRS.forms[originalRequestType + "Complete"];

                if (requestType !== "parseTransaction") {
                    if (typeof formCompleteFunction === "function") {
                        data.requestType = requestType;

                        if (response.transaction) {
                            BRS.addUnconfirmedTransaction(response.transaction, function(alreadyProcessed) {
                                response.alreadyProcessed = alreadyProcessed;
                                formCompleteFunction(response, data);
                            });
                        } else {
                            response.alreadyProcessed = false;
                            formCompleteFunction(response, data);
                        }
                    } else {
                        BRS.addUnconfirmedTransaction(response.transaction);
                    }
                } else {
                    if (typeof formCompleteFunction === "function") {
                        data.requestType = requestType;
                        formCompleteFunction(response, data);
                    }
                }

                if (BRS.accountInfo && !BRS.accountInfo.publicKey) {
                    $("#dashboard_message").hide();
                }
            } else if (response.errorCode) {
                $form.find(".error_message").html(response.errorDescription.escapeHTML()).show();

                if (formErrorFunction) {
                    formErrorFunction(response, data);
                }

                BRS.unlockForm($modal, $btn);
            } else {
                var sentToFunction = false;

                if (!errorMessage) {
                    formCompleteFunction = BRS.forms[originalRequestType + "Complete"];

                    if (typeof formCompleteFunction === 'function') {
                        sentToFunction = true;
                        data.requestType = requestType;

                        BRS.unlockForm($modal, $btn);

                        if (!$modal.hasClass("modal-no-hide")) {
                            $modal.modal("hide");
                        }
                        formCompleteFunction(response, data);
                    } else {
                        errorMessage = $.t("error_unknown");
                    }
                }

                if (!sentToFunction) {
                    BRS.unlockForm($modal, $btn, true);

                    $.notify(errorMessage.escapeHTML(), { type: 'danger' });
                }
            }
        });
    };

    BRS.forms.addCommitment = function (data) {
        let requestType = 'addCommitment'
        if (data.removeCommitment) {
            requestType = 'removeCommitment';
            delete data.removeCommitment;
        }
        return {
            requestType,
            data
        }
    };

    BRS.lockForm = function ($modal, $btn) {
        $modal.modal("lock");
        $modal.find("button").prop("disabled", true);
        $btn.button("loading");
    }

    BRS.unlockForm = function($modal, $btn, hide) {
        $modal.find("button").prop("disabled", false);
        if ($btn) {
            $btn.button("reset");
        }
        $modal.modal("unlock");
        if (hide) {
            $modal.modal("hide");
        }
    };

    return BRS;
}(BRS || {}, jQuery));
