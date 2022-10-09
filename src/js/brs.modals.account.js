/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */
var BRS = (function(BRS, $, undefined) {
    BRS.userInfoModal = {
	"user": 0
    };

    BRS.showAccountModal = function(account) {
	if (BRS.fetchingModalData) {
	    return;
	}

	if (typeof account == "object") {
	    BRS.userInfoModal.user = account.account;
	}
        else {
	    BRS.userInfoModal.user = account;
	    BRS.fetchingModalData = true;
	}

	$("#user_info_modal_account").html(BRS.getAccountFormatted(BRS.userInfoModal.user));

	if (BRS.userInfoModal.user in BRS.contacts) {
	    var accountButton = BRS.contacts[BRS.userInfoModal.user].name.escapeHTML();
	    $("#user_info_modal_add_as_contact").hide();
	}
        else {
	    var accountButton = BRS.userInfoModal.user;
	    $("#user_info_modal_add_as_contact").show();
	}

	$("#user_info_modal_actions button").data("account", accountButton);

	if (BRS.fetchingModalData) {
	    BRS.sendRequest("getAccount", {
		"account": BRS.userInfoModal.user
	    }, function(response) {
		BRS.processAccountModalData(response);
		BRS.fetchingModalData = false;
	    });
	}
        else {
	    BRS.processAccountModalData(account);
	}

	$("#user_info_modal_transactions").show();

	BRS.userInfoModal.transactions();
    };

    BRS.processAccountModalData = function(account) {
	if (account.unconfirmedBalanceNQT == "0") {
	    $("#user_info_modal_account_balance").html("0");
	}
        else {
	    $("#user_info_modal_account_balance").html(BRS.formatAmount(account.unconfirmedBalanceNQT) + " " + BRS.valueSuffix);
	}

	if (account.name) {
	    $("#user_info_modal_account_name").html(String(account.name).escapeHTML());
	    $("#user_info_modal_account_name_container").show();
	}
        else {
	    $("#user_info_modal_account_name_container").hide();
	}

	if (account.description) {
	    $("#user_info_description").show();
	    $("#user_info_modal_description").html(String(account.description).escapeHTML().nl2br());
	}
        else {
	    $("#user_info_description").hide();
	}

	$("#user_info_modal").modal("show");
    };

    BRS.userInfoModal.transactions = function(type) {
        BRS.sendRequest("getAccountTransactions", {
            "account": BRS.userInfoModal.user,
            "firstIndex": 0,
            "lastIndex": BRS.pageSize,
            "includeIndirect": true
        }, function(response) {
            let rows = "";
            if (response.transactions && response.transactions.length) {
                for (const transaction of response.transactions) {
                    const details = BRS.getTransactionDetails(transaction, BRS.userInfoModal.user);

                    rows += "<tr>";
                    rows += "<td>" + BRS.formatTimestamp(transaction.timestamp) + "</td>"
                    rows += "<td>" + details.nameOfTransaction + "</td>"
                    rows += "<td>" + details.circleText + "</td>"
                    rows += `<td ${details.colorClass}>${details.amountToFromViewerHTML}</td>`;
                    rows += "<td>" + BRS.formatAmount(transaction.feeNQT) + "</td>"
                    rows += `<td>${details.accountTitle}</td>`
                    rows += "</tr>";
                }
            }
            $("#user_info_modal_transactions_table tbody").empty().append(rows);
            BRS.dataLoadFinished($("#user_info_modal_transactions_table"));
        });
    };

    BRS.userInfoModal.aliases = function() {
	BRS.sendRequest("getAliases", {
	    "account": BRS.userInfoModal.user,
	    "timestamp": 0
	}, function(response) {
	    var rows = "";

	    if (response.aliases && response.aliases.length) {
		var aliases = response.aliases;

		aliases.sort(function(a, b) {
		    if (a.aliasName.toLowerCase() > b.aliasName.toLowerCase()) {
			return 1;
		    }
                    else if (a.aliasName.toLowerCase() < b.aliasName.toLowerCase()) {
			return -1;
		    }
                    else {
			return 0;
		    }
		});

		var alias_account_count = 0,
		    alias_uri_count = 0,
		    empty_alias_count = 0,
		    alias_count = aliases.length;

		for (var i = 0; i < alias_count; i++) {
		    var alias = aliases[i];

		    rows += "<tr data-alias='" + String(alias.aliasName).toLowerCase().escapeHTML() + "'><td class='alias'>" + String(alias.aliasName).escapeHTML() + "</td><td class='uri'>" + (alias.aliasURI.indexOf("http") === 0 ? "<a href='" + String(alias.aliasURI).escapeHTML() + "' target='_blank'>" + String(alias.aliasURI).escapeHTML() + "</a>" : String(alias.aliasURI).escapeHTML()) + "</td></tr>";
		    if (!alias.uri) {
			empty_alias_count++;
		    }
                    else if (alias.aliasURI.indexOf("http") === 0) {
			alias_uri_count++;
		    }
                    else if (alias.aliasURI.indexOf("acct:") === 0 || alias.aliasURI.indexOf("nacc:") === 0) {
			alias_account_count++;
		    }
		}
	    }

	    $("#user_info_modal_aliases_table tbody").empty().append(rows);
	    BRS.dataLoadFinished($("#user_info_modal_aliases_table"));
	});
    };

    BRS.userInfoModal.marketplace = function() {
	BRS.sendRequest("getDGSGoods", {
	    "seller": BRS.userInfoModal.user,
	    "firstIndex": 0,
	    "lastIndex": 99
	}, function(response) {
	    var rows = "";

	    if (response.goods && response.goods.length) {
		for (var i = 0; i < response.goods.length; i++) {
		    var good = response.goods[i];
		    if (good.name.length > 150) {
			good.name = good.name.substring(0, 150) + "...";
		    }
		    rows += "<tr><td><a href='#' data-goto-goods='" + String(good.goods).escapeHTML() + "' data-seller='" + String(BRS.userInfoModal.user).escapeHTML() + "'>" + String(good.name).escapeHTML() + "</a></td><td>" + BRS.formatAmount(good.priceNQT) + " " + BRS.valueSuffix + "</td><td>" + BRS.format(good.quantity) + "</td></tr>";
		}
	    }

	    $("#user_info_modal_marketplace_table tbody").empty().append(rows);
	    BRS.dataLoadFinished($("#user_info_modal_marketplace_table"));
	});
    };

    BRS.userInfoModal.assets = function() {
	BRS.sendRequest("getAccount", {
	    "account": BRS.userInfoModal.user
	}, function(response) {
	    if (response.assetBalances && response.assetBalances.length) {
		var assets = {};
		var nrAssets = 0;
		var ignoredAssets = 0;

		for (var i = 0; i < response.assetBalances.length; i++) {
		    if (response.assetBalances[i].balanceQNT == "0") {
			ignoredAssets++;

			if (nrAssets + ignoredAssets == response.assetBalances.length) {
			    BRS.userInfoModal.addIssuedAssets(assets);
			}
			continue;
		    }

		    BRS.sendRequest("getAsset", {
			"asset": response.assetBalances[i].asset,
			"_extra": {
			    "balanceQNT": response.assetBalances[i].balanceQNT
			}
		    }, function(asset, input) {
			asset.asset = input.asset;
			asset.balanceQNT = input._extra.balanceQNT;

			assets[asset.asset] = asset;
			nrAssets++;

			if (nrAssets + ignoredAssets == response.assetBalances.length) {
			    BRS.userInfoModal.addIssuedAssets(assets);
			}
		    });
		}
	    }
            else {
		BRS.userInfoModal.addIssuedAssets({});
	    }
	});
    };

    BRS.userInfoModal.addIssuedAssets = function(assets) {
	BRS.sendRequest("getAssetsByIssuer", {
	    "account": BRS.userInfoModal.user
	}, function(response) {
	    if (response.assets && response.assets.length) {
		$.each(response.assets, function(key, issuedAsset) {
		    if (assets[issuedAsset.asset]) {
			assets[issuedAsset.asset].issued = true;
		    }
                    else {
			issuedAsset.balanceQNT = "0";
			issuedAsset.issued = true;
			assets[issuedAsset.asset] = issuedAsset;
		    }
		});

		BRS.userInfoModal.assetsLoaded(assets);
	    }
            else if (!$.isEmptyObject(assets)) {
		BRS.userInfoModal.assetsLoaded(assets);
	    }
            else {
		$("#user_info_modal_assets_table tbody").empty();
		BRS.dataLoadFinished($("#user_info_modal_assets_table"));
	    }
	});
    };

    BRS.userInfoModal.assetsLoaded = function(assets) {
	var assetArray = [];
	var rows = "";

	$.each(assets, function(key, asset) {
	    assetArray.push(asset);
	});

	assetArray.sort(function(a, b) {
	    if (a.issued && b.issued) {
		if (a.name.toLowerCase() > b.name.toLowerCase()) {
		    return 1;
		}
                else if (a.name.toLowerCase() < b.name.toLowerCase()) {
		    return -1;
		}
                else {
		    return 0;
		}
	    }
            else if (a.issued) {
		return -1;
	    }
            else if (b.issued) {
		return 1;
	    }
            else {
		if (a.name.toLowerCase() > b.name.toLowerCase()) {
		    return 1;
		}
                else if (a.name.toLowerCase() < b.name.toLowerCase()) {
		    return -1;
		}
                else {
		    return 0;
		}
	    }
	});

	for (var i = 0; i < assetArray.length; i++) {
	    var asset = assetArray[i];

	    var percentageAsset = BRS.calculatePercentage(asset.balanceQNT, asset.quantityCirculatingQNT);

	    rows += "<tr" + (asset.issued ? " class='asset_owner'" : "") + "><td><a href='#' data-goto-asset='" + String(asset.asset).escapeHTML() + "'" + (asset.issued ? " style='font-weight:bold'" : "") + ">" + String(asset.name).escapeHTML() + "</a></td><td class='quantity'>" + BRS.formatQuantity(asset.balanceQNT, asset.decimals) + "</td><td>" + BRS.formatQuantity(asset.quantityCirculatingQNT, asset.decimals) + "</td><td>" + percentageAsset + "%</td></tr>";
	}

	$("#user_info_modal_assets_table tbody").empty().append(rows);

	BRS.dataLoadFinished($("#user_info_modal_assets_table"));
    };

    return BRS;
}(BRS || {}, jQuery));
