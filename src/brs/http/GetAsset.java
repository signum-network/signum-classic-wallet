package brs.http;

import brs.Asset;
import brs.BurstException;
import brs.assetexchange.AssetExchange;
import brs.services.ParameterService;
import brs.util.Convert;

import com.google.gson.JsonElement;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.Parameters.ASSET_PARAMETER;
import static brs.http.common.Parameters.QUANTITY_MININUM_QNT_PARAMETER;

public final class GetAsset extends APIServlet.JsonRequestHandler {

  private final ParameterService parameterService;
  private final AssetExchange assetExchange;

  GetAsset(ParameterService parameterService, AssetExchange assetExchange) {
    super(new APITag[]{APITag.AE}, ASSET_PARAMETER, QUANTITY_MININUM_QNT_PARAMETER);
    this.parameterService = parameterService;
    this.assetExchange = assetExchange;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {
    final Asset asset = parameterService.getAsset(req);
    long minimumQuantity = Convert.parseUnsignedLong(req.getParameter(QUANTITY_MININUM_QNT_PARAMETER));

    int tradeCount = assetExchange.getTradeCount(asset.getId());
    int transferCount = assetExchange.getTransferCount(asset.getId());
    int accountsCount = assetExchange.getAssetAccountsCount(asset, minimumQuantity, true, false);
    long circulatingSupply = assetExchange.getAssetCirculatingSupply(asset, true, false);

    return JSONData.asset(asset, tradeCount, transferCount, accountsCount, circulatingSupply);
  }

}
