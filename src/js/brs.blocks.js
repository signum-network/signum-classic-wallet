/**
 * @depends {brs.js}
 */
var BRS = (function(BRS, $, undefined) {
    BRS.blocksPageType = null;
    BRS.tempBlocks = [];
    var trackBlockchain = false;

    BRS.getBlock = function(blockID, callback, pageRequest) {
        BRS.sendRequest("getBlock" + (pageRequest ? "+" : ""), {
            "block": blockID
        }, function(response) {
            if (response.errorCode && response.errorCode == -1) {
                BRS.getBlock(blockID, callback, pageRequest);
            }
            else {
                if (callback) {
                    response.block = blockID;
                    callback(response);
                }
            }
        }, true);
    };

    BRS.handleInitialBlocks = function(response) {
        if (response.errorCode) {
            BRS.dataLoadFinished($("#dashboard_blocks_table"));
            return;
        }

        BRS.blocks.push(response);

        if (BRS.blocks.length < 10 && response.previousBlock) {
            BRS.getBlock(response.previousBlock, BRS.handleInitialBlocks);
        }
        else {
            BRS.checkBlockHeight(BRS.blocks[0].height);

            if (BRS.state) {
                //if no new blocks in 6 hours, show blockchain download progress..
                var timeDiff = BRS.state.time - BRS.blocks[0].timestamp;
                if (timeDiff > 60 * 60 * 18) {
                    if (timeDiff > 60 * 60 * 24 * 14) {
                        BRS.setStateInterval(30);
                    }
                    else if (timeDiff > 60 * 60 * 24 * 7) {
                        //second to last week
                        BRS.setStateInterval(15);
                    }
                    else {
                        //last week
                        BRS.setStateInterval(10);
                    }
                    BRS.downloadingBlockchain = true;
                    $("#brs_update_explanation span").hide();
                    $("#brs_update_explanation_wait").attr("style", "display: none !important");
                    $("#downloading_blockchain, #brs_update_explanation_blockchain_sync").show();
                    $("#show_console").hide();
                    BRS.updateBlockchainDownloadProgress();
                }
                else {
                    //continue with faster state intervals if we still haven't reached current block from within 1 hour
                    if (timeDiff < 60 * 60) {
                        BRS.setStateInterval(30);
                        trackBlockchain = false;
                    }
                    else {
                        BRS.setStateInterval(10);
                        trackBlockchain = true;
                    }
                }
            }

            var rows = "";

            for (var i = 0; i < BRS.blocks.length; i++) {
                var block = BRS.blocks[i];

                rows += "<tr><td><a href='#' data-block='" + String(block.height).escapeHTML() + "' data-blockid='" + String(block.block).escapeHTML() + "' class='block'" + (block.numberOfTransactions > 0 ? " style='font-weight:bold'" : "") + ">" + String(block.height).escapeHTML() + "</a></td><td data-timestamp='" + String(block.timestamp).escapeHTML() + "'>" + BRS.formatTimestamp(block.timestamp) + "</td><td>" + BRS.formatAmount(block.totalAmountNQT) + " + " + BRS.formatAmount(block.totalFeeNQT) + "</td><td>" + BRS.formatAmount(block.numberOfTransactions) + "</td></tr>";
            }

            $("#dashboard_blocks_table tbody").empty().append(rows);
            BRS.dataLoadFinished($("#dashboard_blocks_table"));
        }
    };

    BRS.handleNewBlocks = function(response) {
        if (BRS.downloadingBlockchain) {
            //new round started...
            if (BRS.tempBlocks.length === 0 && BRS.state.lastBlock != response.block) {
                return;
            }
        }

        //we have all blocks
        if (response.height - 1 == BRS.lastBlockHeight || BRS.tempBlocks.length == 99) {
            var newBlocks = [];

            //there was only 1 new block (response)
            if (BRS.tempBlocks.length === 0) {
                //remove oldest block, add newest block
                BRS.blocks.unshift(response);
                newBlocks.push(response);
            }
            else {
                BRS.tempBlocks.push(response);
                //remove oldest blocks, add newest blocks
                [].unshift.apply(BRS.blocks, BRS.tempBlocks);
                newBlocks = BRS.tempBlocks;
                BRS.tempBlocks = [];
            }

            if (BRS.blocks.length > 100) {
                BRS.blocks = BRS.blocks.slice(0, 100);
            }

            BRS.checkBlockHeight(BRS.blocks[0].height);

            BRS.incoming.updateDashboardBlocks(newBlocks);
        }
        else {
            BRS.tempBlocks.push(response);
            BRS.getBlock(response.previousBlock, BRS.handleNewBlocks);
        }
    };

    BRS.checkBlockHeight = function(blockHeight) {
        if (blockHeight) {
            BRS.lastBlockHeight = blockHeight;
        }

        //no checks needed at the moment
    };

    //we always update the dashboard page..
    BRS.incoming.updateDashboardBlocks = function(newBlocks) {
        var newBlockCount = newBlocks.length;

        if (newBlockCount > 10) {
            newBlocks = newBlocks.slice(0, 10);
            newBlockCount = newBlocks.length;
        }
        var timeDiff;
        if (BRS.downloadingBlockchain) {
            if (BRS.state) {
                timeDiff = BRS.state.time - BRS.blocks[0].timestamp;
                if (timeDiff < 60 * 60 * 18) {
                    if (timeDiff < 60 * 60) {
                        BRS.setStateInterval(30);
                    }
                    else {
                        BRS.setStateInterval(10);
                        trackBlockchain = true;
                    }
                    BRS.downloadingBlockchain = false;
                    $("#dashboard_message").hide();
                    $("#downloading_blockchain, #brs_update_explanation_blockchain_sync").hide();
                    $("#brs_update_explanation_wait").removeAttr("style");
                    if (BRS.settings.console_log && !BRS.inApp) {
                        $("#show_console").show();
                    }
                    $.notify($.t("success_blockchain_up_to_date"), { type: 'success' });
                    BRS.checkIfOnAFork();
                }
                else {
                    if (timeDiff > 60 * 60 * 24 * 14) {
                        BRS.setStateInterval(30);
                    }
                    else if (timeDiff > 60 * 60 * 24 * 7) {
                        //second to last week
                        BRS.setStateInterval(15);
                    }
                    else {
                        //last week
                        BRS.setStateInterval(10);
                    }

                    BRS.updateBlockchainDownloadProgress();
                }
            }
        }
        else if (trackBlockchain) {
            timeDiff = BRS.state.time - BRS.blocks[0].timestamp;

            //continue with faster state intervals if we still haven't reached current block from within 1 hour
            if (timeDiff < 60 * 60) {
                BRS.setStateInterval(30);
                trackBlockchain = false;
            }
            else {
                BRS.setStateInterval(10);
            }
        }

        var rows = "";

        for (var i = 0; i < newBlockCount; i++) {
            var block = newBlocks[i];

            rows += "<tr><td><a href='#' data-block='" + String(block.height).escapeHTML() + "' data-blockid='" + String(block.block).escapeHTML() + "' class='block'" + (block.numberOfTransactions > 0 ? " style='font-weight:bold'" : "") + ">" + String(block.height).escapeHTML() + "</a></td><td data-timestamp='" + String(block.timestamp).escapeHTML() + "'>" + BRS.formatTimestamp(block.timestamp) + "</td><td>" + BRS.formatAmount(block.totalAmountNQT) + " + " + BRS.formatAmount(block.totalFeeNQT) + "</td><td>" + BRS.formatAmount(block.numberOfTransactions) + "</td></tr>";
        }

        if (newBlockCount == 1) {
            $("#dashboard_blocks_table tbody tr:last").remove();
        }
        else if (newBlockCount == 10) {
            $("#dashboard_blocks_table tbody").empty();
        }
        else {
            $("#dashboard_blocks_table tbody tr").slice(10 - newBlockCount).remove();
        }

        $("#dashboard_blocks_table tbody").prepend(rows);

        //update number of confirmations... perhaps we should also update it in tne BRS.transactions array
        $("#dashboard_transactions_table tr.confirmed td.confirmations").each(function() {
            if ($(this).data("incoming")) {
                $(this).removeData("incoming");
                return true;
            }

            var confirmations = parseInt($(this).data("confirmations"), 10);

            var nrConfirmations = confirmations + newBlocks.length;

            if (confirmations <= 10) {
                $(this).data("confirmations", nrConfirmations);
                $(this).attr("data-content", $.t("x_confirmations", {
                    "x": BRS.formatAmount(nrConfirmations, false, true)
                }));

                if (nrConfirmations > 10) {
                    nrConfirmations = '10+';
                }
                $(this).html(nrConfirmations);
            }
            else {
                $(this).attr("data-content", $.t("x_confirmations", {
                    "x": BRS.formatAmount(nrConfirmations, false, true)
                }));
            }
        });
    };

    BRS.pages.blocks_forged = function() {
        BRS.sendRequest("getAccountBlockIds+", {
            "account": BRS.account,
            "timestamp": 0
        }, function(response) {
            if (!response.blockIds || response.blockIds.length == 0) {
                BRS.blocksPageLoaded([]);
                return;
            }
            // We have blocks!
            let blocks = [];
            let nrBlocks = 0;

            const blockIds = response.blockIds.slice(0, 100);

            if (response.blockIds.length > 100) {
                $("#blocks_page_forged_warning").show();
            }

            for (let i = 0; i < blockIds.length; i++) {
                BRS.sendRequest("getBlock+", {
                    "block": blockIds[i],
                    "_extra": {
                        "nr": i
                    }
                }, function(block, input) {
                    if (BRS.currentPage != "blocks_forged") {
                        blocks = {};
                        return;
                    }

                    block.block = input.block;
                    blocks[input._extra.nr] = block;
                    nrBlocks++;

                    if (nrBlocks == blockIds.length) {
                        BRS.blocksPageLoaded(blocks);
                    }
                });
            }
        });
    }

    BRS.pages.block_info = function() {
        BRS.blocksInfoLoad('');
    }

    BRS.blocksInfoLoad = function (blockheight) {
        if (blockheight === '') {
            blockheight = BRS.blocks[0].height.toString()
        }
        BRS.sendRequest("getBlock+", {
            "height": blockheight,
            "includeTransactions": true
        }, function(response) {
            if (response.errorCode) {
                $.notify($.t('invalid_blockheight'), { type: 'danger' })
                BRS.dataLoaded('');
                return
            }
            $('#block_info_input_block').val(blockheight)
            const rows = response.transactions.reduce((prev, currTr) => prev + getTransactionInBlocksRowHTML(currTr), '')
            BRS.dataLoaded(rows);
        })
    };

    function getTransactionInBlocksRowHTML(transaction) {
        const details = BRS.getTransactionDetails(transaction);

        let rowStr = ''
        rowStr += "<tr>";
        rowStr += "<td><a href='#' data-transaction='" + String(transaction.transaction).escapeHTML() + "'>" + String(transaction.transaction).escapeHTML() + "</a></td>"
        rowStr += "<td>" + (details.hasMessage ? "<i class='far fa-envelope-open'></i>&nbsp;" : "") + "</td>"
        rowStr += "<td>" + BRS.formatTimestamp(transaction.timestamp) + "</td>"
        rowStr += "<td>" + details.nameOfTransaction + "</td>"
        rowStr += "<td>" + details.senderHTML + "</td>"
        rowStr += "<td>" + details.recipientHTML + "</td>"
        rowStr += "<td>" + details.circleText + "</td>"
        rowStr += `<td ${details.colorClass}>${details.amountToFromViewerHTML}</td>`
        rowStr += "<td>" + BRS.formatAmount(transaction.feeNQT) + "</td>"
        rowStr += "</tr>";

        return rowStr;
    };

    BRS.pages.blocks = function() {
        if (BRS.blocks.length >= 100 || BRS.downloadingBlockchain) {
            // Just show what we have
            BRS.blocksPageLoaded(BRS.blocks);
            return;
        }
        if (BRS.blocks.length < 2) {
            // should never happens because dashboard already loaded 10 of them
            // buuut then show nothing
            BRS.blocksPageLoaded([]);
            return;
        }
        // partial blocks only, fetch 100 of them
        const previousBlock = BRS.blocks[BRS.blocks.length - 1].previousBlock;
        //if previous block is undefined, dont try add it
        if (typeof previousBlock !== "undefined") {
            BRS.getBlock(previousBlock, BRS.finish100Blocks, true);
        }
    }

    BRS.incoming.blocks = function() {
        BRS.loadPage("blocks");
    };

    BRS.finish100Blocks = function(response) {
        BRS.blocks.push(response);
        if (BRS.blocks.length < 100 && typeof response.previousBlock !== "undefined") {
            BRS.getBlock(response.previousBlock, BRS.finish100Blocks, true);
        }
        else {
            BRS.blocksPageLoaded(BRS.blocks);
        }
    };

    BRS.blocksPageLoaded = function(blocks) {
        var rows = "";
        var totalAmount = new BigInteger("0");
        var totalFees = new BigInteger("0");
        var totalTransactions = 0;
        var time;
        var endingTime;
        var startingTime;

        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];

            totalAmount = totalAmount.add(new BigInteger(block.totalAmountNQT));

            totalFees = totalFees.add(new BigInteger(block.totalFeeNQT));

            totalTransactions += block.numberOfTransactions;

            rows += "<tr><td><a href='#' data-block='" + String(block.height).escapeHTML() + "' data-blockid='" + String(block.block).escapeHTML() + "' class='block'" + (block.numberOfTransactions > 0 ? " style='font-weight:bold'" : "") + ">" + String(block.height).escapeHTML() + "</a></td><td>" + BRS.formatTimestamp(block.timestamp) + "</td><td>" + BRS.formatAmount(block.totalAmountNQT) + "</td><td>" + BRS.formatAmount(block.totalFeeNQT) + "</td><td>" + BRS.formatAmount(block.numberOfTransactions) + "</td><td>" + (block.generator != BRS.genesis ? "<a href='#' data-user='" + BRS.getAccountFormatted(block, "generator") + "' class='user_info'>" + BRS.getAccountTitle(block, "generator") + "</a>" : $.t("genesis")) + "</td><td>" + BRS.formatVolume(block.payloadLength) + "</td><td>" + Math.round(block.baseTarget / 153722867 * 100).pad(4) + " %</td></tr>";
        }

        if (blocks.length) {
            startingTime = blocks[blocks.length - 1].timestamp;
            endingTime = blocks[0].timestamp;
            time = endingTime - startingTime;
        }
        else {
            startingTime = endingTime = time = 0;
        }
        var averageFee;
        var averageAmount;
        var blockCount;
        if (blocks.length) {
            averageFee = new Big(totalFees.toString()).div(new Big("100000000")).div(new Big(String(blocks.length))).toFixed(2);
            averageAmount = new Big(totalAmount.toString()).div(new Big("100000000")).div(new Big(String(blocks.length))).toFixed(2);
        }
        else {
            averageFee = 0;
            averageAmount = 0;
        }

        averageFee = BRS.convertToNQT(averageFee);
        averageAmount = BRS.convertToNQT(averageAmount);

        if (BRS.currentPage == "blocks_forged") {
            if (blocks.length == 100) {
                blockCount = blocks.length + "+";
            }
            else {
                blockCount = blocks.length;
            }
            $("#blocks_forged_average_fee").html(BRS.formatStyledAmount(averageFee)).removeClass("loading_dots");
            $("#blocks_forged_average_amount").html(BRS.formatStyledAmount(averageAmount)).removeClass("loading_dots");
            $("#forged_blocks_total").html(blockCount).removeClass("loading_dots");
            $("#forged_fees_total").html(BRS.formatStyledAmount(BRS.accountInfo.forgedBalanceNQT)).removeClass("loading_dots");
        }
        else {
            if (time === 0) {
                $("#blocks_transactions_per_hour").html("0").removeClass("loading_dots");
            }
            else {
                $("#blocks_transactions_per_hour").html(Math.round(totalTransactions / (time / 60) * 60)).removeClass("loading_dots");
            }
            $("#blocks_average_fee").html(BRS.formatStyledAmount(averageFee)).removeClass("loading_dots");
            $("#blocks_average_amount").html(BRS.formatStyledAmount(averageAmount)).removeClass("loading_dots");
            $("#blocks_average_generation_time").html(Math.round(time / 100) + "s").removeClass("loading_dots");
        }

        BRS.dataLoaded(rows);
    };

    return BRS;
}(BRS || {}, jQuery));
