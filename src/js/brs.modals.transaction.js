/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */
var message = "";
var BRS = (function(BRS, $, undefined) {

    BRS.showTransactionModal = function(transaction) {
        if (BRS.fetchingModalData) {
            return;
        }

        BRS.fetchingModalData = true;

        $("#transaction_info_output_top, #transaction_info_output_bottom, #transaction_info_bottom").html("").hide();
        $("#transaction_info_callout").hide();
        $("#transaction_info_table").hide();
        $("#transaction_info_table tbody").empty();

        if (typeof transaction != "object") {
            BRS.sendRequest("getTransaction", {
                    "transaction": transaction
            }, function(response, input) {
                    response.transaction = input.transaction;
                    BRS.processTransactionModalData(response);
            });
        } else {
            BRS.processTransactionModalData(transaction);
        }
    };

    BRS.processTransactionModalData = function(transaction) {
        let data
        let async = false
        let assetDetails, helperStr

        function processTransactionModalDataMain() {
            processInfoDetails()
            processButtons()
            processDefaultProperties()
            processExceptionProperties()
            processMessage()
            if (async === false) {
                transactionEndLoad()
            }
        }

        function processInfoDetails () {
            const transactionDetails = $.extend({}, transaction)
            delete transactionDetails.attachment
            if (transactionDetails.referencedTransaction == '0') {
                delete transactionDetails.referencedTransaction
            }
            delete transactionDetails.transaction
        
            $('#transaction_info_modal_transaction').html(String(transaction.transaction).escapeHTML())
            $('#transaction_info_tab_link').tab('show')
            $('#transaction_info_details_table tbody').empty().append(BRS.createInfoTable(transactionDetails, true))
            $('#transaction_info_table tbody').empty()
        }
    
        function processButtons() {
            let accountButton
            if (transaction.senderRS == BRS.accountRS) {
                $('#transaction_info_actions').hide()
            } else {
                if (transaction.senderRS in BRS.contacts) {
                    accountButton = BRS.contacts[transaction.senderRS].name.escapeHTML()
                    $('#transaction_info_modal_add_as_contact').hide()
                } else {
                    accountButton = transaction.senderRS
                    $('#transaction_info_modal_add_as_contact').show()
                }
                    $('#transaction_info_actions').show()
                $('#transaction_info_actions_tab button').data('account', accountButton)
            }
        }
    
        function processDefaultProperties () {
            const details = BRS.getTransactionDetails(transaction)
            const amount_formatted = BRS.formatAmount(new BigInteger(String(transaction.amountNQT))) + " " + BRS.valueSuffix;
            data = {
                type: details.nameOfTransaction,
                amount_formatted,
                amountToFromYou_formatted_html: details.amountToFromViewerHTML,
                fee: transaction.feeNQT,
                sender_formatted_html: details.senderHTML,
                recipient_formatted_html: details.recipientHTML
            }
            if (amount_formatted === details.amountToFromViewerHTML) {
                delete data.amountToFromYou_formatted_html
            }
            if (transaction.amountNQT === '0') {
                delete data.amount_formatted
            }
            if (details.recipientHTML === '/') {
                delete data.recipient_formatted_html
            }
            if (transaction.type === 2) {
                delete data.amountToFromYou_formatted_html
            }
        }

        function transactionEndLoad() {
            $('#transaction_info_table tbody').append(BRS.createInfoTable(data))
            $('#transaction_info_modal').modal('show')
            $('#transaction_info_table').show()
            BRS.fetchingModalData = false
        }

        function processExceptionProperties () {
            switch (transaction.type) {
            case 1:
                peMessaging();
                return
            case 2:
                peColoredCoins();
                return;
            case 3:
                peDigitalGoods();
                return;
            case 4:
                if (transaction.subtype === 0) {
                    // balance leasing
                    data['period'] = transaction.attachment.period
                }
                return
            }
        }

        function peMessaging() {
            switch (transaction.subtype) {
            case 1:
                // alias assignment
                data.alias = transaction.attachment.alias;
                data.data_formatted_html = transaction.attachment.uri.autoLink()
                return
            case 6:
                // alias sale/transfer/sale cancelation
                data.alias_name = transaction.attachment.alias
                if (details.nameOfTransaction === $.t('alias_sale')) {
                    peMessagingAliasSale();
                }
                return;
            case 7:
                // alias buy
                data.alias_name = transaction.attachment.alias
                data.price = transaction.amountNQT
                break
            }
        }

        function peMessagingAliasSale () {
            let message = ''
            let messageStyle = 'info'
            data.price = transaction.attachment.priceNQT
            async = true
            BRS.sendRequest('getAlias', {
                aliasName: transaction.attachment.alias
            }, function (response) {
                BRS.fetchingModalData = false
                if (!response.errorCode) {
                    if (transaction.recipient != response.buyer || transaction.attachment.priceNQT != response.priceNQT) {
                        message = $.t('alias_sale_info_outdated')
                        messageStyle = 'danger'
                    } else if (transaction.recipient == BRS.account) {
                        message = $.t('alias_sale_direct_offer', {
                            burst: BRS.formatAmount(transaction.attachment.priceNQT)
                        }) + " <a href='#' data-alias='" + String(transaction.attachment.alias).escapeHTML() + "' data-toggle='modal' data-target='#buy_alias_modal'>" + $.t('buy_it_q') + '</a>'
                    } else if (typeof transaction.recipient === 'undefined') {
                        message = $.t('alias_sale_indirect_offer', {
                            burst: BRS.formatAmount(transaction.attachment.priceNQT)
                        }) + " <a href='#' data-alias='" + String(transaction.attachment.alias).escapeHTML() + "' data-toggle='modal' data-target='#buy_alias_modal'>" + $.t('buy_it_q') + '</a>'
                    } else if (transaction.senderRS == BRS.accountRS) {
                        if (transaction.attachment.priceNQT != '0') {
                            message = $.t('your_alias_sale_offer') + " <a href='#' data-alias='" + String(transaction.attachment.alias).escapeHTML() + "' data-toggle='modal' data-target='#cancel_alias_sale_modal'>" + $.t('cancel_sale_q') + '</a>'
                        }
                    } else {
                        message = $.t('error_alias_sale_different_account')
                    }
                }
                transactionEndLoad()
            })

            if (message.length) {
                $('#transaction_info_bottom').html("<div class='callout callout-bottom callout-" + messageStyle + "'>" + message + '</div>').show()
            }
        }

        function peColoredCoins () {
            switch (transaction.subtype) {
            case 0:
                // asset issuance
                assetDetails = BRS.getAssetDetails(BRS.fullHashToId(transaction.fullHash))
                data['name_formatted_html'] = BRS.getAssetLink(assetDetails)
                data['description'] = transaction.attachment.description.escapeHTML()
                data['quantity'] = [transaction.attachment.quantityQNT, transaction.attachment.decimals]
                data['decimals'] = transaction.attachment.decimals
                if (transaction.attachment.mintable === true) {
                    data.mintable = $.t("yes")
                } else {
                    data.mintable = $.t("no")
                }
                break;
            case 1:
                // asset transfer
                assetDetails = BRS.getAssetDetails(transaction.attachment.asset)
                if (!assetDetails) {
                    break;
                }
                data['asset_name_formatted_html'] = BRS.getAssetLink(assetDetails)
                data['quantity'] = [transaction.attachment.quantityQNT, assetDetails.decimals]
                break;
            case 2:
                // ask order placement
                assetDetails = BRS.getAssetDetails(transaction.attachment.asset)
                if (!assetDetails) {
                    break;
                }
                data['asset_name_formatted_html'] = BRS.getAssetLink(assetDetails)
                data['quantity'] = [transaction.attachment.quantityQNT, assetDetails.decimals]
                data['price_formatted_html'] = BRS.formatOrderPricePerWholeQNT(transaction.attachment.priceNQT, assetDetails.decimals) + ' ' + BRS.valueSuffix
                data['total_formatted_html'] = BRS.formatAmount(BRS.calculateOrderTotalNQT(transaction.attachment.quantityQNT, transaction.attachment.priceNQT)) + ' ' + BRS.valueSuffix
                break;
            case 3:
                // bid order placement
                assetDetails = BRS.getAssetDetails(transaction.attachment.asset)
                if (!assetDetails) {
                    break;
                }
                data['asset_name_formatted_html'] = BRS.getAssetLink(assetDetails)
                data['quantity'] = [transaction.attachment.quantityQNT, assetDetails.decimals]
                data['price_formatted_html'] = BRS.formatOrderPricePerWholeQNT(transaction.attachment.priceNQT, assetDetails.decimals) + ' ' + BRS.valueSuffix
                data['total_formatted_html'] = BRS.formatAmount(BRS.calculateOrderTotalNQT(transaction.attachment.quantityQNT, transaction.attachment.priceNQT)) + ' ' + BRS.valueSuffix
                break;
            case 4:
            case 5:
                // ask order cancellation
                // bid order cancellation
                async = true
                transactionResponse = undefined
                BRS.sendRequest('getTransaction', {
                    transaction: transaction.attachment.order
                }, function (transactionII) {
                    if (transactionII.errorCode) {
                        return;
                    }
                    const asset = BRS.getAssetDetails(transactionII.attachment.asset)
                    if (!asset) {
                        return;
                    }
                    data['asset_name_formatted_html'] = BRS.getAssetLink(assetDetails)
                    data['quantity'] = [transactionII.attachment.quantityQNT, asset.decimals]
                    data['price_formatted_html'] = BRS.formatOrderPricePerWholeQNT(transactionII.attachment.priceNQT, asset.decimals) + ' ' + BRS.valueSuffix
                    data['total_formatted_html'] = BRS.formatAmount(BRS.calculateOrderTotalNQT(transactionII.attachment.quantityQNT, transactionII.attachment.priceNQT)) + ' ' + BRS.valueSuffix
                    transactionEndLoad()
                })
                break;
            case 6:
                assetDetails = BRS.getAssetDetails(transaction.attachment.asset)
                if (!assetDetails) {
                    break;
                }
                data['asset_name_formatted_html'] = BRS.getAssetLink(assetDetails)
                data['quantity'] = [transaction.attachment.quantityQNT, assetDetails.decimals]
                break
            case 7:
                assetDetails = BRS.getAssetDetails(BRS.fullHashToId(transaction.referencedTransactionFullHash))
                if (!assetDetails) {
                    break;
                }
                data['asset_name_formatted_html'] = BRS.getAssetLink(assetDetails)
                break;
            case 8:
                peColoredCoinsDistributeToHolders()
                break;
            case 9:
                helperStr = ''
                for (let i=0; i< transaction.attachment.assetIds.length; i++) {
                    if (i !== 0) {
                        helperStr += '<br>'
                    }
                    foundAsset = BRS.getAssetDetails(transaction.attachment.assetIds[i])
                    if (foundAsset) {
                        helperStr += `${BRS.formatQuantity(transaction.attachment.quantitiesQNT[i], foundAsset.decimals)} ${BRS.getAssetLink(foundAsset)}`;
                    } else {
                        helperStr += `${transaction.attachment.quantityQNT} [QNT]`;
                    }
                }
                data['assets_transferred_formatted_html'] = helperStr
                break;
            }
        }

        function peColoredCoinsDistributeToHolders() {
            async = true
            data['toHoldersOf_formatted_html'] = transaction.attachment.asset
            data['distributingAsset_formatted_html'] = transaction.attachment.assetToDistribute
            data['distributingQuantity'] = transaction.attachment.quantityQNT
            data['youReceived'] = $.t('no')
            BRS.sendRequest('getIndirectIncoming', {
                transaction: transaction.transaction,
                account: BRS.account
            }, function (transactionII) {
                let userQuantity = '0'
                let userAmount = '0'
                if (transactionII.errorCode === undefined) {
                    userQuantity = transactionII.quantityQNT
                    userAmount = transactionII.amountNQT
                    data.youReceived = $.t('yes')
                }
                const foundAsset = BRS.getAssetDetails(transaction.attachment.asset)
                if (foundAsset) {
                    data.toHoldersOf_formatted_html = BRS.getAssetLink(foundAsset)
                }
                if (userAmount !== '0') {
                    data.amountToYou = BRS.formatAmount(userAmount) + ' ' + BRS.valueSuffix
                }
                if (transaction.attachment.assetToDistribute === '0') {
                    data.distributingAsset_formatted_html = $.t('no')
                    delete data.distributingQuantity
                } else {
                    const foundAsset2 =  BRS.getAssetDetails(transaction.attachment.assetToDistribute)
                    if (foundAsset2) {
                        data.distributingAsset_formatted_html = BRS.getAssetLink(foundAsset2)
                        data.distributingQuantity = BRS.convertToQNTf(data.distributingQuantity, foundAsset2.decimals) + " " + foundAsset2.name
                        if (userQuantity != 0) {
                            data.quantityToYou = BRS.convertToQNTf(userQuantity, foundAsset2.decimals) + " " + foundAsset2.name
                        }
                    } else {
                        if (userQuantity != 0) {
                            data.quantityToYou = BRS.convertToQNTf(userQuantity, '0') + ' [QNT]'
                        }
                    }
                }
                transactionEndLoad()
            })
        }

        function peDigitalGoods () {
            switch (transaction.subtype) {
            case 0:
                // marketplace listing
                delete data.sender_formatted_html
                data['seller'] = BRS.getAccountFormatted(transaction, 'sender')
                data['name'] = transaction.attachment.name
                data['description'] = transaction.attachment.description
                data['price'] = transaction.attachment.priceNQT
                data['quantity_formatted_html'] = BRS.format(transaction.attachment.quantity)
                break;
            case 1:
                // marketplace removal
                delete data.sender_formatted_html
                async = true
                BRS.sendRequest('getDGSGood', {
                    goods: transaction.attachment.goods
                }, function (goods) {
                    data['seller'] = BRS.getAccountFormatted(goods, 'seller')
                    data['item_name'] = goods.name
                    transactionEndLoad()
                })
                break;
            case 2:
                // marketplace item price change
                delete data.sender_formatted_html
                async = true
                BRS.sendRequest('getDGSGood', {
                    goods: transaction.attachment.goods
                }, function (goods) {
                    data['seller'] = BRS.getAccountFormatted(goods, 'seller')
                    data['item_name'] = goods.name
                    data['new_price_formatted_html'] = BRS.formatAmount(transaction.attachment.priceNQT) + ' ' + BRS.valueSuffix
                    transactionEndLoad()
                })
                break;
            case 3:
                // marketplace item quantity change
                delete data.sender_formatted_html
                async = true
                BRS.sendRequest('getDGSGood', {
                    goods: transaction.attachment.goods
                }, function (goods) {
                    data['seller'] = BRS.getAccountFormatted(goods, 'seller')
                    data['item_name'] = goods.name
                    data['delta_quantity'] = transaction.attachment.deltaQuantity,
                    transactionEndLoad()
                })
                break;
            case 4:
                peDigitalGoodsPurchase()
                break;
            case 5:
                peDigitalGoodsDelivery()
                break
            case 6:
                peDigitalGoodsFeedback()
                break;
            case 7:
                delete data.sender_formatted_html
                delete data.recipient_formatted_html
                async = true
                BRS.sendRequest('getDGSPurchase', {
                    purchase: transaction.attachment.purchase
                }, function (purchase) {
                    data['seller'] = BRS.getAccountFormatted(purchase, 'seller')
                    data['buyer'] = BRS.getAccountFormatted(purchase, 'buyer')
                    BRS.sendRequest('getDGSGood', {
                        goods: purchase.goods
                    }, function (goods) {
                        data['item_name'] = goods.name
                        const orderTotal = new BigInteger(String(purchase.quantity)).multiply(new BigInteger(String(purchase.priceNQT)))
                        data['order_total_formatted_html'] = BRS.formatAmount(orderTotal) + ' ' + BRS.valueSuffix
                        data['refund'] = transaction.attachment.refundNQT
                        transactionEndLoad()
                    })
                })
                break;
            }
        }

        function peDigitalGoodsPurchase () {
            // marketplace purchase
            delete data.sender_formatted_html
            delete data.recipient_formatted_html
            async = true
            BRS.sendRequest('getDGSGood', {
                goods: transaction.attachment.goods
            }, function (goods) {
                data['buyer'] = BRS.getAccountFormatted(transaction, 'sender'),
                data['seller'] = BRS.getAccountFormatted(goods, 'seller')
                data['item_name'] = goods.name
                data['price'] = transaction.attachment.priceNQT,
                data['quantity_formatted_html'] = BRS.format(transaction.attachment.quantity),
                BRS.sendRequest('getDGSPurchase', {
                    purchase: transaction.transaction
                }, function (purchase) {
                    let callout = ''
                    if (purchase.errorCode) {
                        if (purchase.errorCode == 4) {
                            callout = $.t('incorrect_purchase')
                        } else {
                            callout = String(purchase.errorDescription).escapeHTML()
                        }
                    } else {
                        if (BRS.account == transaction.recipient || BRS.account == transaction.sender) {
                            if (purchase.pending) {
                                if (BRS.account == transaction.recipient) {
                                    callout = "<a href='#' data-toggle='modal' data-target='#dgs_delivery_modal' data-purchase='" + String(transaction.transaction).escapeHTML() + "'>" + $.t('deliver_goods_q') + '</a>'
                                } else {
                                    callout = $.t('waiting_on_seller')
                                }
                            } else {
                                if (purchase.refundNQT) {
                                    callout = $.t('purchase_refunded')
                                } else {
                                    callout = $.t('purchase_delivered')
                                }
                            }
                        }
                    }
                    if (callout) {
                        $('#transaction_info_bottom').html("<div class='callout " + (purchase.errorCode ? 'callout-danger' : 'callout-info') + " callout-bottom'>" + callout + '</div>').show()
                    }
                    transactionEndLoad()
                })
            })
        }

        function peDigitalGoodsFeedback() {
            // marketplace feedback
            delete data.sender_formatted_html
            delete data.recipient_formatted_html
            async = true
            BRS.sendRequest('getDGSPurchase', {
                purchase: transaction.attachment.purchase
            }, function (purchase) {
                data['seller'] = BRS.getAccountFormatted(purchase, 'seller')
                data['buyer'] = BRS.getAccountFormatted(purchase, 'buyer')
                BRS.sendRequest('getDGSGood', {
                    goods: purchase.goods
                }, function (goods) {
                    data['item_name'] = goods.name
                    if (purchase.seller != BRS.account && purchase.buyer != BRS.account) {
                        transactionEndLoad()
                        return
                    }
                    BRS.sendRequest('getDGSPurchase', {
                        purchase: transaction.attachment.purchase
                    }, function (purchase) {
                        let callout
                        if (purchase.buyer == BRS.account) {
                            if (purchase.refundNQT) {
                                callout = $.t('purchase_refunded')
                            }
                        } else {
                            if (!purchase.refundNQT) {
                                callout = "<a href='#' data-toggle='modal' data-target='#dgs_refund_modal' data-purchase='" + String(transaction.attachment.purchase).escapeHTML() + "'>" + $.t('refund_this_purchase_q') + '</a>'
                            } else {
                                callout = $.t('purchase_refunded')
                            }
                        }
                        if (callout) {
                            $('#transaction_info_bottom').append("<div class='callout callout-info callout-bottom'>" + callout + '</div>').show()
                        }
                        transactionEndLoad()
                    })
                })
            })
        }

        function peDigitalGoodsDelivery() {
            // marketplace delivery
            delete data.sender_formatted_html
            delete data.recipient_formatted_html
            async = true
            BRS.sendRequest('getDGSPurchase', {
                purchase: transaction.attachment.purchase
            }, function (purchase) {
                data['seller'] = BRS.getAccountFormatted(purchase, 'seller')
                data['buyer'] = BRS.getAccountFormatted(purchase, 'buyer')
                BRS.sendRequest('getDGSGood', {
                    goods: purchase.goods
                }, function (goods) {
                    data['item_name'] = goods.name
                    data['price'] = purchase.priceNQT
                    data['quantity_formatted_html'] = BRS.format(purchase.quantity)
                    if (purchase.quantity != '1') {
                        const orderTotal = BRS.formatAmount(new BigInteger(String(purchase.quantity)).multiply(new BigInteger(String(purchase.priceNQT))))
                        data['total_formatted_html'] = orderTotal + ' ' + BRS.valueSuffix
                    }
                    if (transaction.attachment.discountNQT) {
                        data['discount'] = transaction.attachment.discountNQT
                    }
                    if (transaction.attachment.goodsData) {
                        if (BRS.account == purchase.seller || BRS.account == purchase.buyer) {
                            BRS.tryToDecrypt(transaction, {
                                goodsData: {
                                    title: $.t('data'),
                                    nonce: 'goodsNonce'
                                }
                            }, (purchase.buyer == BRS.account ? purchase.seller : purchase.buyer))
                        } else {
                            data['data'] = $.t('encrypted_goods_data_no_permission')
                        }
                    }
                    let callout
                    if (BRS.account == purchase.buyer) {
                        if (purchase.refundNQT) {
                            callout = $.t('purchase_refunded')
                        } else if (!purchase.feedbackNote) {
                            callout = $.t('goods_received') + " <a href='#' data-toggle='modal' data-target='#dgs_feedback_modal' data-purchase='" + String(transaction.attachment.purchase).escapeHTML() + "'>" + $.t('give_feedback_q') + '</a>'
                        }
                    } else if (BRS.account == purchase.seller && purchase.refundNQT) {
                        callout = $.t('purchase_refunded')
                    }
                    if (callout) {
                        $('#transaction_info_bottom').append("<div class='callout callout-info callout-bottom'>" + callout + '</div>').show()
                    }
                    transactionEndLoad()
                })
            })
        }

        function processMessage () {
            // Decode message
            if (transaction.attachment === undefined) {
                return
            }
            const $output = $('#transaction_info_output_bottom')
            $output.html('');
            let showMessage = false;
            if (transaction.attachment.message) {
                if (!transaction.attachment['version.Message']) {
                    try {
                        message = converters.hexStringToString(transaction.attachment.message)
                    } catch (err) {
                        // legacy
                        if (transaction.attachment.message.indexOf('feff') === 0) {
                            message = BRS.convertFromHex16(transaction.attachment.message)
                        } else {
                            message = BRS.convertFromHex8(transaction.attachment.message)
                        }
                    }
                } else {
                    message = String(transaction.attachment.message)
                }
                let outHTML = "<div style='color:#999999;padding-bottom:10px'>"
                outHTML += `<i class='fas fa-unlock'></i>${$.t('public_message')}</div>`
                if (transaction.attachment.messageIsText === true) {
                    outHTML += `<div class='modal-text-box'>${String(message).escapeHTML().nl2br()}</div>`
                } else {
                    // Show both bytes and try to decode string
                    outHTML += `<label>${$.t('bytes')}:</label>`
                    outHTML += `<div class='modal-text-box'>${String(message).escapeHTML().nl2br()}</div>`
                    outHTML += `<label>${$.t('text')}:</label>`
                    outHTML += `<div class='modal-text-box'>${String(converters.hexStringToString(message)).escapeHTML().nl2br()}</div>`
                }
                $output.append(outHTML);
                showMessage = true
            }
            if (transaction.attachment.encryptedMessage || (transaction.attachment.encryptToSelfMessage && BRS.account == transaction.sender)) {
                $output.append("<div id='transaction_info_decryption_form'></div><div id='transaction_info_decryption_output' style='display:none;'></div>")
                showMessage = true
                if (BRS.account == transaction.recipient || BRS.account == transaction.sender) {
                    const fieldsToDecrypt = {}
                    if (transaction.attachment.encryptedMessage) {
                        fieldsToDecrypt.encryptedMessage = $.t('encrypted_message')
                    }
                    if (transaction.attachment.encryptToSelfMessage && BRS.account == transaction.sender) {
                        fieldsToDecrypt.encryptToSelfMessage = $.t('note_to_self')
                    }
                    BRS.tryToDecrypt(transaction, fieldsToDecrypt, (transaction.recipient == BRS.account ? transaction.sender : transaction.recipient), {
                        noPadding: true,
                        formEl: '#transaction_info_decryption_form',
                        outputEl: '#transaction_info_decryption_output'
                    })
                } else {
                    $output.append("<div>" + $.t('encrypted_message_no_permission') + '</div>')
                }
            }
            if (showMessage) {
                $output.show();
            }
        }

        processTransactionModalDataMain()
    }

    return BRS;
}(BRS || {}, jQuery));