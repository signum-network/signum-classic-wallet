package brs.http;

import brs.Asset;
import brs.assetexchange.AssetExchange;
import com.google.gson.JsonArray;

import java.util.Iterator;

abstract class AbstractAssetsRetrieval extends APIServlet.JsonRequestHandler {

  private final AssetExchange assetExchange;

  AbstractAssetsRetrieval(APITag[] apiTags, AssetExchange assetExchange, String... parameters) {
    super(apiTags, parameters);
    this.assetExchange = assetExchange;
  }

  JsonArray assetsToJson(Iterator<Asset> assets) {
    final JsonArray assetsJsonArray = new JsonArray();

    while (assets.hasNext()) {
      final Asset asset = assets.next();

      int accountsCount = -1;
      int tradeCount = -1;
      int transferCount = -1;
      long circulatingSupply = assetExchange.getAssetCirculatingSupply(asset, true, false);

      assetsJsonArray.add(JSONData.asset(asset, tradeCount, transferCount, accountsCount, circulatingSupply));
    }

    return assetsJsonArray;
  }
}
