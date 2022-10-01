/**
 * @depends {brs.js}
 */

 var BRS = (function(BRS, $, undefined) {

    BRS.addEventListeners = function() {

        // from brs.js
        $("#prefered_node").on("blur", function() {
            BRS.getState(null);
        });
        $("#start_settings_language").on("change", function(e) {
            e.preventDefault();
            const value = $(this).val();
            BRS.updateSettings("language", value);
        });
        $("#logo, .sidebar-menu a").click(BRS.logoSidebarClick);
        $("button.goto-page, a.goto-page").click(function(event) {
            event.preventDefault();
    
            BRS.goToPage($(this).data("page"));
        });
        $(".data-pagination").on("click", "a", function(e) {
            e.preventDefault();
    
            BRS.goToPageNumber($(this).data("page"));
        });
        $("#id_search").on("submit", BRS.evIdSearchSubmit);

        // from brs.forms.js
        $(".modal form input").keydown(function(e) {
            if (e.which === "13") {
                e.preventDefault();
                if (BRS.settings.submit_on_enter && e.target.type !== "textarea") {
                    $(this).submit();
                } else {
                    return false;
                }
            }
        });
        $(".modal button.btn-primary:not([data-dismiss=modal]):not([data-ignore=true])").click(function() {
            // ugly hack - this whole ui is hack, got a big urge to vomit
            if ($(this)[0].id === "sign_message_modal_button") { // hack hackity hack!
                BRS.forms.signModalButtonClicked();
            } else if (!$(this).hasClass("multi-out")) {
                BRS.submitForm($(this).closest(".modal"), $(this));
            }
        });

        // from brs.login.js
        $("#account_phrase_custom_panel form").submit(BRS.evAccountPhraseCustomPanelSubmit);

        // from brs.recipient.js
        $("#send_message_modal, #send_money_modal, #add_contact_modal").on("show.bs.modal", function(e) {
            const $invoker = $(e.relatedTarget);
            let account = $invoker.data("account");
            if (!account) {
                account = $invoker.data("contact");
            }
            if (account) {
                const $inputField = $(this).find("input[name=recipient], input[name=account_id]").not("[type=hidden]");
                if (!/BURST\-/i.test(account)) {
                    $inputField.addClass("noMask");
                }
                $inputField.val(account).trigger("checkRecipient");
            }
            BRS.sendMoneyCalculateTotal($(this));
        });
        $("#commitment_modal").on("show.bs.modal", function(e) {
            const $invoker = $(e.relatedTarget);
            let account = $invoker.data("account");
            if (!account) {
                account = $invoker.data("contact");
            }
            if (account) {
                const $inputField = $(this).find("input[name=recipient], input[name=account_id]").not("[type=hidden]");
                if (!/BURST\-/i.test(account)) {
                    $inputField.addClass("noMask");
                }
                $inputField.val(account).trigger("checkRecipient");
            }
            BRS.commitmentCalculateTotal($(this));
        });
        $("#commitment_amount, #commitment_fee").on("change", function(e) {
            BRS.commitmentCalculateTotal($(this));
        });
        $("#send_money_amount, #send_money_fee").on("change", function(e) {
            BRS.sendMoneyCalculateTotal($(this));
        });
        //todo later: http://twitter.github.io/typeahead.js/
        $("span.recipient_selector button").on("click", function(e) {
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
        });
        $("span.asset_selector button").on("click", function(e) {
            const $list = $(this).parent().find("ul");
            $list.empty();
            if (!BRS.accountInfo.assetBalances) {
                $list.append("<li>no-assets</li>");
                return;
            }
            BRS.sortCachedAssets()
            for (const asset of BRS.assets) {
                const foundAsset = BRS.accountInfo.assetBalances.find((tkn) => tkn.asset === asset.asset)
                if (foundAsset) {
                    $list.append(`<li><a href='#' data-name='${asset.name}' data-asset='${asset.asset}' data-decimals='${asset.decimals}'>${asset.name} - ${asset.asset}</a></li>`);
                }
            }
        });
        $("span.asset_selector").on("click", "ul li a", BRS.evTransferAssetModalOnShowBsModal);
        $(document).on("click", "span.recipient_selector button", function(e) {
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
        });
        $("span.recipient_selector").on("click", "ul li a", function(e) {
            e.preventDefault();
            $(this).closest("form").find("input[name=converted_account_id]").val("");
            $(this).closest("form").find("input[name=recipient],input[name=account_id]").not("[type=hidden]").trigger("unmask").val($(this).data("contact")).trigger("blur");
        });
        $(document).on("click", ".recipient_selector_multi_out button", function(e) {
            if (!Object.keys(BRS.contacts).length) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            const $list = $(this).parent().find("ul");
            $list.empty();
            for (const accountId in BRS.contacts) {
                $list.append("<li><a href='#' data-contact='" + String(accountId).escapeHTML() + "'>" + String(BRS.contacts[accountId].name).escapeHTML() + "</a></li>");
            }
        });
        $(document).on("click", ".recipient_selector_multi_out ul li a", function(e) {
            e.preventDefault();
            // ugly hack - serious jquery cancer
            $(this).parent().parent().parent().parent().find(".multi-out-recipient").val($(this).data("contact"));
        });

        // from brs.assetexchange.js
        $("#asset_exchange_bookmark_this_asset").on("click", function() {
            if (BRS.viewingAsset) {
                BRS.saveAssetBookmarks(new Array(BRS.viewingAsset), function(newAssets) {
                    BRS.viewingAsset = false;
                    BRS.loadAssetExchangeSidebar(function() {
                        $("#asset_exchange_sidebar a[data-asset=" + newAssets[0].asset + "]").addClass("active").trigger("click");
                    });
                });
            }
        });
        $("#asset_exchange_sidebar").on("click", "a", BRS.evAssetExchangeSidebarClick);
        $("#ae_show_my_trades_only").on("change", BRS.evAssetExchangeSidebarClick);
        $("#asset_exchange_search").on("submit", function(e) {
            e.preventDefault();
            $("#asset_exchange_search input[name=q]").trigger("input");
        });
        $("#asset_exchange_search input[name=q]").on("input", BRS.evAssetExchangeSearchInput);
        $("#asset_exchange_clear_search").on("click", function() {
            $("#asset_exchange_search input[name=q]").val("");
            $("#asset_exchange_search").trigger("submit");
        });
        $("#buy_asset_box .box-header, #sell_asset_box .box-header").click(function(e) {
            e.preventDefault();
            //Find the box parent
            const box = $(this).parents(".box").first();
            //Find the body and the footer
            const bf = box.find(".box-body, .box-footer");
            if (!box.hasClass("collapsed-box")) {
                box.addClass("collapsed-box");
                $(this).find(".btn i.fa").removeClass("fa-minus").addClass("fa-plus");
                bf.slideUp();
            } else {
                box.removeClass("collapsed-box");
                bf.slideDown();
                $(this).find(".btn i.fa").removeClass("fa-plus").addClass("fa-minus");
            }
        });
        $("#asset_exchange_bid_orders_table tbody, #asset_exchange_ask_orders_table tbody").on("click", "td", BRS.evAssetExchangeOrdersTableClick);
        $("#sell_automatic_price, #buy_automatic_price").on("click", BRS.evSellBuyAutomaticPriceClick);
        $("#buy_asset_quantity, #buy_asset_price, #sell_asset_quantity, #sell_asset_price, #buy_asset_fee, #sell_asset_fee").keydown(BRS.evAssetExchangeQuantityPriceKeydown);
        $("#sell_asset_quantity, #sell_asset_price, #buy_asset_quantity, #buy_asset_price").keyup(BRS.evCalculatePricePreviewKeyup);
        $("#asset_order_modal").on("show.bs.modal", BRS.evAssetOrderModalOnShowBsModal);
        $("#asset_exchange_sidebar_group_context").on("click", "a", function(e) {
            e.preventDefault();
            const groupName = BRS.selectedContext.data("groupname");
            const option = $(this).data("option");
            if (option == "change_group_name") {
                $("#asset_exchange_change_group_name_old_display").html(groupName.escapeHTML());
                $("#asset_exchange_change_group_name_old").val(groupName);
                $("#asset_exchange_change_group_name_new").val("");
                $("#asset_exchange_change_group_name_modal").modal("show");
            }
        });
        $("#asset_exchange_sidebar_context").on("click", "a", BRS.evAssetExchangeSidebarContextClick);
        $("#asset_exchange_group_group").on("change", function() {
            const value = $(this).val();
            if (value == -1) {
                $("#asset_exchange_group_new_group_div").show();
            } else {
                $("#asset_exchange_group_new_group_div").hide();
            }
        });
        $("#asset_exchange_group_modal").on("hidden.bs.modal", function(e) {
            $("#asset_exchange_group_new_group_div").val("").hide();
        });
        $("#transfer_asset_modal").on("show.bs.modal", BRS.evTransferAssetModalOnShowBsModal);
        $("body").on("click", "a[data-goto-asset]", function(e) {
            e.preventDefault();
            const $visible_modal = $(".modal.in");
            if ($visible_modal.length) {
                $visible_modal.modal("hide");
            }
            BRS.goToAsset($(this).data("goto-asset"));
        });
        $("#cancel_order_modal").on("show.bs.modal", function(e) {
            const $invoker = $(e.relatedTarget);
            const orderType = $invoker.data("type");
            const orderId = $invoker.data("order");
            if (orderType == "bid") {
                $("#cancel_order_type").val("cancelBidOrder");
            } else {
                $("#cancel_order_type").val("cancelAskOrder");
            }
            $("#cancel_order_order").val(orderId);
        });

        // from brs.messages.js
        $('#send_message_modal').on('show.bs.modal', function (e) {
            BRS.showFeeSuggestions("#send_message_fee", "#suggested_fee_response_send_message");
        });
        $("#suggested_fee_send_message").on("click", function(e) {
            e.preventDefault();
            BRS.showFeeSuggestions("#send_message_fee", "#suggested_fee_response_send_message");
        });
        $("#suggested_fee_messages_page").on("click", function(e) {
            e.preventDefault();
           BRS.showFeeSuggestions("#send_message_fee_page", "#suggested_fee_response_messages_page");
        });
        $("#messages_sidebar").on("click", "a", BRS.evMessagesSidebarClick);
        $("#messages_sidebar_context").on("click", "a", BRS.evMessagesSidebarContextClick);
        $("#messages_sidebar_update_context").on("click", "a", function(e) {
            e.preventDefault();
            const account = BRS.getAccountFormatted(BRS.selectedContext.data("account"));
            const option = $(this).data("option");
            BRS.closeContextMenu();
            if (option == "update_contact") {
                $("#update_contact_modal").modal("show");
            } else if (option == "send_burst") {
                $("#send_money_recipient").val(BRS.selectedContext.data("contact")).trigger("blur");
                $("#send_money_modal").modal("show");
            }
        });
        $("body").on("click", "a[data-goto-messages-account]", function(e) {
            e.preventDefault();
            const account = $(this).data("goto-messages-account");
            BRS.goToPage("messages", function(){ $('#message_sidebar a[data-account=' + account + ']').trigger('click'); });
        });
        $("#inline_message_form").submit(BRS.evInlineMessageFormSubmit);
        $("#message_details").on("click", "dd.to_decrypt", function(e) {
            $("#messages_decrypt_modal").modal("show");
        });

        // from brs.aliases.js
        $('#transfer_alias_modal').on('show.bs.modal', function (e) {
            BRS.showFeeSuggestions("#transfer_alias_fee", "#suggested_fee_response_alias_transfer");
        });
        $("#suggested_fee_alias_transfer").on("click", function(e) {
            e.preventDefault();
            BRS.showFeeSuggestions("#transfer_alias_fee", "#suggested_fee_response_alias_transfer");
        });
        $('#sell_alias_modal').on('show.bs.modal', function (e) {
            BRS.showFeeSuggestions("#sell_alias_fee", "#suggested_fee_response_alias_sell");
        });
        $("#suggested_fee_alias_sell").on("click", function(e) {
            e.preventDefault();
            BRS.showFeeSuggestions("#sell_alias_fee", "#suggested_fee_response_alias_sell");
        });
        $('#buy_alias_modal').on('show.bs.modal', function (e) {
            BRS.showFeeSuggestions("#buy_alias_fee", "#suggested_fee_response_alias_buy");
        });
        $("#suggested_fee_alias_buy").on("click", function(e) {
            e.preventDefault();
            BRS.showFeeSuggestions("#buy_alias_fee", "#suggested_fee_response_alias_buy");
        });
        $("#transfer_alias_modal, #sell_alias_modal, #cancel_alias_sale_modal").on("show.bs.modal", BRS.evAliasModalOnShowBsModal);
        $("#sell_alias_to_specific_account, #sell_alias_to_anyone").on("click",BRS.evSellAliasClick);
        $("#buy_alias_modal").on("show.bs.modal", BRS.evBuyAliasModalOnShowBsModal);
        $("#register_alias_modal").on("show.bs.modal", BRS.evRegisterAliasModalOnShowBsModal);
        $("#register_alias_type").on("change", function () {
            const type = $(this).val();
            BRS.setAliasType(type, $("#register_alias_uri").val());
        });
        $("#alias_search").on("submit", BRS.evAliasSearchSubmit);

        // from brs.messages.js
        $("#transactions_page_type li a").click(BRS.evTransactionsPageTypeClick);

        // from brs.contacts.js
        $("#update_contact_modal").on("show.bs.modal", BRS.evUpdateContactModalOnShowBsModal);
        $("#delete_contact_modal").on("show.bs.modal", BRS.evDeleteContactModalOnShowBsModal);
        $("#export_contacts_button").on("click", function() {
            BRS.exportContacts();
        });
        $("#import_contacts_button_field").css({'display':'none'});
        $("#import_contacts_button_field").on("change", function(button_event) {
            button_event.preventDefault();
            const file = $("#import_contacts_button_field")[0].files[0];
            const reader = new FileReader();
            reader.onload = function (read_event) {
                const imported_contacts = JSON.parse(read_event.target.result);
                BRS.importContacts(imported_contacts);
            };
            reader.readAsText(file);
            return false;
        });
        $("#import_contacts_button").on("click", function() {
            $("#import_contacts_button_field").click();
        });

        // from brs.news.js
        $("#rss_news_enable").on("click", function() {
            BRS.updateSettings("news", 1);
            BRS.loadPage("news");
        });

        // from brs.settings.js
        $("#settings_box select").on("change", function(e) {
            e.preventDefault();
            const key = $(this).attr("name");
            const value = $(this).val();
            BRS.updateSettings(key, value);
        });
        $("#settings_box input[type=text]").on("input", function(e) {
            const key = $(this).attr("name");
            const value = $(this).val();
            if (/_warning/i.test(key) && key != "asset_transfer_warning") {
                value = BRS.convertToNQT(value);
            }
            BRS.updateSettings(key, value);
        });

        // from brs.sidebar.js
        $(".sidebar_context").on("contextmenu", "a",BRS.evSidebarContextOnContextmenu);

        // from brs.encryption.js
        $("#decrypt_note_form_container button.btn-primary").click(function() {
            BRS.decryptNoteFormSubmit();
        });
        $("#decrypt_note_form_container").on("submit", function(e) {
            e.preventDefault();
            BRS.decryptNoteFormSubmit();
        });

        // from brs.modals.js
        //Reset scroll position of tab when shown.
        $('a[data-toggle="tab"]').on("shown.bs.tab", function(e) {
            const target = $(e.target).attr("href");
            $(target).scrollTop(0);
        });
        // hide multi-out
        $(".hide").hide();
        $(".multi-out").hide();
        $(".multi-out-same").hide();
        $(".multi-out-recipients").append($("#additional_multi_out_recipient").html());
        $(".multi-out-recipients").append($("#additional_multi_out_recipient").html());
        $(".multi-out-same-recipients").append($("#additional_multi_out_same_recipient").html());
        $(".multi-out-same-recipients").append($("#additional_multi_out_same_recipient").html());
        $(".multi-out .remove_recipient").each(function() {
            $(this).remove();
        });
        $(".ordinary-nav a").on("click", function(e) {
            $(".multi-out").hide();
            $(".ordinary").fadeIn();
            if (!$(".ordinary-nav").hasClass("active")) {
                $(".ordinary-nav").addClass("active");
            }
            if ($(".multi-out-nav").toggleClass("active")) {
                $(".multi-out-nav").removeClass("active");
            }
        });
        $(".multi-out-nav a").on("click", function(e) {
            $(".ordinary").hide();
            $(".multi-out").fadeIn();
            if ($(".ordinary-nav").hasClass("active")) {
                $(".ordinary-nav").removeClass("active");
            }
            if (!$(".multi-out-nav").hasClass("active")) {
                $(".multi-out-nav").addClass("active");
            }
        });
        $(".add_recipients").on("click", BRS.evAddRecipientsClick);
        $(document).on("click", ".remove_recipient .remove_recipient_button", BRS.evDocumentOnClickRemoveRecipient);
        $(document).on("change remove", ".multi-out-amount", BRS.evDocumentOnChangeMultiOutAmount);
        $("#multi-out-same-amount").on("change", BRS.evMultiOutSameAmountChange);
        $(".same_out_checkbox").on("change", BRS.evSameOutCheckboxChange);
        $("#multi_out_fee").on("change", BRS.evMultiOutFeeChange);
        $("#multi-out-submit").on("click", BRS.evMultiOutSubmitClick);
        $(".add_message").on("change", function(e) {
            if ($(this).is(":checked")) {
                $(this).closest("form").find(".optional_message").fadeIn();
                $(this).closest(".form-group").css("margin-bottom", "5px");
            } else {
                $(this).closest("form").find(".optional_message").hide();
                $(this).closest(".form-group").css("margin-bottom", "");
            }
        });
        $(".add_note_to_self").on("change", function(e) {
            if ($(this).is(":checked")) {
                $(this).closest("form").find(".optional_note").fadeIn();
            } else {
                $(this).closest("form").find(".optional_note").hide();
            }
        });
        $(".modal").on("show.bs.modal", BRS.evModalOnShowBsModal);
        $(".modal").on("shown.bs.modal", function() {
            $(this).find("input[type=text]:first, textarea:first, input[type=password]:first").not("[readonly]").first().focus();
            $(this).find("input[name=converted_account_id]").val("");
            BRS.showedFormWarning = false; //maybe not the best place... we assume forms are only in modals?
        });
        $(".modal").on("hidden.bs.modal", BRS.evModalOnHiddenBsModal);
        $("input[name=feeNXT]").on("change", function() {
            const $modal = $(this).closest(".modal");
            const $feeInfo = $modal.find(".advanced_fee");
            if ($feeInfo.length) {
                $feeInfo.html(BRS.formatAmount(BRS.convertToNQT($(this).val())) + " " + BRS.valueSuffix);
            }
        });
        $(".advanced_info a").on("click", BRS.evAdvancedInfoClick);
        $("#reward_assignment_modal").on("show.bs.modal", function(e) {
            BRS.showFeeSuggestions("#reward_assignment_fee", "#suggested_fee_response_reward_assignment", "#reward_assignment_bottom_fee");
        });
        $("#reward_assignment_fee_suggested").on("click", function(e) {
            e.preventDefault();
            BRS.showFeeSuggestions("#reward_assignment_fee", "#suggested_fee_response_reward_assignment", "#reward_assignment_bottom_fee");
        });

        // from brs.modals.account.js
        $("#blocks_table, #blocks_forged_table, #contacts_table, #transactions_table, #dashboard_transactions_table, #asset_account, #asset_exchange_ask_orders_table, #transfer_history_table, #asset_exchange_bid_orders_table, #alias_info_table, .dgs_page_contents, .modal-content, #register_alias_modal").on("click", "a[data-user]", function(e) {
            e.preventDefault();
            const account = $(this).data("user");
            BRS.showAccountModal(account);
        });
        $("#user_info_modal").on("hidden.bs.modal", function(e) {
            $(this).find(".user_info_modal_content").hide();
            $(this).find(".user_info_modal_content table tbody").empty();
            $(this).find(".user_info_modal_content:not(.data-loading,.data-never-loading)").addClass("data-loading");
            $(this).find("ul.nav li.active").removeClass("active");
            $("#user_info_transactions").addClass("active");
            BRS.userInfoModal.user = 0;
        });
        $("#user_info_modal ul.nav li").click(function(e) {
            e.preventDefault();
            const tab = $(this).data("tab");
            $(this).siblings().removeClass("active");
            $(this).addClass("active");
            $(".user_info_modal_content").hide();
            const content = $("#user_info_modal_" + tab);
            content.show();
            if (content.hasClass("data-loading")) {
                BRS.userInfoModal[tab]();
            }
        });
        
        // from brs.modals.accountdetails.js
        $("#account_details_modal").on("show.bs.modal", BRS.evAccountDetailsModalOnShowBsModal);
        $("#account_details_modal ul.nav li").click(function(e) {
            e.preventDefault();
            const tab = $(this).data("tab");
            $(this).siblings().removeClass("active");
            $(this).addClass("active");
            $(".account_details_modal_content").hide();
            const content = $("#account_details_modal_" + tab);
            content.show();
        });
        $("#account_details_modal").on("hidden.bs.modal", function(e) {
            $(this).find(".account_details_modal_content").hide();
            $(this).find("ul.nav li.active").removeClass("active");
            $("#account_details_balance_nav").addClass("active");
            $("#account_details_modal_qr_code").empty();
        });

        // from brs.modals.accountinfo.js
        $("#account_info_modal").on("show.bs.modal", function(e) {
            $("#account_info_name").val(BRS.accountInfo.name);
            $("#account_info_description").val(BRS.accountInfo.description);
            BRS.showFeeSuggestions("#account_info_fee", "#suggested_fee_response_account", "#account_info_bottom_fee");
        });
        $("#account_info_fee_suggested").on("click", function(e) {
            e.preventDefault();
            BRS.showFeeSuggestions("#account_info_fee", "#suggested_fee_response_account", "#account_info_bottom_fee");
        });

        // from brs.modals.advanced.js
        $("#transaction_operations_modal").on("show.bs.modal", function(e) {
            $(this).find(".output_table tbody").empty();
            $(this).find(".output").hide();
            $(this).find(".tab_content:first").show();
            $("#transaction_operations_modal_button").text($.t("broadcast")).data("resetText", $.t("broadcast")).data("form", "broadcast_transaction_form");
        });
        $("#transaction_operations_modal").on("hidden.bs.modal", function(e) {
            $(this).find(".tab_content").hide();
            $(this).find("ul.nav li.active").removeClass("active");
            $(this).find("ul.nav li:first").addClass("active");
        
            $(this).find(".output_table tbody").empty();
            $(this).find(".output").hide();
        });
        $("#transaction_operations_modal ul.nav li").click(BRS.evTransactionOperationsModalClick);

        // from brs.modals.block.js
        $("#blocks_table, #blocks_forged_table, #dashboard_blocks_table").on("click", "a[data-block]",  BRS.evBlocksTableClick);

        // from brs.modals.escrow.js
        $("#escrow_table").on("click", "a[data-escrow]", function(e) {
            e.preventDefault();
            const escrowId = $(this).data("escrow");
            BRS.showEscrowDecisionModal(escrowId);
        });

        // from brs.modals.info.js
        $("#brs_modal").on("show.bs.modal", BRS.evBrsModalOnShowBsModal);
        $("#brs_modal").on("hide.bs.modal", function(e) {
            $("body").off("dragover.brs, drop.brs");
            $("#brs_update_drop_zone, #brs_update_result, #brs_update_hashes, #brs_update_hash_progress").hide();
            $(this).find("ul.nav li.active").removeClass("active");
            $("#brs_modal_state_nav").addClass("active");
            $(".brs_modal_content").hide();
        });
        $("#brs_modal ul.nav li").click(function(e) {
            e.preventDefault();
            const tab = $(this).data("tab");
            $(this).siblings().removeClass("active");
            $(this).addClass("active");
            $(".brs_modal_content").hide();
            const content = $("#brs_modal_" + tab);
            content.show();
        });

        // from brs.modals.request.js
        $('#request_burst_qr_modal').on('show.bs.modal', BRS.evRequestBurstQrModalOnShowBsModal);
        $("#request_burst_amount").change(function() {
            const amount = Number($("#request_burst_amount").val());
            $("#request_burst_amount").val(amount);
            if(amount >= 0.00000001 || (!$("#request_burst_immutable").is(':checked') && (!amount || amount == 0))) {
                $("#request_burst_amount_div").toggleClass("has-error",false);
                $("#request_burst_amount_div").toggleClass("has-success",true);
            } else {
                $("#request_burst_amount_div").toggleClass("has-success",false);
                $("#request_burst_amount_div").toggleClass("has-error",true);
            }
        });
        $("#request_burst_fee").change(function() {
            let radio = document.request_burst_form.request_burst_suggested_fee;
            const fee = Number($("#request_burst_fee").val());
            $("#request_burst_fee").val(fee);
            if(fee >= BRS.minimumFeeNumber) {
                for(let i = 0; i < radio.length; i++) {
                    radio[i].checked = false;
                }
                $("#request_burst_fee_div").toggleClass("has-error",false);
                $("#request_burst_fee_div").toggleClass("has-success",true);
            } else {
                $("#request_burst_fee_div").toggleClass("has-success",false);
                $("#request_burst_fee_div").toggleClass("has-error",true);
            }
        });
        $('#request_burst_immutable').change(function() {
            const amount = Number($("#request_burst_amount").val());
            if($(this).is(":checked")) {
                if(amount >= 0.00000001){
                    $("#request_burst_amount_div").toggleClass("has-error",false);
                    $("#request_burst_amount_div").toggleClass("has-success",true);
                } else {
                    $("#request_burst_amount_div").toggleClass("has-success",false);
                    $("#request_burst_amount_div").toggleClass("has-error",true);
                }
            } else {
                if(amount >= 0.00000001 || (!amount || amount == 0)){
                    $("#request_burst_amount_div").toggleClass("has-error",false);
                    $("#request_burst_amount_div").toggleClass("has-success",true);
                } else {
                    $("#request_burst_amount_div").toggleClass("has-success",false);
                    $("#request_burst_amount_div").toggleClass("has-error",true);
                }

            }
        });
        $("#generate_qr_button").on("click", BRS.evGenerateQrButtonClick);
        $('#request_burst_qr_modal').on('hide.bs.modal', function (e) {
            $("#request_burst_div").removeClass("display-none");
            $("#request_burst_div").addClass("display-visible");
            $("#request_burst_response_div").removeClass("display-visible");
            $("#request_burst_response_div").addClass("display-none");
            $("#request_burst_amount_div").toggleClass("has-error",false);
            $("#request_burst_amount_div").toggleClass("has-success",false);
            $("#request_burst_fee_div").toggleClass("has-success",true);
            $("#request_burst_fee_div").toggleClass("has-error",false);
            const radio = document.request_burst_form.request_burst_suggested_fee;
            for(let i = 0; i < radio.length; i++) {
                radio[i].checked = false;
            }
            $("#cancel_button").html('Cancel');
            $("#generate_qr_button").show();
        });
        $("#new_qr_button").on("click", function(e) {
            $("#request_burst_div").removeClass("display-none");
            $("#request_burst_div").addClass("display-visible");
            $("#request_burst_response_div").removeClass("display-visible");
            $("#request_burst_response_div").addClass("display-none");
            $("#request_burst_amount_div").toggleClass("has-error",false);
            $("#request_burst_amount_div").toggleClass("has-success",false);
            $("#request_burst_fee_div").toggleClass("has-success",true);
            $("#request_burst_fee_div").toggleClass("has-error",false);
            $("#request_burst_amount").val("");
            $("#request_burst_fee").val(0.1);
            const radio = document.request_burst_form.request_burst_suggested_fee;
            for(let i = 0; i < radio.length; i++) {
                radio[i].checked = false;
            }
            $("#request_burst_immutable").prop('checked', true);
            $("#cancel_button").html('Cancel');
            $("#generate_qr_button").show();
            $("#new_qr_button").hide();
        });

        // from brs.modals.signmessage.js
        $("#sign_message_modal").on("show.bs.modal", function(e) {
            $("#sign_message_output, #verify_message_output").html("").hide();
            $("#sign_message_modal_sign_message").show();
            $("#sign_message_modal_button").text("Sign Message").data("form", "sign_message_form");
        });
        $("#sign_message_modal ul.nav li").click(function(e) {
            e.preventDefault();
            const tab = $(this).data("tab");
            $(this).siblings().removeClass("active");
            $(this).addClass("active");
            $(".sign_message_modal_content").hide();
            const content = $("#sign_message_modal_" + tab);
            if (tab === "sign_message") {
                $("#sign_message_modal_button").text("Sign Message").data("form", "sign_message_form");
            } else {
                $("#sign_message_modal_button").text("Verify Message").data("form", "verify_message_form");
            }
            $("#sign_message_modal .error_message").hide();
            content.show();
        });
        $("#sign_message_modal").on("hidden.bs.modal", function(e) {
            $(this).find(".sign_message_modal_content").hide();
            $(this).find("ul.nav li.active").removeClass("active");
            $("#sign_message_nav").addClass("active");
        });

        // from brs.modals.subscription.js
        $("#subscription_table").on("click", "a[data-subscription]", function(e) {
            e.preventDefault();
            const subscriptionId = $(this).data("subscription");
            BRS.showSubscriptionCancelModal(subscriptionId);
        });

        // from brs.modals.token.js
        $("#token_modal").on("show.bs.modal", function(e) {
            $("#generate_token_output, #decode_token_output").html("").hide();
            $("#token_modal_generate_token").show();
            $("#token_modal_button").text($.t("generate")).data("form", "generate_token_form");
        });
        $("#token_modal ul.nav li").click(function(e) {
            e.preventDefault();
            const tab = $(this).data("tab");
            $(this).siblings().removeClass("active");
            $(this).addClass("active");
            $(".token_modal_content").hide();
            const content = $("#token_modal_" + tab);
            if (tab == "generate_token") {
                $("#token_modal_button").text($.t("generate")).data("form", "generate_token_form");
            } else {
                $("#token_modal_button").text($.t("validate")).data("form", "validate_token_form");
            }
            $("#token_modal .error_message").hide();
            content.show();
        });
        $("#token_modal").on("hidden.bs.modal", function(e) {
            $(this).find(".token_modal_content").hide();
            $(this).find("ul.nav li.active").removeClass("active");
            $("#generate_token_nav").addClass("active");
        });

        // from brs.modals.transaction.js
        $("#transactions_table, #dashboard_transactions_table, #transfer_history_table").on("click", "a[data-transaction]", function(e) {
            e.preventDefault();
            const transactionId = $(this).data("transaction");
            BRS.showTransactionModal(transactionId);
        });
        $('#send_money_modal').on('show.bs.modal', function (e) {
            BRS.showFeeSuggestions("#send_money_fee", "#suggested_fee_response_ordinary");
            BRS.showFeeSuggestions("#multi_out_fee", "#suggested_fee_response_multi");
        });
        $('#commitment_modal').on('show.bs.modal', function (e) {
            BRS.showFeeSuggestions("#commitment_fee", "#suggested_fee_response_commitment");
        });
        $('#send_money_modal').on('hide.bs.modal', function (e) {
                $("#total_amount_multi_out").html('0.1 Signa');
        });
        $("#suggested_fee_ordinary").on("click", function(e) {
            e.preventDefault();
            BRS.showFeeSuggestions("#send_money_fee", "#suggested_fee_response_ordinary");
        });
        $("#suggested_fee_multi").on("click", function(e) {
            e.preventDefault();
            BRS.showFeeSuggestions("#multi_out_fee","#suggested_fee_response_multi");
        });
        $("#transaction_info_modal").on("hide.bs.modal", function(e) {
            BRS.removeDecryptionForm($(this));
            $("#transaction_info_output_bottom, #transaction_info_output_top, #transaction_info_bottom").html("").hide();
        });

        // from brs.utils.js
        $("body").on(".description_toggle", "click", function(e) {
            e.preventDefault();
            if ($(this).closest(".description").hasClass("open")) {
                BRS.showPartialDescription();
            } else {
                BRS.showFullDescription();
            }
        });
        $("#offcanvas_toggle").on("click", function(e) {
            e.preventDefault();
            //If window is small enough, enable sidebar push menu
            if ($(window).width() <= 992) {
                $('.row-offcanvas').toggleClass('active');
                $('.left-side').removeClass("collapse-left");
                $(".right-side").removeClass("strech");
                $('.row-offcanvas').toggleClass("relative");
            } else {
                //Else, enable content streching
                $('.left-side').toggleClass("collapse-left");
                $(".right-side").toggleClass("strech");
            }
        });
        $.fn.tree = BRS.FnTree;
    }

    return BRS;
}(BRS || {}, jQuery));
