/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */
var BRS = (function(BRS, $, undefined) {


    BRS.forms.generateToken = function($modal) {
	var data = $.trim($("#generate_token_data").val());

	if (!data) {
	    return {
		"error": "Data is a required field."
	    };
	}
        else {
	    return {};
	}
    };

    BRS.forms.generateTokenComplete = function(response, data) {
	$("#token_modal").find(".error_message").hide();

	if (response.token) {
	    $("#generate_token_output").html($.t("generated_token_is") + "<br /><br /><textarea style='width:100%' rows='3'>" + String(response.token).escapeHTML() + "</textarea>").show();
	}
        else {
	    $.notify($.t("error_generate_token"), {
		type: 'danger',
        offset: {
            x: 5,
            y: 60
            }
	    });
	    $("#generate_token_modal").modal("hide");
	}
    };

    BRS.forms.generateTokenError = function() {
	$("#generate_token_output").hide();
    };

    BRS.forms.decodeTokenComplete = function(response, data) {
	$("#token_modal").find(".error_message").hide();

	if (response.valid) {
	    $("#decode_token_output").html($.t("success_valid_token", {
		"account_link": BRS.getAccountLink(response, "account"),
		"timestamp": BRS.formatTimestamp(response.timestamp)
	    })).addClass("callout-info").removeClass("callout-danger").show();
	}
        else {
	    $("#decode_token_output").html($.t("error_invalid_token", {
		"account_link": BRS.getAccountLink(response, "account"),
		"timestamp": BRS.formatTimestamp(response.timestamp)
	    })).addClass("callout-danger").removeClass("callout-info").show();
	}
    };

    BRS.forms.decodeTokenError = function() {
	$("#decode_token_output").hide();
    };

    return BRS;
}(BRS || {}, jQuery));
