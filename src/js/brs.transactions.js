/**
 * @depends {brs.js}
 */
var BRS = (function(BRS, $, undefined) {
    BRS.lastTransactions = "";

    BRS.unconfirmedTransactions = [];
    BRS.unconfirmedTransactionIds = "";
    BRS.unconfirmedTransactionsChange = true;

    BRS.transactionsPageType = null;

    BRS.getInitialTransactions = function() {
        BRS.sendRequest("getAccountTransactions", {
            "account": BRS.account,
            "firstIndex": 0,
            "lastIndex": 9,
            "includeIndirect": true
        }, function(response) {
            if (response.transactions && response.transactions.length) {
                var transactions = [];
                var transactionIds = [];

                for (var i = 0; i < response.transactions.length; i++) {
                    var transaction = response.transactions[i];

                    transactions.push(transaction);

                    transactionIds.push(transaction.transaction);
                }

                BRS.getUnconfirmedTransactions(function(unconfirmedTransactions) {
                    BRS.handleInitialTransactions(transactions.concat(unconfirmedTransactions), transactionIds);
                });
            }
            else {
                BRS.getUnconfirmedTransactions(function(unconfirmedTransactions) {
                    BRS.handleInitialTransactions(unconfirmedTransactions, []);
                });
            }
        });
    };

    BRS.handleInitialTransactions = function(transactions, transactionIds) {
        let rows = ''
        if (transactions.length) {
            transactions.sort(BRS.sortArray);

            if (transactionIds.length) {
                BRS.lastTransactions = transactionIds.toString();
            }

            rows = transactions.reduce((prev, currTr) => prev + getTransactionRowDashboardHTML(currTr), '')
        }

        $("#dashboard_transactions_table tbody").empty().append(rows);

        BRS.dataLoadFinished($("#dashboard_transactions_table"));
    };

    BRS.getNewTransactions = function() {
        //check if there is a new transaction..
        BRS.sendRequest("getAccountTransactionIds", {
            "account": BRS.account,
            "timestamp": BRS.blocks[0].timestamp + 1,
            "firstIndex": 0,
            "lastIndex": 0
        }, function(response) {
            //if there is, get latest 10 transactions
            if (response.transactionIds && response.transactionIds.length) {
                BRS.sendRequest("getAccountTransactions", {
                    "account": BRS.account,
                    "firstIndex": 0,
                    "lastIndex": 9,
                    "includeIndirect": true
                }, function(response) {
                    if (response.transactions && response.transactions.length) {
                        const transactionIds = response.transactions.map(tr => tr.transaction)

                        BRS.getUnconfirmedTransactions(function(unconfirmedTransactions) {
                            BRS.handleIncomingTransactions(response.transactions.concat(unconfirmedTransactions), transactionIds);
                        });
                    }
                    else {
                        BRS.getUnconfirmedTransactions(function(unconfirmedTransactions) {
                            BRS.handleIncomingTransactions(unconfirmedTransactions);
                        });
                    }
                });
            }
            else {
                BRS.getUnconfirmedTransactions(function(unconfirmedTransactions) {
                    BRS.handleIncomingTransactions(unconfirmedTransactions);
                });
            }
        });
    };

    BRS.getUnconfirmedTransactions = function(callback) {
        BRS.sendRequest("getUnconfirmedTransactions", {
            "account": BRS.account,
            "includeIndirect": true
        }, function(response) {
            if (response.unconfirmedTransactions && response.unconfirmedTransactions.length) {
                var unconfirmedTransactions = [];
                var unconfirmedTransactionIds = [];

                response.unconfirmedTransactions.sort(function(x, y) {
                    if (x.timestamp < y.timestamp) {
                        return 1;
                    }
                    else if (x.timestamp > y.timestamp) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                });

                for (var i = 0; i < response.unconfirmedTransactions.length; i++) {
                    var unconfirmedTransaction = response.unconfirmedTransactions[i];

                    if (unconfirmedTransaction.attachment) {
                        for (var key in unconfirmedTransaction.attachment) {
                            if (!unconfirmedTransaction.hasOwnProperty(key)) {
                                unconfirmedTransaction[key] = unconfirmedTransaction.attachment[key];
                            }
                        }
                    }

                    unconfirmedTransactions.push(unconfirmedTransaction);
                    unconfirmedTransactionIds.push(unconfirmedTransaction.transaction);
                }

                BRS.unconfirmedTransactions = unconfirmedTransactions;

                var unconfirmedTransactionIdString = unconfirmedTransactionIds.toString();

                if (unconfirmedTransactionIdString != BRS.unconfirmedTransactionIds) {
                    BRS.unconfirmedTransactionsChange = true;
                    BRS.unconfirmedTransactionIds = unconfirmedTransactionIdString;
                }
                else {
                    BRS.unconfirmedTransactionsChange = false;
                }

                if (callback) {
                    callback(unconfirmedTransactions);
                }
                else if (BRS.unconfirmedTransactionsChange) {
                    BRS.incoming.updateDashboardTransactions(unconfirmedTransactions, true);
                }
            }
            else {
                BRS.unconfirmedTransactions = [];

                if (BRS.unconfirmedTransactionIds) {
                    BRS.unconfirmedTransactionsChange = true;
                }
                else {
                    BRS.unconfirmedTransactionsChange = false;
                }

                BRS.unconfirmedTransactionIds = "";

                if (callback) {
                    callback([]);
                }
                else if (BRS.unconfirmedTransactionsChange) {
                    BRS.incoming.updateDashboardTransactions([], true);
                }
            }
        });
    };

    BRS.handleIncomingTransactions = function(transactions, confirmedTransactionIds) {
        var oldBlock = (confirmedTransactionIds === false); //we pass false instead of an [] in case there is no new block..

        if (typeof confirmedTransactionIds != "object") {
            confirmedTransactionIds = [];
        }

        if (confirmedTransactionIds.length) {
            BRS.lastTransactions = confirmedTransactionIds.toString();
        }

        if (confirmedTransactionIds.length || BRS.unconfirmedTransactionsChange) {
            transactions.sort(BRS.sortArray);

            BRS.incoming.updateDashboardTransactions(transactions, confirmedTransactionIds.length == 0);
        }

        //always refresh peers and unconfirmed transactions..
        if (BRS.currentPage == "peers") {
            BRS.incoming.peers();
        }
        else if (BRS.currentPage == "transactions" && BRS.transactionsPageType == "unconfirmed") {
            BRS.incoming.transactions();
        }
        else {
            if (BRS.currentPage != 'messages' && (!oldBlock || BRS.unconfirmedTransactionsChange)) {
                if (BRS.incoming[BRS.currentPage]) {
                    BRS.incoming[BRS.currentPage](transactions);
                }
            }
        }
        // always call incoming for messages to enable message notifications
        if (!oldBlock || BRS.unconfirmedTransactionsChange) {
            BRS.incoming.messages(transactions);
        }
    };

    BRS.sortArray = function(a, b) {
        return b.timestamp - a.timestamp;
    };

    BRS.incoming.updateDashboardTransactions = function(newTransactions, unconfirmed) {
        if (newTransactions.length) {
            let onlyUnconfirmed = true;

            const rows = newTransactions.reduce((prev, currTr) => {
                if (!currTr.unconfirmed) {
                    onlyUnconfirmed = false;
                }
                return prev + getTransactionRowDashboardHTML(currTr);
            }, '')

            if (onlyUnconfirmed) {
                $("#dashboard_transactions_table tbody tr.tentative").remove();
                $("#dashboard_transactions_table tbody").prepend(rows);
            } else {
                $("#dashboard_transactions_table tbody").empty().append(rows);
            }

            const $parent = $("#dashboard_transactions_table").parent();

            if ($parent.hasClass("data-empty")) {
                $parent.removeClass("data-empty");
                if ($parent.data("no-padding")) {
                    $parent.parent().addClass("no-padding");
                }
            }
        } else if (unconfirmed) {
            $("#dashboard_transactions_table tbody tr.tentative").remove();
        }
    };

    //todo: add to dashboard? 
    BRS.addUnconfirmedTransaction = function(transactionId, callback) {
        BRS.sendRequest("getTransaction", {
            "transaction": transactionId
        }, function(response) {
            if (!response.errorCode) {
                response.transaction = transactionId;

                if (response.attachment) {
                    for (var key in response.attachment) {
                        if (!response.hasOwnProperty(key)) {
                            response[key] = response.attachment[key];
                        }
                    }
                }

                var alreadyProcessed = false;

                try {
                    var regex = new RegExp("(^|,)" + transactionId + "(,|$)");

                    if (regex.exec(BRS.lastTransactions)) {
                        alreadyProcessed = true;
                    }
                    else {
                        $.each(BRS.unconfirmedTransactions, function(key, unconfirmedTransaction) {
                            if (unconfirmedTransaction.transaction == transactionId) {
                                alreadyProcessed = true;
                                return false;
                            }
                        });
                    }
                } catch (e) {}

                if (!alreadyProcessed) {
                    BRS.unconfirmedTransactions.unshift(response);
                }

                if (callback) {
                    callback(alreadyProcessed);
                }

                BRS.incoming.updateDashboardTransactions(BRS.unconfirmedTransactions, true);

                BRS.getAccountInfo();
            }
            else if (callback) {
                callback(false);
            }
        });
    };

    BRS.pages.transactions = function() {
        if (BRS.transactionsPageType == "unconfirmed") {
            BRS.displayUnconfirmedTransactions();
            return;
        }

        let rows = "";
        let unconfirmedTransactions;
        const params = {
            "account": BRS.account,
            "firstIndex": BRS.pageSize * (BRS.pageNumber - 1),
            "lastIndex": BRS.pageSize * BRS.pageNumber,
            "includeIndirect": true
        };

        if (BRS.transactionsPageType) {
            params.type = BRS.transactionsPageType.type;
            params.subtype = BRS.transactionsPageType.subtype;
            unconfirmedTransactions = BRS.getUnconfirmedTransactionsFromCache(params.type, params.subtype);
        } else {
            unconfirmedTransactions = BRS.unconfirmedTransactions;
        }

        if (unconfirmedTransactions && BRS.pageNumber == 1) {
            rows = unconfirmedTransactions.reduce((prev, currTr) => prev + getTransactionRowHTML(currTr), '')
        }

        BRS.sendRequest("getAccountTransactions+", params, (response) => {
            if (response.transactions && response.transactions.length) {
                if (response.transactions.length > BRS.pageSize) {
                    BRS.hasMorePages = true;
                    response.transactions.pop();
                }
                rows += response.transactions.reduce((prev, currTr) => prev + getTransactionRowHTML(currTr), '')
            }
            BRS.dataLoaded(rows);
        });
    };

    BRS.incoming.transactions = function(transactions) {
        BRS.loadPage("transactions");
    };

    BRS.displayUnconfirmedTransactions = function() {
        BRS.sendRequest("getUnconfirmedTransactions", function(response) {
            let rows = ''
            
            if (response.unconfirmedTransactions && response.unconfirmedTransactions.length) {
                rows = response.unconfirmedTransactions.reduce((prev, currTr) => prev + getTransactionRowHTML(currTr), '')
            }

            BRS.dataLoaded(rows);
        });
    };

    /** 
     * Get transaction details.
     * @param transaction to get the name
     * @param viewingAccount Use this account as point of view. Default to current user
     * @returns Object with many transaction details to be shown.
    */
    BRS.getTransactionDetails = function (transaction, viewingAccount) {
        if (!viewingAccount) {
            viewingAccount = BRS.account;
        }
        if (BRS.rsRegEx.test(viewingAccount)) {
            viewingAccount = BRS.convertRSAccountToNumeric(viewingAccount)
        }

        let nameOfTransaction = $.t("unknown");
        let toFromViewer = (transaction.sender == viewingAccount || transaction.recipient == viewingAccount)
        let senderOrRecipientOrMultiple = "sender";
        if (toFromViewer && transaction.sender == viewingAccount) {
            senderOrRecipientOrMultiple = 'recipient'
        }
        let amountToFromViewer = transaction.amountNQT;
        let amountToFromViewerHTML = BRS.formatAmount(amountToFromViewer) + " " + BRS.valueSuffix
        let foundAsset, newAmountText;
        let hasAssets = false;

        let recipientHTML = BRS.getAccountLink(transaction, 'recipient')
        let senderHTML = BRS.getAccountLink(transaction, 'sender')

        // process transactions exceptions and names
        switch (transaction.type) {
        case 0: // "Payment"
            switch (transaction.subtype) {
            case 0:
                nameOfTransaction = $.t("ordinary_payment");
                break;
            case 1:
                nameOfTransaction = $.t("multi_out_payment");
                if (transaction.sender == viewingAccount) {
                    senderOrRecipientOrMultiple = "multiple"
                    break;
                }
                recipientHTML = ''
                nxtAddress = new NxtAddress(BRS.prefix)
                for (const recipient of transaction.attachment.recipients) {
                    const nxtAddress = new NxtAddress(BRS.prefix)
                    nxtAddress.set(recipient[0])
                    const RSAddress = nxtAddress.toString()
                    const amountEach = BRS.formatAmount(recipient[1]) + ' ' + BRS.valueSuffix
                    if (recipient[0] === viewingAccount) {
                        recipientHTML += `<strong>${RSAddress}: ${amountEach}</strong>`
                        toFromViewer = true;
                        senderOrRecipientOrMultiple = "sender"
                        amountToFromViewer = recipient[1];
                        amountToFromViewerHTML = BRS.formatAmount(amountToFromViewer) + " " + BRS.valueSuffix
                    } else {
                        recipientHTML += `${RSAddress}: ${amountEach}`
                    }
                    recipientHTML += '<br />'
                }
                break;
            case 2:
                nameOfTransaction = $.t("multi_out_same_payment");
                if (transaction.sender == viewingAccount) {
                    senderOrRecipientOrMultiple = "multiple"
                }

                var amountEach = (parseInt(transaction.amountNQT) / transaction.attachment.recipients.length).toString();
                recipientHTML = ''
                
                for (const recipient of transaction.attachment.recipients) {
                    const nxtAddress = new NxtAddress(BRS.prefix)
                    nxtAddress.set(recipient)
                    const address = nxtAddress.toString()
                    if (recipient === viewingAccount) {
                        recipientHTML += '<strong>' + address + '</strong>'
                        toFromViewer = true;
                        senderOrRecipientOrMultiple = "sender"
                        amountToFromViewer = amountEach;
                        amountToFromViewerHTML = BRS.formatAmount(amountToFromViewer) + " " + BRS.valueSuffix
                    } else {
                        recipientHTML += address
                    }
                    recipientHTML += '<br />'
                }
            }
            break;
        case 1:
            switch (transaction.subtype) {
            case 0:
                nameOfTransaction = $.t("arbitrary_message");
                break;
            case 1:
                nameOfTransaction = $.t("alias_assignment");
                senderOrRecipientOrMultiple = "sender"
                break;
            case 5:
                nameOfTransaction = $.t("account_info");
                senderOrRecipientOrMultiple = "sender"
                break;
            case 6:
                if (transaction.attachment.priceNQT == "0") {
                    if (transaction.sender === transaction.recipient) {
                        nameOfTransaction = $.t("alias_sale_cancellation");
                    }
                    else {
                        nameOfTransaction = $.t("alias_transfer");
                    }
                }
                else {
                    nameOfTransaction = $.t("alias_sale");
                    senderOrRecipientOrMultiple = "sender"
                }
                break;
            case 7:
                nameOfTransaction = $.t("alias_buy");
                break;
            }
            break;
        case 2: // "Colored coins"
            switch (transaction.subtype) {
            case 0:
                nameOfTransaction = $.t("asset_issuance");
                senderOrRecipientOrMultiple = "sender"
                amountToFromViewerHTML = `${BRS.formatQuantity(transaction.attachment.quantityQNT, transaction.attachment.decimals)} ${transaction.attachment.name}`;
                if (transaction.attachment.quantityQNT !== "0") {
                    hasAssets = true;
                }
                break;
            case 1:
            case 6:
                if (transaction.subtype === 1) {
                    nameOfTransaction = $.t("asset_transfer");
                } else {
                    nameOfTransaction = $.t("asset_mint");
                    senderOrRecipientOrMultiple = "sender"
                }
                foundAsset = BRS.getAssetDetails(transaction.attachment.asset)
                newAmountText = ''
                if (foundAsset) {
                    newAmountText = `${BRS.formatQuantity(transaction.attachment.quantityQNT, foundAsset.decimals)} ${foundAsset.name}`;
                } else {
                    newAmountText = `${transaction.attachment.quantityQNT} [QNT]`;
                }
                if (amountToFromViewer !== "0") {
                    newAmountText += `<br>${amountToFromViewerHTML}`
                }
                amountToFromViewerHTML = newAmountText
                hasAssets = true
                break;
            case 2:
                nameOfTransaction = $.t("ask_order_placement");
                senderOrRecipientOrMultiple = "sender";
                break;
            case 3:
                nameOfTransaction = $.t("bid_order_placement");
                senderOrRecipientOrMultiple = "sender";
                break;
            case 4:
                nameOfTransaction = $.t("ask_order_cancellation");
                break;
            case 5:
                nameOfTransaction = $.t("bid_order_cancellation");
                break;
            case 7:
                nameOfTransaction = $.t("asset_add_treasury_account");
                break;
            case 8:
                nameOfTransaction = $.t("asset_distribute_to_holders");
                // Actually there is no way to know if viewingAccount is in recipients without another query.
                // Assuming yes, because it will be wrong only in unconfirmed transaction.
                toFromViewer = true
                senderOrRecipientOrMultiple = "sender"
                if (transaction.sender != viewingAccount) {
                    // amount is unknow only if current user is in recipient list
                    amountToFromViewerHTML = "(" + amountToFromViewerHTML + ")";    
                } else {
                    senderOrRecipientOrMultiple = "multiple"
                }
                break;
            case 9:
                nameOfTransaction = $.t("asset_multi_transfer");
                if (amountToFromViewer === "0") {
                    amountToFromViewerHTML = ''
                } else {
                    amountToFromViewerHTML += '<br>'
                }
                for (let i=0; i< transaction.attachment.assetIds.length; i++) {
                    if (i !== 0) {
                        amountToFromViewerHTML += '<br>'
                    }
                    foundAsset = BRS.getAssetDetails(transaction.attachment.assetIds[i])
                    if (foundAsset) {
                        amountToFromViewerHTML += `${BRS.formatQuantity(transaction.attachment.quantitiesQNT[i], foundAsset.decimals)} ${foundAsset.name}`;
                    } else {
                        amountToFromViewerHTML += `${transaction.attachment.quantityQNT} [QNT]`;
                    }
                }
                hasAssets = true
                break;
            }
            break;
        case 3:
            switch (transaction.subtype) {
            case 0:
                nameOfTransaction = $.t("marketplace_listing");
                break;
            case 1:
                nameOfTransaction = $.t("marketplace_removal");
                break;
            case 2:
                nameOfTransaction = $.t("marketplace_price_change");
                break;
            case 3:
                nameOfTransaction = $.t("marketplace_quantity_change");
                break;
            case 4:
                nameOfTransaction = $.t("marketplace_purchase");
                break;
            case 5:
                nameOfTransaction = $.t("marketplace_delivery");
                break;
            case 6:
                nameOfTransaction = $.t("marketplace_feedback");
                break;
            case 7:
                nameOfTransaction = $.t("marketplace_refund");
                break;
            }
            break;
        case 4:
            switch (transaction.subtype) {
            case 0:
                nameOfTransaction = $.t("balance_leasing");
                break;
            }
            break;
        case 20:  // "Mining",
            switch (transaction.subtype) {
            case 0:
                nameOfTransaction = $.t("reward_assignment");
                break;
            case 1: // "Add Commitment"
                nameOfTransaction = $.t("add_commitment");
                senderOrRecipientOrMultiple = "recipient";
                amountToFromViewer = transaction.attachment.amountNQT.toString();
                amountToFromViewerHTML = BRS.formatAmount(amountToFromViewer) + " " + BRS.valueSuffix
                break;
            case 2: // "Remove Commitment"
                nameOfTransaction = $.t("remove_commitment");
                senderOrRecipientOrMultiple = "sender";
                amountToFromViewer = transaction.attachment.amountNQT.toString();
                amountToFromViewerHTML = BRS.formatAmount(amountToFromViewer) + " " + BRS.valueSuffix
                break;
            }
            break;
        case 21:
            switch (transaction.subtype) {
            case 0:
                nameOfTransaction = "Escrow Creation";
                amountToFromViewer = transaction.attachment.amountNQT.toString();
                amountToFromViewerHTML = BRS.formatAmount(amountToFromViewer) + " " + BRS.valueSuffix
                break;
            case 1:
                nameOfTransaction = "Escrow Signing";
                break;
            case 2:
                nameOfTransaction = "Escrow Result";
                break;
            case 3:
                nameOfTransaction = $.t("subscription_subscribe");
                break;
            case 4:
                nameOfTransaction = $.t("subscription_cancel");
                break;
            case 5:
                nameOfTransaction = $.t("subscription_payment");
                break;
            }
            break;
        case 22:
            switch (transaction.subtype) {
            case 0:
                nameOfTransaction = $.t("at_creation");
                break;
            case 1:
                nameOfTransaction = $.t("at_payment");
                break;
            }
            break;
        }

        let hasMessage = false;
        if (transaction.attachment) {
            if (transaction.attachment.encryptedMessage || transaction.attachment.message) {
                hasMessage = true;
            }
            else if (transaction.sender == viewingAccount && transaction.attachment.encryptToSelfMessage) {
                hasMessage = true;
            }
        }

        let circleText = ""
        let colorClass = ""
        if (toFromViewer && (amountToFromViewer !== "0" || hasAssets)) {
            if (senderOrRecipientOrMultiple === "sender") {
                circleText = "<i class='fas fa-plus-circle' style='color:#65C62E'></i>"
            } else {
                circleText = "<i class='fas fa-minus-circle' style='color:#E04434'></i>"
                colorClass = "class='transaction-value-negative'"
            }
        }

        const accountLink = BRS.getAccountLink(transaction, senderOrRecipientOrMultiple)
        const accountTitle = BRS.getAccountTitle(transaction, senderOrRecipientOrMultiple)
        return {
            nameOfTransaction,
            accountLink,
            accountTitle,
            recipientHTML,
            senderHTML,
            toFromViewer,
            // amount: amountToFromViewer,
            amountToFromViewerHTML,
            foundAsset,
            hasMessage,
            circleText,
            colorClass
        }
    }

    function getTransactionRowDashboardHTML (transaction) {
        const details = BRS.getTransactionDetails(transaction);

        let confirmationHTML = String(transaction.confirmations).escapeHTML()
        if (transaction.unconfirmed) {
            confirmationHTML = BRS.pendingTransactionHTML
        } else if (transaction.confirmations > 10) {
            confirmationHTML = "10+"
        }

        let rowStr = ''
        rowStr += "<tr class='" + (transaction.unconfirmed ? "tentative" : "confirmed") + "'>"
        rowStr += "<td><a href='#' data-transaction='" + String(transaction.transaction).escapeHTML() + "' data-timestamp='" + String(transaction.timestamp).escapeHTML() + "'>" + BRS.formatTimestamp(transaction.timestamp) + "</a></td>"
        rowStr += "<td>" + details.nameOfTransaction + (details.hasMessage ? " + <i class='far fa-envelope-open'></i>&nbsp;" : "") + "</td>"
        rowStr += "<td>" + details.circleText + "</td>"
        rowStr += `<td ${details.colorClass}>${details.amountToFromViewerHTML}</td>`
        rowStr += `<td>${details.accountLink}</td>`
        rowStr += `<td>${confirmationHTML}</td>`
        rowStr += "</tr>";

        return rowStr;
    }

    function getTransactionRowHTML(transaction) {
        const details = BRS.getTransactionDetails(transaction);

        let confirmationHTML = BRS.formatAmount(transaction.confirmations)
        if (transaction.unconfirmed) {
            confirmationHTML = BRS.pendingTransactionHTML
        }
        let rowStr = ''
        rowStr += "<tr " + ((transaction.unconfirmed && details.toFromViewer) ? " class='tentative'" : "") + ">";
        rowStr += "<td><a href='#' data-transaction='" + String(transaction.transaction).escapeHTML() + "'>" + String(transaction.transaction).escapeHTML() + "</a></td>"
        rowStr += "<td>" + (details.hasMessage ? "<i class='far fa-envelope-open'></i>&nbsp;" : "") + "</td>"
        rowStr += "<td>" + BRS.formatTimestamp(transaction.timestamp) + "</td>"
        rowStr += "<td>" + details.nameOfTransaction + "</td>"
        rowStr += "<td>" + details.circleText + "</td>"
        rowStr += `<td ${details.colorClass}>${details.amountToFromViewerHTML}</td>`
        rowStr += "<td>" + BRS.formatAmount(transaction.feeNQT) + "</td>"
        rowStr += `<td>${details.accountLink}</td>`
        rowStr += "<td>" + confirmationHTML + "</td>"
        rowStr += "</tr>";

        return rowStr;
    };

    BRS.evTransactionsPageTypeClick = function(e) {
        e.preventDefault();

        var type = $(this).data("type");

        if (!type) {
            BRS.transactionsPageType = null;
        }
        else if (type == "unconfirmed") {
            BRS.transactionsPageType = "unconfirmed";
        }
        else {
            type = type.split(":");
            BRS.transactionsPageType = {
                "type": type[0],
                "subtype": type[1]
            };
        }

        BRS.pageNumber = 1;
        BRS.hasMorePages = false;

        $(this).parents(".btn-group").find(".text").text($(this).text());

        $(".popover").remove();

        BRS.loadPage("transactions");
    };

    return BRS;
}(BRS || {}, jQuery));
