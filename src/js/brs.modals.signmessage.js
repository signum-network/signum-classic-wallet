/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */
var BRS = (function(BRS, $, undefined) {

    BRS.forms.signModalButtonClicked = function() {
		if ($("#sign_message_nav").hasClass("active")) {
			BRS.forms.signMessage();
		} else {
		    BRS.forms.verifyMessage();
		}
    };

    BRS.forms.signMessage = function() {
        var isHex = $("#sign_message_data_is_hex").is(":checked");
        var data = $("#sign_message_data").val();
        var passphrase = converters.stringToHexString($("#sign_message_passphrase").val());
        if (!isHex) data = converters.stringToHexString(data);
        BRS.sendRequest("parseTransaction", { "transactionBytes": data }, function(result) {
            console.log(result);
            if (result.errorCode == null) {
                $("#sign_message_error").text("WARNING: YOU ARE SIGNING A TRANSACTION. IF YOU WERE NOT TRYING TO SIGN A TRANSACTION MANUALLY, DO NOT GIVE THIS SIGNATURE OUT. IT COULD ALLOW OTHERS TO SPEND YOUR FUNDS.");
                $("#sign_message_error").show();
            }
            signature = BRS.signBytes(data, passphrase);
            $("#sign_message_output").text("Signature is " + signature + ". Your public key is " + BRS.getPublicKey(passphrase));
            $("#sign_message_output").show();
        }, false);
    };

    BRS.forms.verifyMessage = function() {
        var isHex = $("#verify_message_data_is_hex").is(":checked");
        var data = $("#verify_message_data").val();
        var signature = $.trim($("#verify_message_signature").val());
        var publicKey = $.trim($("#verify_message_public_key").val());
        if (!isHex) data = converters.stringToHexString(data);
        var result = BRS.verifyBytes(signature, data, publicKey);
        if (result) {
            $("#verify_message_error").hide();
            $("#verify_message_output").text("Signature is valid");
            $("#verify_message_output").show();
        } else {
            $("#verify_message_output").hide();
            $("#verify_message_error").text("Signature is invalid");
            $("#verify_message_error").show();
        }
    };

    return BRS;
}(BRS || {}, jQuery));
