package brs.http;

import static brs.http.JSONResponses.NOT_ENOUGH_ASSETS;
import static brs.http.common.Parameters.AMOUNT_NQT_PARAMETER;
import static brs.http.common.Parameters.ASSET_IDS_AND_QUANTITIES_PARAMETER;
import static brs.http.common.Parameters.RECIPIENT_PARAMETER;

import java.util.ArrayList;

import javax.servlet.http.HttpServletRequest;

import com.google.gson.JsonElement;

import brs.Account;
import brs.Asset;
import brs.Attachment;
import brs.Blockchain;
import brs.Burst;
import brs.BurstException;
import brs.Constants;
import brs.fluxcapacitor.FluxValues;
import brs.services.AccountService;
import brs.services.ParameterService;
import brs.util.Convert;

public final class TransferAssetMulti extends CreateTransaction {

  private final ParameterService parameterService;
  private final Blockchain blockchain;
  private final AccountService accountService;

  public TransferAssetMulti(ParameterService parameterService, Blockchain blockchain, APITransactionManager apiTransactionManager, AccountService accountService) {
    super(new APITag[] {APITag.AE, APITag.CREATE_TRANSACTION}, apiTransactionManager, RECIPIENT_PARAMETER, ASSET_IDS_AND_QUANTITIES_PARAMETER, AMOUNT_NQT_PARAMETER);
    this.parameterService = parameterService;
    this.blockchain = blockchain;
    this.accountService = accountService;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {

    long recipient = ParameterParser.getRecipientId(req);
    Account account = parameterService.getSenderAccount(req);

    String assetIdsString = Convert.emptyToNull(req.getParameter(ASSET_IDS_AND_QUANTITIES_PARAMETER));

    if(assetIdsString == null) {
      return JSONResponses.missing(ASSET_IDS_AND_QUANTITIES_PARAMETER);
    }

    String[] assetIdsArray = assetIdsString.split(";", Constants.MAX_MULTI_ASSET_IDS);
    ArrayList<Long> assetIds = new ArrayList<>();
    ArrayList<Long> quantitiesQNT = new ArrayList<>();

    if(assetIdsArray.length == 0 || assetIdsArray.length > Constants.MAX_MULTI_ASSET_IDS) {
      return JSONResponses.incorrect(ASSET_IDS_AND_QUANTITIES_PARAMETER);
    }

    for(String assetIdString : assetIdsArray) {
      String[] assetIdAndQuantity = assetIdString.split(":", 2);
      long assetId = Convert.parseUnsignedLong(assetIdAndQuantity[0]);
      Asset asset = Burst.getStores().getAssetStore().getAsset(assetId);
      if(asset == null || assetIds.contains(assetId)) {
        return JSONResponses.incorrect(ASSET_IDS_AND_QUANTITIES_PARAMETER);
      }
      long quantityQNT = Long.parseLong(assetIdAndQuantity[1]);
      if(quantityQNT <= 0L) {
        return JSONResponses.incorrect(ASSET_IDS_AND_QUANTITIES_PARAMETER);
      }
      assetIds.add(assetId);
      quantitiesQNT.add(quantityQNT);

      long assetBalance = accountService.getUnconfirmedAssetBalanceQNT(account, assetId);
      if (assetBalance < 0 || quantityQNT > assetBalance) {
        return NOT_ENOUGH_ASSETS;
      }
    }

    long amountNQT = 0L;
    String amountValueNQT = Convert.emptyToNull(req.getParameter(AMOUNT_NQT_PARAMETER));
    if (amountValueNQT != null) {
      try {
        amountNQT = Long.parseLong(amountValueNQT);
      } catch (RuntimeException e) {
        return JSONResponses.incorrect(AMOUNT_NQT_PARAMETER);
      }
      if (amountNQT < 0 || amountNQT >= Constants.MAX_BALANCE_NQT) {
        return JSONResponses.incorrect(AMOUNT_NQT_PARAMETER);
      }
      else if (!Burst.getFluxCapacitor().getValue(FluxValues.SMART_TOKEN)) {
        return JSONResponses.incorrect(AMOUNT_NQT_PARAMETER);
      }
    }

    Attachment attachment = new Attachment.ColoredCoinsAssetMultiTransfer(assetIds, quantitiesQNT, blockchain.getHeight());
    return createTransaction(req, account, recipient, amountNQT, attachment);

  }

}
