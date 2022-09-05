package brs.http;

import brs.*;
import brs.assetexchange.AssetExchange;
import brs.fluxcapacitor.FluxValues;
import brs.services.ParameterService;
import com.google.gson.JsonElement;

import javax.servlet.http.HttpServletRequest;

import static brs.http.JSONResponses.INCORRECT_ASSET_QUANTITY;
import static brs.http.common.Parameters.*;

public final class MintAsset extends CreateTransaction {

  private final ParameterService parameterService;
  private final Blockchain blockchain;
  private final AssetExchange assetExchange;

  public MintAsset(ParameterService parameterService, Blockchain blockchain,
      APITransactionManager apiTransactionManager, AssetExchange assetExchange) {
    super(new APITag[] {APITag.AE, APITag.CREATE_TRANSACTION}, apiTransactionManager, ASSET_PARAMETER, QUANTITY_QNT_PARAMETER);
    this.parameterService = parameterService;
    this.blockchain = blockchain;
    this.assetExchange = assetExchange;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {

    Asset asset = parameterService.getAsset(req);
    long quantityQNT = ParameterParser.getQuantityQNT(req);
    Account account = parameterService.getSenderAccount(req);

    if(asset.getMintable() == false) {
      return JSONResponses.incorrect("this asset is not mintable");
    }
    if(!Burst.getFluxCapacitor().getValue(FluxValues.SMART_TOKEN)) {
      return JSONResponses.incorrect("minting assets is not enabled yet");
    }
    if(asset.getAccountId() != account.getId()) {
      return JSONResponses.incorrect("only the asset issuer can mint new coins");
    }

    boolean unconfirmed = !Burst.getFluxCapacitor().getValue(FluxValues.DISTRIBUTION_FIX);
    long circulatingSupply = assetExchange.getAssetCirculatingSupply(asset, false, unconfirmed);
    long newSupply = circulatingSupply + quantityQNT;
    if (newSupply > Constants.MAX_ASSET_QUANTITY_QNT) {
      throw new ParameterException(INCORRECT_ASSET_QUANTITY);
    }

    Attachment attachment = new Attachment.ColoredCoinsAssetMint(asset.getId(), quantityQNT, blockchain.getHeight());
    return createTransaction(req, account, null, 0, attachment);

  }

}
