/**
 * @depends {brs.js}
 */
var BRS = (function(BRS, $, undefined) {
    var _password;

    BRS.multiQueue = null;

    BRS.setServerPassword = function(password) {
        _password = password;
    };

    BRS.getServerPassword = function() {
        return _password
    }

    BRS.sendOutsideRequest = function(url, data, callback, async) {
        if ($.isFunction(data)) {
            async = callback;
            callback = data;
            data = {};
        } else {
            data = data || {};
        }

        $.support.cors = true;

        $.ajax({
            url: url,
            crossDomain: true,
            dataType: "json",
            type: "GET",
            timeout: 30000,
            async: (async === undefined ? true : async),
            data: data
        }).done(function(json) {
            //why is this necessary??..
            if (json.errorCode && !json.errorDescription) {
                json.errorDescription = (json.errorMessage ? json.errorMessage : $.t("server_error_unknown"));
            }
            if (callback) {
                callback(json, data);
            }
        }).fail(function(xhr, textStatus, error) {
            if (callback) {
                callback({
                    "errorCode": -1,
                    "errorDescription": error
                }, {});
            }
        });
    };

    BRS.sendRequest = function(requestType, data, callback, async) {
        if (requestType === undefined) {
            return;
        }

        if ($.isFunction(data)) {
            async = callback;
            callback = data;
            data = {};
        } else {
            data = data || {};
        }

        $.each(data, function(key, val) {
            if (key != "secretPhrase") {
                if (typeof val == "string") {
                    data[key] = $.trim(val);
                }
            }
        });

        //convert NXT to NQT...
        try {
            var nxtFields = ["feeNXT", "amountNXT", "priceNXT", "refundNXT", "discountNXT", "minActivationAmountNXT"];

            for (var i = 0; i < nxtFields.length; i++) {
                var nxtField = nxtFields[i];
                var field = nxtField.replace("NXT", "");

                if (nxtField in data) {
                    data[field + "NQT"] = BRS.convertToNQT(data[nxtField]);
                    delete data[nxtField];
                }
            }
        } catch (err) {
            if (callback) {
                callback({
                    "errorCode": 1,
                    "errorDescription": err + " (Field: " + field + ")"
                });
            }

            return;
        }

        if (!data.recipientPublicKey) {
            delete data.recipientPublicKey;
        }
        if (!data.referencedTransactionFullHash) {
            delete data.referencedTransactionFullHash;
        }

        //gets account id from passphrase client side, used only for login.
        if (requestType == "getAccountId") {
            var accountId = BRS.getAccountId(data.secretPhrase);

            var nxtAddress = new NxtAddress(BRS.prefix);
            var accountRS;

            if (nxtAddress.set(accountId)) {
                accountRS = nxtAddress.toString();
            } else {
                accountRS = "";
            }

            if (callback) {
                callback({
                    "account": accountId,
                    "accountRS": accountRS
                });
            }
            return;
        }

        //check to see if secretPhrase supplied matches logged in account, if not - show error.
        if ("secretPhrase" in data) {
            accountId = BRS.getAccountId(BRS.rememberPassword ? _password : data.secretPhrase);
            if (accountId != BRS.account) {
                if (callback) {
                    callback({
                        "errorCode": 1,
                        "errorDescription": $.t("error_passphrase_incorrect")
                    });
                }
                return;
            } else {
                //ok, accountId matches..continue with the real request.
                BRS.processAjaxRequest(requestType, data, callback, async);
            }
        } else {
            BRS.processAjaxRequest(requestType, data, callback, async);
        }
    };

    BRS.processAjaxRequest = function(requestType, data, callback, async) {
        if (!BRS.multiQueue) {
            BRS.multiQueue = $.ajaxMultiQueue(8);
        }
        var extra;
        if (data._extra) {
            extra = data._extra;
            delete data._extra;
        } else {
            extra = null;
        }

        var currentPage = null;
        var currentSubPage = null;

        //means it is a page request, not a global request.. Page requests can be aborted.
        if (requestType.slice(-1) == "+") {
            requestType = requestType.slice(0, -1);
            currentPage = BRS.currentPage;
        } else {
            //not really necessary... we can just use the above code..
            var plusCharacter = requestType.indexOf("+");

            if (plusCharacter > 0) {
                var subType = requestType.substr(plusCharacter);
                requestType = requestType.substr(0, plusCharacter);
                currentPage = BRS.currentPage;
            }
        }

        if (currentPage && BRS.currentSubPage) {
            currentSubPage = BRS.currentSubPage;
        }

        var type = (("secretPhrase" in data) || (data.broadcast == "false") ) ? "POST" : "GET";
        var url = BRS.server + "/burst?requestType=" + requestType;

        if (type == "GET") {
            // rico666: gives us lots (thousands) of connection refused messages in the UI
            // has been there for ages, no clear function visible
            //   if (typeof data == "string") {
            //	data += "&random=" + Math.random();
            //    }
            //    else {
            data._ = $.now();
            //    }
        }

        var secretPhrase = "";

        //unknown account..
        if (type == "POST" && (BRS.accountInfo.errorCode && BRS.accountInfo.errorCode == 5)) {
            if (callback) {
                callback({
                    "errorCode": 2,
                    "errorDescription": $.t("error_new_account")
                }, data);
            } else {
                $.notify($.t("error_new_account"), {
                    type: 'danger',
                    offset: {
                        x: 5,
                        y: 60
                        }
                });
            }
            return;
        }

        if (data.referencedTransactionFullHash) {
            if (!/^[a-z0-9]{64}$/.test(data.referencedTransactionFullHash)) {
                if (callback) {
                    callback({
                        "errorCode": -1,
                        "errorDescription": $.t("error_invalid_referenced_transaction_hash")
                    }, data);
                } else {
                    $.notify($.t("error_invalid_referenced_transaction_hash"), {
                        type: 'danger',
                        offset: {
                            x: 5,
                            y: 60
                            }
                    });
                }
                return;
            }
        }

        if (type == "POST") {
            if (BRS.rememberPassword) {
                secretPhrase = _password;
            } else {
                secretPhrase = data.secretPhrase;
            }

            delete data.secretPhrase;

            if (BRS.accountInfo && BRS.accountInfo.publicKey) {
                data.publicKey = BRS.accountInfo.publicKey;
            } else {
                data.publicKey = BRS.generatePublicKey(secretPhrase);
                BRS.accountInfo.publicKey = data.publicKey;
            }
        }

        $.support.cors = true;

        if (type == "GET") {
            var ajaxCall = BRS.multiQueue.queue;
        } else {
            var ajaxCall = $.ajax;
        }

        // the recipient param is used to do some message encryption ... so I can not remove it as I thought first
        requestTypeWithNonWalletCompatibleRecipientParam = ["dgsPurchase", "dgsRefund", "dgsDelivery", "dgsFeedback", "buyAlias"];
        if ( requestTypeWithNonWalletCompatibleRecipientParam.indexOf(requestType) + 1 ) {
            delete data.recipient;
        }

        //workaround for 1 specific case.. ugly
        if (data.querystring) {
            data = data.querystring;
            type = "POST";
        }

        if (requestType == "broadcastTransaction") {
            type = "POST";
        }
        async = (async === undefined ? true : async);
        if (async === false && type == "GET") {
            url += "&" + $.param(data);
            var client = new XMLHttpRequest();
            client.open("GET", url, false);
            client.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
            client.data = data;
            client.send();
            var response = JSON.parse(client.responseText);
            callback(response, data);
        } else {
            ajaxCall({
                url: url,
                crossDomain: true,
                dataType: "json",
                type: type,
                timeout: 30000,
                async: true,
                currentPage: currentPage,
                currentSubPage: currentSubPage,
                shouldRetry: (type == "GET" ? 2 : undefined),
                data: data
            }).done(function(response, status, xhr) {
                if (BRS.console) {
                    BRS.addToConsole(this.url, this.type, this.data, response);
                }

                response.unconfirmed = false;
                switch (requestType) {
                case "getTransaction":
                    if (!response.errorCode) {
                        if (response.block === undefined) {
                            response.unconfirmed = true;
                        } else {
                            response.unconfirmed = false;
                        }
                    }
                    break;
                case "getUnconfirmedTransactions":
                    if (response.unconfirmedTransactions) {

                        response.unconfirmedTransactions.forEach(transaction => transaction.unconfirmed = true)
                    }
                    break;
                case "getAccountTransactions":
                    if (response.transactions) {
                        response.transactions.forEach(trans => {
                            if (trans.block === undefined) {
                                trans.unconfirmed = true;
                            } else {
                                trans.unconfirmed = false;
                            }
                        })
                    }
                }

                if (typeof data == "object" && "recipient" in data) {
                  var address = new NxtAddress();
                    if (/^BURST\-/i.test(data.recipient)) {
                        data.recipientRS = data.recipient;

                        if (address.set(data.recipient)) {
                            data.recipient = address.account_id();
                        }
                    } else {

                        if (address.set(data.recipient)) {
                            data.recipientRS = address.toString();
                        }
                    }
                }

                if (secretPhrase && response.unsignedTransactionBytes && !response.errorCode && !response.error) {
                    var publicKey = BRS.generatePublicKey(secretPhrase);
                    var signature = BRS.signBytes(response.unsignedTransactionBytes, converters.stringToHexString(secretPhrase));

                    if (!BRS.verifyBytes(signature, response.unsignedTransactionBytes, publicKey)) {
                        if (callback) {
                            callback({
                                "errorCode": 1,
                                "errorDescription": $.t("error_signature_verification_client")
                            }, data);
                        } else {
                            $.notify($.t("error_signature_verification_client"), {
                                type: 'danger',
                                offset: {
                                    x: 5,
                                    y: 60
                                    }
                            });
                        }
                        return;
                    } else {
                        const payload = BRS.verifyAndSignTransactionBytes(response.unsignedTransactionBytes, signature, requestType, data);

                        if (payload.length === 0) {
                            if (callback) {
                                callback({
                                    "errorCode": 1,
                                    "errorDescription": $.t("error_signature_verification_server")
                                }, data);
                            } else {
                                $.notify($.t("error_signature_verification_server"), {
                                    type: 'danger',
                                    offset: {
                                        x: 5,
                                        y: 60
                                        }
                                });
                            }
                            return;
                        } else {
                            if (data.broadcast == "false") {
                                response.transactionBytes = payload;
                                BRS.showRawTransactionModal(response);
                            } else {
                                if (callback) {
                                    if (extra) {
                                        data._extra = extra;
                                    }

                                    BRS.broadcastTransactionBytes(payload, callback, response, data);
                                } else {
                                    BRS.broadcastTransactionBytes(payload, null, response, data);
                                }
                            }
                        }
                    }
                } else {
                    if (response.errorCode || response.errorDescription || response.errorMessage || response.error) {
                        response.errorDescription = BRS.translateServerError(response);
                        delete response.fullHash;
                        if (!response.errorCode) {
                            response.errorCode = -1;
                        }
                    }

                    /*
		  if (response.errorCode && !response.errorDescription) {
		  response.errorDescription = (response.errorMessage ? response.errorMessage : $.t("error_unknown"));
		  }
                  else if (response.error && !response.errorDescription) {
		  response.errorDescription = (typeof response.error == "string" ? response.error : $.t("error_unknown"));
		  if (!response.errorCode) {
		  response.errorCode = 1;
		  }
		  }
		*/

                    if (response.broadcasted === false) {
                        BRS.showRawTransactionModal(response);
                    } else {
                        if (callback) {
                            if (extra) {
                                data._extra = extra;
                            }
                            callback(response, data);
                        }
                        if (data.referencedTransactionFullHash && !response.errorCode) {
                            $.notify($.t("info_referenced_transaction_hash"), {
                                type: 'info',
                                offset: {
                                       x: 5,
                                       y: 60
                                        }
                            });
                        }
                    }
                }
            }).fail(function(xhr, textStatus, error) {
                if (BRS.console) {
                    BRS.addToConsole(this.url, this.type, this.data, error, true);
                }

                if ((error == "error" || textStatus == "error") && (xhr.status == 404 || xhr.status === 0)) {
                    if (type == "POST") {
                        $.notify($.t("error_server_connect"), {
                            type: 'danger',
                            offset: 10
                        });
                    }
                }

                if (error == "abort") {
                    return;
                } else if (callback) {
                    if (error == "timeout") {
                        error = $.t("error_request_timeout");
                    }
                    callback({
                        "errorCode": -1,
                        "errorDescription": error
                    }, {});
                }
            });
        }
    };
    BRS.verifyAndSignTransactionBytes = function(transactionBytes, signature, requestType, data) {
        // this will be the reconstructed base transaction
        const transaction = {};
        // position to start attachment (if any)
        let pos = 184;
        const byteArray = converters.hexStringToByteArray(transactionBytes);
        // This will bring the info to check type, subtype and attachment for a given requestType
        let attachmentSpec
        const ERROR = true
        const SUCCESS = false

        function verifyAndSignTransactionBytesMain () {
            createBaseTransaction()
            prepareData()
            attachmentSpec = getAttachmentSpec(requestType)
            if (checkBaseTransaction()) return ''
            if (checkAttachment()) return ''
            if (checkMessage()) return ''
            if (checkEncryptedMessage()) return ''
            if (checkRecipientPublicKey()) return ''
            if (checkEncryptToSelfMessage()) return ''
            return transactionBytes.substr(0, 192) + signature + transactionBytes.substr(320);
        }

        function createBaseTransaction () {
            transaction.type = byteArray[0];
            transaction.version = (byteArray[1] & 0xF0) >> 4;
            transaction.subtype = byteArray[1] & 0x0F;
            transaction.timestamp = String(converters.byteArrayToSignedInt32(byteArray, 2));
            transaction.deadline = String(converters.byteArrayToSignedShort(byteArray, 6));
            transaction.publicKey = converters.byteArrayToHexString(byteArray.slice(8, 40));
            transaction.recipient = String(converters.byteArrayToBigInteger(byteArray, 40));
            transaction.amountNQT = String(converters.byteArrayToBigInteger(byteArray, 48));
            transaction.feeNQT = String(converters.byteArrayToBigInteger(byteArray, 56));
            transaction.referencedTransactionFullHash = converters.byteArrayToHexString(byteArray.slice(64, 96));
            if (transaction.referencedTransactionFullHash == "0000000000000000000000000000000000000000000000000000000000000000") {
                transaction.referencedTransactionFullHash = "";
            }
            transaction.flags = 0;
            if (transaction.version > 0) {
                transaction.flags = converters.byteArrayToSignedInt32(byteArray, 160);
                transaction.ecBlockHeight = String(converters.byteArrayToSignedInt32(byteArray, 164));
                transaction.ecBlockId = String(converters.byteArrayToBigInteger(byteArray, 168));
            }
        }

        function prepareData() {
            if (!("amountNQT" in data)) {
                data.amountNQT = "0";
            }
            if (!("recipient" in data)) {
                data.recipient = "0";
                data.recipientRS = BRS.prefix + "2222-2222-2222-22222";
            }
            if (BRS.rsRegEx.test(data.recipient)) {
                // wrong data type... Fix
                const parts = BRS.rsRegEx.exec(data.recipient)
                const address = new NxtAddress(BRS.prefix)
                if (address.set(parts[1] + parts[2]) === false) {
                    return
                }
                data.recipient = address.account_id();
                data.recipientRS = address.toString();
            }
        }

        function checkBaseTransaction () {
            if (transaction.publicKey != BRS.accountInfo.publicKey ||
                transaction.deadline !== data.deadline ||
                transaction.feeNQT !== data.feeNQT ||
                transaction.version === 0 ||
                transaction.type !== attachmentSpec.type ||
                transaction.subtype !== attachmentSpec.subtype)
            {
                return ERROR;
            }
            if (transaction.recipient !== data.recipient) {
                const requestTypeWithoutRecipientInData = ["buyAlias"]
                if (requestTypeWithoutRecipientInData.indexOf(requestType) == -1) {
                    return ERROR;
                }
            }
            if ( transaction.amountNQT !== data.amountNQT) {
                // These transactions check data.amountNQT in attachment or thru postCheck()
                const requestTypeWithSeperatedAmountNQTCalculation = ["sendMoneyMulti", "sendMoneyMultiSame", "sendMoneyEscrow", "addCommitment", "removeCommitment" ];
                if (requestTypeWithSeperatedAmountNQTCalculation.indexOf(requestType) === -1) {
                    return ERROR;
                }
            }
            if ("referencedTransactionFullHash" in data) {
                if (transaction.referencedTransactionFullHash !== data.referencedTransactionFullHash) {
                    return ERROR;
                }
            } else if (transaction.referencedTransactionFullHash !== "") {
                return ERROR;
            }
            return SUCCESS
        }

        function getAttachmentSpec(rqType) {
            switch (rqType) {
            case "sendMoney":
                return { "type": 0, "subtype": 0 }
            case "sendMoneyMulti":
                return {
                    "type":    0,
                    "subtype": 1,
                    "attachmentInfo": [
                        { type: "Byte*1", value: [data.recipients.split(";").length] },
                        { type: "Long:Long*$0", value: data.recipients.split(";") }
                    ],
                    postCheck () {
                        let sum = 0n;
                        for (const eachRecipient of data.recipients.split(";")) {
                            sum += BigInt(eachRecipient.split(":")[1])
                        }
                        if (transaction.amountNQT !== sum.toString(10)) return ERROR;
                        return SUCCESS
                    }
                }
            case "sendMoneyMultiSame":
                return {
                    "type":    0,
                    "subtype": 2,
                    "attachmentInfo": [
                        { type: "Byte*1", value: [data.recipients.split(";").length]},
                        { type: "Long*$0", value: data.recipients.split(";") }
                    ],
                    postCheck () {
                        const totalAmount = BigInt(data.recipients.split(";").length) *  BigInt(data.amountNQT)
                        if (transaction.amountNQT !== totalAmount.toString(10)) return ERROR
                        return SUCCESS
                    }
                }
            case "sendMessage":
                return { "type": 1, "subtype": 0 }
            case "setAlias":
                return {
                    "type":    1,
                    "subtype": 1,
                    "attachmentInfo": [
                        { type: "ByteString*1", value: [data.aliasName] },
                        { type: "ShortString*1", value: [data.aliasURI] }
                    ]
                }
            case "setAccountInfo": 
                return {
                    "type":    1,
                    "subtype": 5,
                    "attachmentInfo":  [
                        { type: "ByteString*1", value: [data.name] },
                        { type: "ShortString*1", value: [data.description] }
                    ]
                }
            case "sellAlias":
                return {
                    "type":    1,
                    "subtype": 6,
                    "attachmentInfo": [
                        { type: "ByteString*1", value: [data.aliasName] },
                        { type: "Long*1", value: [data.priceNQT] }
                    ]
                }
            case "buyAlias":
                return {
                    "type":    1,
                    "subtype": 7,
                    "attachmentInfo": [
                        { type: "ByteString*1", value: [data.aliasName] }
                    ]
                }
            case "issueAsset": 
                return {
                    "type":    2,
                    "subtype": 0,
                    "attachmentInfo":   [
                        { type: "ByteString*1", value: [data.name] },
                        { type: "ShortString*1", value: [data.description] },
                        { type: "Long*1", value: [data.quantityQNT] },
                        { type: "Byte*1", value: [data.decimals] }
                    ]
                }
            case "transferAsset":
                    return {
                    "type":    2,
                    "subtype": 1,
                    "attachmentInfo":   [
                        { type: "Long*1", value: [data.asset] },
                        { type: "Long*1", value: [data.quantityQNT] }
                    ]
                }
            case "placeAskOrder":
                return {
                    "type":    2,
                    "subtype": 2,
                    "attachmentInfo":   [
                        { type: "Long*1", value: [data.asset] },
                        { type: "Long*1", value: [data.quantityQNT] },
                        { type: "Long*1", value: [data.priceNQT] }
                    ]
                }
            case "placeBidOrder":
                return {
                    "type":    2,
                    "subtype": 3,
                    "attachmentInfo":   [
                        { type: "Long*1", value: [data.asset] },
                        { type: "Long*1", value: [data.quantityQNT] },
                        { type: "Long*1", value: [data.priceNQT] }
                    ]
                }
            case "cancelAskOrder":
                return {
                    "type":    2,
                    "subtype": 4,
                    "attachmentInfo":   [
                        { type: "Long*1", value:  [data.order] }
                    ]
                }
            case "cancelBidOrder":
                return {
                    "type":    2,
                    "subtype": 5,
                    "attachmentInfo":   [
                        { type: "Long*1", value:  [data.order] }
                    ]
                }
            case "transferAssetMulti":
                return {
                    "type":    2,
                    "subtype": 9,
                    "attachmentInfo":   [
                        { type: "Byte*1", value: [data.assetIdsAndQuantities.split(";").length] },
                        { type: "Long:Long*$0", value: data.assetIdsAndQuantities.split(";") }
                    ]
                }
            case "setRewardRecipient":
                return { "type": 20, "subtype": 0 }
            case "addCommitment": 
                return {
                    "type": 20,
                    "subtype": 1,
                    "attachmentInfo": [
                        { type: "Long*1", value: [data.amountNQT] }
                    ]
                }
            case "removeCommitment":
                return  {
                    "type": 20,
                    "subtype": 2,
                    "attachmentInfo": [
                        { type: "Long*1", value: [data.amountNQT] }
                    ]
                }
            case "sendMoneyEscrow": 
                return {
                    "type":    21,
                    "subtype": 0,
                    "attachmentInfo": [
                        { type: "Long*1", value: [data.amountNQT] },
                        { type: "Int*1", value: [data.escrowDeadline] },
                        { type: "Byte*1", value: [["undecided", "release", "refund", "split"].indexOf(data.deadlineAction)] },
                        { type: "Byte*1", value: [data.requiredSigners] },
                        { type: "Byte*1", value: [data.signers.split(";").length] },
                        { type: "Long*$4", value: data.signers.split(";") }
                    ]
                }
            case "escrowSign":
                return {
                    "type":    21,
                    "subtype": 1,
                    "attachmentInfo": [
                        { type: "Long*1", value: [data.escrow] },
                        { type: "Byte*1", value: [["undecided", "release", "refund", "split"].indexOf(data.decision)] }
                    ]
                }
            case "sendMoneySubscription":
                return {
                    "type":    21,
                    "subtype": 3,
                    "attachmentInfo":   [
                        { type: "Int*1", value: [data.frequency] }
                    ]
                }
            case "subscriptionCancel":
                return {
                    "type":    21,
                    "subtype": 4,
                    "attachmentInfo":   [
                        { type: "Long*1", value: [data.subscription] }
                    ]
                }
            default:
                return {
                    "type":    -1,
                    "subtype": -1,
                }
            }
        };

        function checkAttachment () {
            const pastValues = [];
            if ( attachmentSpec.attachmentInfo === undefined) {
                return SUCCESS
            }
            const attachmentVersion = byteArray[pos]
            pos++;
            if (attachmentVersion !== 1) {
                return ERROR
            }
            for (const item of attachmentSpec.attachmentInfo) {
                const itemType = item.type.split("*")
                const typeSpec = itemType[0];
                const repetitionSpec = itemType[1]
                let repetition
                if (repetitionSpec.startsWith("$")) {
                    // variable repetition, depending on previous element
                    repetition = parseInt(pastValues[repetitionSpec.substring(1)][0])
                } else {
                    // fixed repetition
                    repetition = parseInt(repetitionSpec)
                }
                const currentValues = [];
                let sizeOfString
                for (let amount = 0; amount < repetition; amount++ ) {
                    switch (typeSpec) {
                    case "ByteString":
                        sizeOfString = parseInt(byteArray[pos++], 10)
                        currentValues.push(converters.byteArrayToString(byteArray, pos, sizeOfString));
                        pos += sizeOfString
                        break;
                    case "ShortString":
                        sizeOfString = converters.byteArrayToSignedShort(byteArray, pos)
                        pos += 2
                        currentValues.push(converters.byteArrayToString(byteArray, pos, sizeOfString));
                        pos += sizeOfString
                        break;
                    case "Long:Long":
                        currentValues.push(
                            converters.byteArrayToBigInteger(byteArray, pos).toString() +
                            ":" +
                            converters.byteArrayToBigInteger(byteArray, pos + 8).toString()
                        );
                        pos += 16;
                        break;
                    case "Long":
                        currentValues.push(converters.byteArrayToBigInteger(byteArray, pos).toString());
                        pos += 8;
                        break;
                    case "Int":
                        currentValues.push(converters.byteArrayToSignedInt32(byteArray, pos).toString());
                        pos += 4;
                        break;
                    case "Short":
                        currentValues.push(converters.byteArrayToSignedShort(byteArray, pos).toString());
                        pos += 2;
                        break;
                    case "Byte":
                        currentValues.push(byteArray[pos].toString());
                        pos++;
                        break;
                    default:
                        return ERROR;
                    }
                }
                for (const eachVal of item.value) {
                    // Maybe the order was changed. Search all items...
                    if (currentValues.find(eachParsed => eachParsed === String(eachVal)) === undefined) {
                        return ERROR
                    }
                }
                // ... and ensure no item was added
                if (item.value.length !== currentValues.length) {
                    return ERROR
                }
                pastValues.push(currentValues);
            }
            if ( attachmentSpec.postCheck ) {
                return attachmentSpec.postCheck()
            }
            return SUCCESS;
        }

        function checkMessage() {
            // flag for non-encrypted message
            const flagBit = 0b1;
            if ((transaction.flags & flagBit) === 0) {
                if (data.message) return ERROR
                else return SUCCESS
            }
            const attachmentVersion = byteArray[pos];
            pos++;
            if (attachmentVersion !== 1) {
                return ERROR
            }
            let messageLength = converters.byteArrayToSignedInt32(byteArray, pos);
            pos += 4;
            transaction.messageIsText = messageLength < 0;
            if (messageLength < 0) {
                messageLength &= 2147483647;
            }
            if (transaction.messageIsText) {
                transaction.message = converters.byteArrayToString(byteArray, pos, messageLength);
            } else {
                const slice = byteArray.slice(pos, pos + messageLength);
                transaction.message = converters.byteArrayToHexString(slice);
            }
            pos += messageLength;
            const messageIsText = (transaction.messageIsText ? "true" : "false");
            if (messageIsText != data.messageIsText) {
                return ERROR;
            }
            if (transaction.message !== data.message) {
                return ERROR;
            }
            return SUCCESS
        }

        function checkEncryptedMessage() {
            // flag for encrypted note
            const flagBit = 0b10;
            if ((transaction.flags & flagBit) === 0) {
                if (data.encryptedMessageData) return ERROR
                else return SUCCESS
            }
            const attachmentVersion = byteArray[pos];
            pos++;
            if (attachmentVersion !== 1) {
                return ERROR
            }
            let encryptedMessageLength = converters.byteArrayToSignedInt32(byteArray, pos);
            pos += 4;
            transaction.messageToEncryptIsText = encryptedMessageLength < 0;
            if (encryptedMessageLength < 0) {
                encryptedMessageLength &= 2147483647;
            }
            transaction.encryptedMessageData = converters.byteArrayToHexString(byteArray.slice(pos, pos + encryptedMessageLength));
            pos += encryptedMessageLength;
            transaction.encryptedMessageNonce = converters.byteArrayToHexString(byteArray.slice(pos, pos + 32));
            pos += 32;
            const messageToEncryptIsText = (transaction.messageToEncryptIsText ? "true" : "false");
            if (messageToEncryptIsText != data.messageToEncryptIsText) {
                return ERROR;
            }
            if (transaction.encryptedMessageData !== data.encryptedMessageData ||
                transaction.encryptedMessageNonce !== data.encryptedMessageNonce) {
                return ERROR;
            }
            return SUCCESS
        }

        function checkRecipientPublicKey () {
            const flagBit = 0b100;
            if ((transaction.flags & flagBit) === 0) {
                if (data.recipientPublicKey) return ERROR
                else return SUCCESS
            }
            const attachmentVersion = byteArray[pos];
            pos++;
            if (attachmentVersion !== 1) {
                return ERROR
            }
            const recipientPublicKey = converters.byteArrayToHexString(byteArray.slice(pos, pos + 32));
            pos += 32;
            if (recipientPublicKey != data.recipientPublicKey) {
                return ERROR;
            }
            return SUCCESS
        }

        function checkEncryptToSelfMessage() {
            const flagBit = 0b1000;
            if ((transaction.flags & flagBit) === 0) {
                if (data.encryptToSelfMessageData) return ERROR
                else return false
            }
            const attachmentVersion = byteArray[pos];
            pos++;
            if (attachmentVersion !== 1) {
                return ERROR
            }
            let encryptedToSelfMessageLength = converters.byteArrayToSignedInt32(byteArray, pos);
            transaction.messageToEncryptToSelfIsText = encryptedToSelfMessageLength < 0;
            if (encryptedToSelfMessageLength < 0) {
                encryptedToSelfMessageLength &= 2147483647;
            }
            pos += 4;
            transaction.encryptToSelfMessageData = converters.byteArrayToHexString(byteArray.slice(pos, pos + encryptedToSelfMessageLength));
            pos += encryptedToSelfMessageLength;
            transaction.encryptToSelfMessageNonce = converters.byteArrayToHexString(byteArray.slice(pos, pos + 32));
            pos += 32;
            const messageToEncryptToSelfIsText = (transaction.messageToEncryptToSelfIsText ? "true" : "false");
            if (messageToEncryptToSelfIsText != data.messageToEncryptToSelfIsText) {
                return ERROR;
            }
            if (transaction.encryptToSelfMessageData !== data.encryptToSelfMessageData ||
                transaction.encryptToSelfMessageNonce !== data.encryptToSelfMessageNonce) {
                return ERROR;
            }
            return SUCCESS
        }

        return verifyAndSignTransactionBytesMain()
    };

    BRS.broadcastTransactionBytes = function(transactionData, callback, originalResponse, originalData) {
        $.ajax({
            url: BRS.server + "/burst?requestType=broadcastTransaction",
            crossDomain: true,
            dataType: "json",
            type: "POST",
            timeout: 30000,
            async: true,
            data: {
                "transactionBytes": transactionData
            }
        }).done(function(response, status, xhr) {
            if (BRS.console) {
                BRS.addToConsole(this.url, this.type, this.data, response);
            }

            if (callback) {
                if (response.errorCode) {
                    if (!response.errorDescription) {
                        response.errorDescription = (response.errorMessage ? response.errorMessage : "Unknown error occured.");
                    }
                    callback(response, originalData);
                } else if (response.error) {
                    response.errorCode = 1;
                    response.errorDescription = response.error;
                    callback(response, originalData);
                } else {
                    if ("transactionBytes" in originalResponse) {
                        delete originalResponse.transactionBytes;
                    }
                    originalResponse.broadcasted = true;
                    originalResponse.transaction = response.transaction;
                    originalResponse.fullHash = response.fullHash;
                    callback(originalResponse, originalData);
                    if (originalData.referencedTransactionFullHash) {
                        $.notify($.t("info_referenced_transaction_hash"), {
                            type: 'info',
                            offset: {
                                   x: 5,
                                   y: 60
                                    }
                        });
                    }
                }
            }
        }).fail(function(xhr, textStatus, error) {
            if (BRS.console) {
                BRS.addToConsole(this.url, this.type, this.data, error, true);
            }

            if (callback) {
                if (error == "timeout") {
                    error = $.t("error_request_timeout");
                }
                callback({
                    "errorCode": -1,
                    "errorDescription": error
                }, {});
            }
        });
    };

    return BRS;
}(BRS || {}, jQuery));
