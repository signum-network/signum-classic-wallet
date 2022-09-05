package brs.http;

import brs.Account;
import brs.BurstException;
import brs.assetexchange.AssetExchange;
import brs.services.ParameterService;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.http.HttpServletRequest;

import static brs.http.common.Parameters.*;
import static brs.http.common.ResultFields.ASSETS_RESPONSE;

public final class GetAssetsByIssuer extends AbstractAssetsRetrieval {

  private final ParameterService parameterService;
  private final AssetExchange assetExchange;

  GetAssetsByIssuer(ParameterService parameterService, AssetExchange assetExchange) {
    super(new APITag[] {APITag.AE, APITag.ACCOUNTS}, assetExchange, ACCOUNT_PARAMETER, FIRST_INDEX_PARAMETER, LAST_INDEX_PARAMETER);
    this.parameterService = parameterService;
    this.assetExchange = assetExchange;
  }

  @Override
  protected
  JsonElement processRequest(HttpServletRequest req) throws BurstException {
    Account account = parameterService.getAccount(req);
    int firstIndex = ParameterParser.getFirstIndex(req);
    int lastIndex = ParameterParser.getLastIndex(req);

    JsonObject response = new JsonObject();
    response.add(ASSETS_RESPONSE, assetsToJson(assetExchange.getAssetsIssuedBy(account.getId(), firstIndex, lastIndex).iterator()));

    return response;
  }

}
