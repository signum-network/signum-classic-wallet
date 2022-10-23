/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */
var BRS = (function(BRS, $, undefined) {

    BRS.evBlocksTableClick = function(event) {
        event.preventDefault();
        if (BRS.fetchingModalData) {
            return;
        }
        BRS.fetchingModalData = true;
        const blockHeight = $(this).data("block");
        BRS.sendRequest("getBlock+", {
            "height": blockHeight,
            "includeTransactions": "true"
        }, function(response) {
            BRS.showBlockModal(response);
        });
    };

    BRS.showBlockModal = function(block) {
        $("#block_info_modal_block").html(String(block.block).escapeHTML());
        $("#block_info_transactions_tab_link").tab("show");
        const blockDetails = $.extend({}, block);
        delete blockDetails.transactions;
        delete blockDetails.previousBlockHash;
        delete blockDetails.nextBlockHash;
        delete blockDetails.generationSignature;
        delete blockDetails.payloadHash;
        delete blockDetails.block;
        $("#block_info_details_table tbody").empty().append(BRS.createInfoTable(blockDetails));
        $("#block_info_details_table").show();
        if (block.transactions.length === 0) {
            $("#block_info_transactions_none").show();
            $("#block_info_transactions_table").hide();
            $("#block_info_modal").modal("show");
            BRS.fetchingModalData = false;
            return
        }
        $("#block_info_transactions_none").hide();
        $("#block_info_transactions_table").show();
        block.transactions.sort(function(a, b) {
            return a.timestamp - b.timestamp;
        });
        let rows = "";
        for (const transaction of block.transactions) {
            const details = BRS.getTransactionDetails(transaction);
            rows += "<tr>";
    
            rows += "<td><a href='#' data-transaction='" + String(transaction.transaction).escapeHTML() + "'>" + String(transaction.transaction.slice(0,7) + "…").escapeHTML() + "</a><br>"
            rows += details.nameOfTransaction + "</td>"
            rows += "<td>" + details.senderHTML + "</td>"
            rows += "<td>" + details.recipientHTML + "</td>"
            rows += `<td ${details.colorClass}>${details.amountToFromViewerHTML}</td>`
            rows += "<td>" + BRS.formatAmount(transaction.feeNQT) + "</td>"
            rows += "</tr>";
        }
        $("#block_info_transactions_table tbody").empty().append(rows);
        $("#block_info_modal").modal("show");
        BRS.fetchingModalData = false;
    };

    return BRS;
}(BRS || {}, jQuery));
