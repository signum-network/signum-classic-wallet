/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */
var BRS = (function(BRS, $, undefined) {

    BRS.forms.setAccountInfoComplete = function(response, data) {
	var name = $.trim(String(data.name));
	if (name) {
	    $("#account_name").html(name.escapeHTML()).removeAttr("data-i18n");
	}
        else {
	    $("#account_name").html($.t("no_name_set")).attr("data-i18n", "no_name_set");
	}

	var description = $.trim(String(data.description));

	setTimeout(function() {
	    BRS.accountInfo.description = description;
	    BRS.accountInfo.name = name;
	}, 1000);
    };

    return BRS;
}(BRS || {}, jQuery));
