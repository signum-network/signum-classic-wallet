package brs.http;

import brs.Account;
import brs.Asset;
import brs.BurstException;
import brs.assetexchange.AssetExchange;
import brs.services.ParameterService;
import brs.util.Convert;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.Parameters.*;

final class GetAssetAccounts extends APIServlet.JsonRequestHandler {

  private final ParameterService parameterService;
  private final AssetExchange assetExchange;

  GetAssetAccounts(ParameterService parameterService, AssetExchange assetExchange) {
    super(new APITag[]{APITag.AE}, ASSET_PARAMETER, ASSET_IGNORE_TREASURY_PARAMETER, QUANTITY_MININUM_QNT_PARAMETER, FIRST_INDEX_PARAMETER, LAST_INDEX_PARAMETER);
    this.parameterService = parameterService;
    this.assetExchange = assetExchange;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {

    Asset asset = parameterService.getAsset(req);
    int firstIndex = ParameterParser.getFirstIndex(req);
    int lastIndex = ParameterParser.getLastIndex(req);
    long minimumQuantity = Convert.parseUnsignedLong(req.getParameter(QUANTITY_MININUM_QNT_PARAMETER));
    // default is to filter out ignored accounts
    boolean filterTreasury = "false".equals(req.getParameter(ASSET_IGNORE_TREASURY_PARAMETER)) ? false : true;

    JsonArray accountAssets = new JsonArray();
    for (Account.AccountAsset accountAsset : assetExchange.getAssetAccounts(asset,
        filterTreasury, minimumQuantity, false, firstIndex, lastIndex)) {
      accountAssets.add(JSONData.accountAsset(accountAsset));
    }

    JsonObject response = new JsonObject();
    response.add("accountAssets", accountAssets);
    return response;
  }
}
