/**
 * @depends {brs.js}
 */
var BRS = (function(BRS, $, undefined) {
    BRS.fetchingModalData = false;

    // save the original function object
    var _superModal = $.fn.modal;

    // add locked as a new option
    $.extend(_superModal.Constructor.DEFAULTS, {
        locked: false
    });

    // capture the original hide
    var _hide = _superModal.Constructor.prototype.hide;

    // add the lock, unlock and override the hide of modal
    $.extend(_superModal.Constructor.prototype, {
        // locks the dialog so that it cannot be hidden
        lock: function() {
                this.options.locked = true;
                this.$element.addClass("locked");
            }
            // unlocks the dialog so that it can be hidden by 'esc' or clicking on the backdrop (if not static)
            ,
        unlock: function() {
            this.options.locked = false;
            this.$element.removeClass("locked");
        },
        // override the original hide so that the original is only called if the modal is unlocked
        hide: function() {
            if (this.options.locked) return;

            _hide.apply(this, arguments);
        }
    });

    BRS.evSpanRecipientSelectorClickButton = function(e) {
        if (!Object.keys(BRS.contacts).length) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        const $list = $(this).parent().find("ul");
        $list.empty();
        for (const accountId in BRS.contacts) {
            $list.append("<li><a href='#' data-contact='" + String(BRS.contacts[accountId].name).escapeHTML() + "'>" + String(BRS.contacts[accountId].name).escapeHTML() + "</a></li>");
        }
    }

    BRS.evSpanRecipientSelectorClickUlLiA = function(e) {
        e.preventDefault();
        $(this).closest("form").find("input[name=converted_account_id]").val("");
        $(this).closest(".input-group").find("input").not("[type=hidden]").val($(this).data("contact")).trigger("blur");
    };

    BRS.evAddRecipientsClick = function(e) {
        e.preventDefault();
        if ($("#send_money_same_out_checkbox").is(":checked")) {
            $("#multi_out_same_recipients").append($("#additional_multi_out_same_recipient").html()); //add input box
        } else {
            $("#multi_out_recipients").append($("#additional_multi_out_recipient").html()); //add input box
        }
        $("input[name=recipient_multi_out_same]").off('blur').on('blur', BRS.evMultiOutSameAmountChange);
        $('input[name=recipient_multi_out]').off('blur').on('blur', BRS.evMultiOutAmountChange);
        $('input[name=amount_multi_out]').off('blur').on('blur', BRS.evMultiOutAmountChange);
        $(".remove_recipient .remove_recipient_button").off('click').on("click", BRS.evDocumentOnClickRemoveRecipient);

        $("span.recipient_selector").on("click", "button", BRS.evSpanRecipientSelectorClickButton);
        $("span.recipient_selector").on("click", "ul li a", BRS.evSpanRecipientSelectorClickUlLiA);    };

    BRS.evDocumentOnClickRemoveRecipient = function(e) {
        e.preventDefault();
        $(this).parent().parent('div').remove();

        if ($("#send_money_same_out_checkbox").is(":checked")) {
            BRS.evMultiOutSameAmountChange()
        } else {
            BRS.evMultiOutAmountChange()
        }
    };

    BRS.evMultiOutAmountChange = function(e) {
        // get amount for each recipient
        let amount_total = 0;
        $("#multi_out_recipients .row").each(function(index, row) {
            const recipient = $(row).find('input[name=recipient_multi_out]').val()
            const value = $(row).find('input[name=amount_multi_out]').val()
            const current_amount = parseFloat(value, 10);
            const amount = isNaN(current_amount) ? 0 : (current_amount < 0.00000001 ? 0 : current_amount);
            if (recipient !== '') {
                amount_total += amount;
            }
        });
        const current_fee = parseFloat($("#multi_out_fee").val(), 10);
        const fee = BRS.checkMinimumFee(current_fee);
        // $("#multi_out_fee").val(fee.toFixed(8));
        amount_total += fee;

        $("#total_amount_multi_out").html(BRS.formatAmount(BRS.convertToNQT(amount_total)) + " " + BRS.valueSuffix);
};

    BRS.evMultiOutSameAmountChange = function() {
        let amount_total = 0;
        const current_amount = parseFloat($('#multi_out_same_amount').val(), 10);
        const current_fee = parseFloat($("#multi_out_fee").val(), 10);
        const amount = isNaN(current_amount) ? 0 : (current_amount < 0.00000001 ? 0 : current_amount);
        const fee = BRS.checkMinimumFee(current_fee);

        $("#multi_out_same_recipients input[name=recipient_multi_out_same]").each(function() {
            if ($(this).val() !== '') {
                amount_total += amount;
            }
        });
        amount_total += fee;

        $("#total_amount_multi_out").html(BRS.formatAmount(BRS.convertToNQT(amount_total)) + " " + BRS.valueSuffix);
    };

    BRS.evSameOutCheckboxChange = function(e) {
        $("#total_amount_multi_out").html("?");
        if ($(this).is(":checked")) {
            $("#multi_out_same_recipients").fadeIn();
            $("#row_multi_out_same_amount").fadeIn();
            $("#multi_out_recipients").hide();
            BRS.evMultiOutSameAmountChange()
        } else {
            $("#multi_out_same_recipients").hide();
            $("#row_multi_out_same_amount").hide();
            $("#multi_out_recipients").fadeIn();
            BRS.evMultiOutAmountChange()
        }
    };

    BRS.evMultiOutFeeChange = function(e) {
        if ($("#send_money_same_out_checkbox").is(":checked")) {
            BRS.evMultiOutSameAmountChange()
        } else {
            BRS.evMultiOutAmountChange()
        }
    };

    //hide modal when another one is activated.
    BRS.evModalOnShowBsModal = function(e) {
        var $inputFields = $(this).find("input[name=recipient], input[name=account_id]").not("[type=hidden]");

        $.each($inputFields, function() {
            if ($(this).hasClass("noMask")) {
                $(this).mask("BURST-****-****-****-*****", {
                    "noMask": true
                }).removeClass("noMask");
                $(this).mask("S-****-****-****-*****", {
                    "noMask": true
                }).removeClass("noMask");
            } else {
                // Removed due to implemetation of Signum (Quick fix)
                //$(this).mask("BURST-****-****-****-*****");
            }
        });

        var $visible_modal = $(".modal.in");

        if ($visible_modal.length) {
            if ($visible_modal.hasClass("locked")) {
                var $btn = $visible_modal.find("button.btn-primary:not([data-dismiss=modal])");
                BRS.unlockForm($visible_modal, $btn, true);
            } else {
                $visible_modal.modal("hide");
            }
        }

        $(this).find(".form-group").css("margin-bottom", "");
    };

    BRS.resetModalMultiOut = function () {
        $("#multi_out_recipients").empty();
        $("#multi_out_same_recipients").empty();
        $("#multi_out_same_recipients").hide();
        $("#row_multi_out_same_amount").hide();
        $("#multi_out_recipients").fadeIn();
        $("#multi_out_recipients").append($("#additional_multi_out_recipient").html());
        $("#multi_out_recipients").append($("#additional_multi_out_recipient").html());
        $("#multi_out_same_recipients").append($("#additional_multi_out_same_recipient").html());
        $("#multi_out_same_recipients").append($("#additional_multi_out_same_recipient").html());
        $("#multi_out_same_recipients input[name=recipient_multi_out_same]").off('blur').on('blur', BRS.evMultiOutSameAmountChange);
        $('#multi_out_recipients input[name=recipient_multi_out]').off('blur').on('blur', BRS.evMultiOutAmountChange);
        $('#multi_out_recipients input[name=amount_multi_out]').off('blur').on('blur', BRS.evMultiOutAmountChange);
        $("span.recipient_selector").on("click", "button", BRS.evSpanRecipientSelectorClickButton);
        $("span.recipient_selector").on("click", "ul li a", BRS.evSpanRecipientSelectorClickUlLiA);        
        $("#send_multi_out .remove_recipient").each(function() {
            $(this).remove();
        });
        $("#send_money_same_out_checkbox").prop('checked', false);
        $("#multi_out_fee").val(0.02);
        $("#multi_out_same_amount").val('');
        $("#send_ordinary").fadeIn();
        $("#send_multi_out").hide();
        if (!$(".ordinary-nav").hasClass("active")) {
            $(".ordinary-nav").addClass("active");
        }
        if ($(".multi-out-nav").toggleClass("active")) {
            $(".multi-out-nav").removeClass("active");
        }
    }

    //Reset form to initial state when modal is closed
    BRS.evModalOnHiddenBsModal = function(e) {
        BRS.resetModalMultiOut();

        // Multi-transfers
        $(".multi-transfer").hide();
        $(".transfer-asset").fadeIn();
        if (!$(".transfer-asset-nav").hasClass("active")) {
            $(".transfer-asset-nav").addClass("active");
        }
        if ($(".multi-transfer-nav").toggleClass("active")) {
            $(".multi-transfer-nav").removeClass("active");
        }
        $(this).find("span[name=transfer_asset_available]").each(function() {
            $(this).html('');
        })
        $(this).find("span[name=asset-name]").each(function() {
            $(this).html('?');
        })
        // End multi-transfers

        $(this).find("input[name=recipient], input[name=account_id]").not("[type=hidden]").trigger("unmask");

        $(this).find(":input:not(button)").each(function(index) {
            var defaultValue = $(this).data("default");
            var type = $(this).attr("type");
            var tag = $(this).prop("tagName").toLowerCase();

            if (type == "checkbox") {
                if (defaultValue == "checked") {
                    $(this).prop("checked", true);
                } else {
                    $(this).prop("checked", false);
                }
            } else if (type == "hidden") {
                if (defaultValue !== undefined) {
                    $(this).val(defaultValue);
                }
            } else if (tag == "select") {
                if (defaultValue !== undefined) {
                    $(this).val(defaultValue);
                } else {
                    $(this).find("option:selected").prop("selected", false);
                    $(this).find("option:first").prop("selected", "selected");
                }
            } else {
                if (defaultValue !== undefined) {
                    $(this).val(defaultValue);
                } else {
                    $(this).val("");
                }
            }
        });

        //Hidden form field
        $(this).find("input[name=converted_account_id]").val("");

        //Hide/Reset any possible error messages
        $(this).find(".callout-danger:not(.never_hide), .error_message, .account_info").html("").hide();

        $(this).find(".advanced").hide();

        $(this).find(".recipient_public_key").hide();

        $(this).find(".optional_message, .optional_note").hide();

        $(this).find(".advanced_info a").text($.t("advanced"));

        $(this).find(".advanced_extend").each(function(index, obj) {
            var normalSize = $(obj).data("normal");
            var advancedSize = $(obj).data("advanced");
            $(obj).removeClass("col-xs-" + advancedSize + " col-sm-" + advancedSize + " col-md-" + advancedSize).addClass("col-xs-" + normalSize + " col-sm-" + normalSize + " col-md-" + normalSize);
        });

        var $feeInput = $(this).find("input[name=feeNXT]");

        if ($feeInput.length) {
            var defaultFee = $feeInput.data("default");
            if (!defaultFee) {
                defaultFee = 1;
            }

            $(this).find(".advanced_fee").html(BRS.formatAmount(BRS.convertToNQT(defaultFee)) + " " + BRS.valueSuffix);
        }

        BRS.showedFormWarning = false;
    };

    BRS.showModalError = function(errorMessage, $modal) {
        var $btn = $modal.find("button.btn-primary:not([data-dismiss=modal], .ignore)");

        $modal.find("button").prop("disabled", false);

        $modal.find(".error_message").html(String(errorMessage).escapeHTML()).show();
        $btn.button("reset");
        $modal.modal("unlock");
    };

    BRS.closeModal = function($modal) {
        if (!$modal) {
            $modal = $("div.modal.in:first");
        }

        $modal.find("button").prop("disabled", false);

        var $btn = $modal.find("button.btn-primary:not([data-dismiss=modal], .ignore)");

        $btn.button("reset");
        $modal.modal("unlock");
        $modal.modal("hide");
    };

    BRS.evAdvancedInfoClick = function(e) {
        e.preventDefault();

        const $modal = $(this).closest(".modal");

        const text = $(this).text();

        if (text == $.t("advanced")) {
            $modal.find(".advanced").not(".optional_note").fadeIn();
        } else {
            $modal.find(".advanced").hide();
        }

        $modal.find(".advanced_extend").each(function(index, obj) {
            const normalSize = $(obj).data("normal");
            const advancedSize = $(obj).data("advanced");

            if (text == "advanced") {
                $(obj).addClass("col-xs-" + advancedSize + " col-sm-" + advancedSize + " col-md-" + advancedSize).removeClass("col-xs-" + normalSize + " col-sm-" + normalSize + " col-md-" + normalSize);
            } else {
                $(obj).removeClass("col-xs-" + advancedSize + " col-sm-" + advancedSize + " col-md-" + advancedSize).addClass("col-xs-" + normalSize + " col-sm-" + normalSize + " col-md-" + normalSize);
            }
        });

        if (text == $.t("advanced")) {
            $(this).text($.t("basic"));
        } else {
            $(this).text($.t("advanced"));
        }
    };

    return BRS;
}(BRS || {}, jQuery));
